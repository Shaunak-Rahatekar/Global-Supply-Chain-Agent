# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import sys
import google.auth
from pydantic import BaseModel
from google.adk.workflow import Workflow
from google.adk.apps import App
from google.adk.events.event import Event
from google.adk.agents import LlmAgent
from google.adk.models import Gemini
from google.adk.agents.context import Context
from google.adk.events.request_input import RequestInput

# Add parent directory to path to import MCP tools
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'logistics-mcp')))
from server import get_maritime_weather, find_alternative_routes

# Setup environment for Vertex AI
try:
    _, project_id = google.auth.default()
    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
    os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"
except Exception as e:
    print(f"Warning: Could not set up Google Auth defaults: {e}")

# 1. Input Schema for the JSON Trigger Event
class CargoEvent(BaseModel):
    id: str
    priority: str
    delay_hours: int
    total_value: float
    corporate_buyer: str
    lat: float
    lon: float

class ReviewOutput(BaseModel):
    action: str
    cost_estimate: float

# 2. Node 1: Deterministic Screen
def deterministic_screen(node_input: CargoEvent):
    """
    Evaluates the cargo event. If priority is Low and delay < 24 hours, auto-approve.
    Otherwise, send for manual/LLM review.
    """
    if node_input.priority.lower() == "low" and node_input.delay_hours < 24:
        return Event(
            output={"status": "auto_approved", "reason": "Low priority, short delay", "id": node_input.id}, 
            route="auto_approved"
        )
    # Send for review if conditions aren't met
    return Event(output=node_input.model_dump(), route="needs_review")

# Node 2: Security Redaction
def security_redaction(node_input: dict):
    """
    Redacts sensitive financial data before passing to LLM or manual review.
    """
    redacted_data = node_input.copy()
    redacted_data["total_value"] = "[REDACTED]"
    redacted_data["corporate_buyer"] = "[REDACTED]"
    return Event(output=redacted_data, route="needs_review")

# Handlers for the routes to terminate the graph gracefully for now
def auto_approved_handler(node_input: dict):
    return node_input

def needs_review_handler(node_input: dict):
    return {"status": "needs_review", "event": node_input}

# Node 3: MCP Fetch Context
async def mcp_fetch_context(node_input: dict):
    """
    Programmatically fetches weather and routing context using the MCP tools.
    """
    lat = node_input.get("lat", 0.0)
    lon = node_input.get("lon", 0.0)
    cargo_id = node_input.get("id", "UNKNOWN")
    
    # Execute the MCP tools
    weather_info = await get_maritime_weather(lat, lon)
    routing_info = find_alternative_routes(cargo_id, "Unknown Port")
    
    # Enrich the payload
    node_input["mcp_context"] = {
        "weather": weather_info,
        "routes": routing_info
    }
    
    return Event(output=node_input, route="context_fetched")

# Node 4: LLM Review
llm_review = LlmAgent(
    name="llm_review",
    model=Gemini(model="gemini-flash-latest"),
    instruction="""You are a supply chain logistics expert. 
    You will receive redacted cargo information along with weather context and alternative route options.
    Calculate the cost-benefit of rerouting versus waiting. 
    If there is a severe storm or high winds, prioritize rerouting.
    Output your decision as structured JSON.""",
    output_schema=ReviewOutput,
)

from google.adk.workflow import node

# Node 5: Human in the Loop (Manager Approval)
@node(rerun_on_resume=True)
async def human_approval(ctx: Context, node_input: dict):
    """
    Node 5: Human Approval
    Uses ADK 2.0 RequestInput to pause the workflow execution.
    It prompts the Supply Chain Manager for final approval of the LLM's routing decision.
    Upon resumption, the manager's response is available in `ctx.resume_inputs`.
    """
    # If the workflow hasn't been resumed with an input, pause and ask the manager
    if not ctx.resume_inputs or "manager_approval" not in ctx.resume_inputs:
        action = node_input.get("action", "Unknown")
        cost = node_input.get("cost_estimate", 0.0)
        yield RequestInput(
            interrupt_id="manager_approval", 
            message=f"LLM proposed action: {action} with estimated cost: ${cost}. Do you approve? (Yes/No)"
        )
        return
    
    # When resumed, process the manager's decision
    approval = ctx.resume_inputs.get("manager_approval", "")
    
    # Emit final completion event
    yield Event(
        output={"status": "completed", "manager_decision": approval, "llm_plan": node_input},
        route="completed"
    )

def final_completion_handler(node_input: dict):
    return node_input

# =====================================================================
# ADK 2.0 WORKFLOW ARCHITECTURE OVERVIEW
# =====================================================================
# This workflow orchestrates the supply chain routing decision process:
# 
# 1. START -> deterministic_screen: Validates simple, low-risk cases 
#    and auto-approves them to save LLM cost. High-risk cargo proceeds.
# 2. security_redaction: Automatically strips sensitive financial data 
#    (total_value, corporate_buyer) before any external API or LLM calls.
# 3. mcp_fetch_context: Programmatically fetches live maritime weather 
#    and alternative inland routes from a local MCP server.
# 4. llm_review: A Gemini-powered LlmAgent node that ingests the 
#    redacted payload and MCP context to output a structured JSON plan 
#    (action & cost_estimate).
# 5. human_approval: Suspends execution using RequestInput to ask a 
#    human manager for final sign-off before completion.
# =====================================================================
root_agent = Workflow(
    name="cargo_workflow",
    input_schema=CargoEvent,
    edges=[
        ('START', deterministic_screen),
        (deterministic_screen, {
            "auto_approved": auto_approved_handler,
            "needs_review": security_redaction
        }),
        (security_redaction, {"needs_review": mcp_fetch_context}),
        (mcp_fetch_context, {"context_fetched": llm_review}),
        (llm_review, human_approval),
        (human_approval, {"completed": final_completion_handler}),
    ]
)

app = App(
    root_agent=root_agent,
    name="app",
)

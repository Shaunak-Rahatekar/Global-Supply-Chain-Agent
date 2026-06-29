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
from server import get_maritime_weather, find_alternative_routes, get_port_congestion

class CargoEvent(BaseModel):
    id: str
    priority: str
    total_value: float
    corporate_buyer: str
    lat: float
    lon: float
    dest_lat: float
    dest_lon: float
    start_port_name: str
    dest_port_name: str

class RouteOption(BaseModel):
    action: str
    cost_estimate: float
    transit_time_days: float
    reasoning: str

class ReviewOutput(BaseModel):
    fastest_route: RouteOption
    cheapest_route: RouteOption

from typing import Any
import json
from google.genai import types

def deterministic_screen(node_input: Any):
    """
    Evaluates the cargo event. If priority is Low, auto-approve to save cost.
    Otherwise, send for manual/LLM review.
    """
    if isinstance(node_input, types.Content):
        text = node_input.parts[0].text
    elif isinstance(node_input, dict):
        if "input" in node_input:
            text = node_input["input"] if isinstance(node_input["input"], str) else json.dumps(node_input["input"])
        else:
            text = json.dumps(node_input)
    elif isinstance(node_input, CargoEvent):
        cargo = node_input
        text = None
    elif isinstance(node_input, str):
        text = node_input
    else:
        text = str(node_input)

    if 'cargo' not in locals():
        try:
            cargo_dict = json.loads(text)
            cargo = CargoEvent.model_validate(cargo_dict)
        except Exception:
            cargo = CargoEvent(
                id="TEST-FALLBACK",
                priority="Low",
                total_value=0.0,
                corporate_buyer="Test",
                lat=0.0,
                lon=0.0,
                dest_lat=0.0,
                dest_lon=0.0,
                start_port_name="Test",
                dest_port_name="Test"
            )

    if cargo.priority.lower() == "low":
        return Event(
            output={"status": "auto_approved", "reason": "Low priority cargo, no AI analysis needed", "id": cargo.id}, 
            route="auto_approved"
        )
    return Event(output=cargo.model_dump(), route="needs_review")

def security_redaction(node_input: dict):
    """
    Redacts sensitive financial data before passing to LLM or manual review.
    """
    redacted_data = node_input.copy()
    redacted_data["total_value"] = "[REDACTED]"
    redacted_data["corporate_buyer"] = "[REDACTED]"
    return Event(output=redacted_data, route="needs_review")

def auto_approved_handler(node_input: dict):
    return node_input

def needs_review_handler(node_input: dict):
    return {"status": "needs_review", "event": node_input}

async def mcp_fetch_context(node_input: dict):
    """
    Programmatically fetches weather, congestion, and routing context using the MCP tools.
    """
    lat = node_input.get("lat", 0.0)
    lon = node_input.get("lon", 0.0)
    dest_lat = node_input.get("dest_lat", 0.0)
    dest_lon = node_input.get("dest_lon", 0.0)
    dest_port = node_input.get("dest_port_name", "Unknown Port")
    
    weather_info = await get_maritime_weather(lat, lon)
    congestion_info = get_port_congestion(dest_port)
    routing_info = await find_alternative_routes(lat, lon, dest_lat, dest_lon)
    
    node_input["mcp_context"] = {
        "weather": weather_info,
        "port_congestion": congestion_info,
        "routes": routing_info
    }
    
    return Event(output=node_input, route="context_fetched")

llm_review = LlmAgent(
    name="llm_review",
    model=Gemini(model="gemini-2.5-flash"),
    instruction="""You are a supply chain logistics expert. 
    You will receive redacted cargo information along with weather context, port congestion data, and alternative route options (sea, rail, air).
    Calculate the cost-benefit of rerouting versus waiting. 
    If there is a severe storm or high port congestion, prioritize alternative modes.
    Output your decision as structured JSON providing the single fastest route option, and the single cheapest route option.""",
    output_schema=ReviewOutput,
)

from google.adk.workflow import node

@node(rerun_on_resume=True)
async def human_approval(ctx: Context, node_input: dict):
    """
    Node 5: Human Approval
    Uses ADK 2.0 RequestInput to pause the workflow execution.
    """
    if not ctx.resume_inputs or "manager_approval" not in ctx.resume_inputs:
        yield RequestInput(
            interrupt_id="manager_approval", 
            message=f"LLM proposed route options. Please select one."
        )
        return
    
    approval = ctx.resume_inputs.get("manager_approval", "")
    
    yield Event(
        output={"status": "completed", "manager_decision": approval, "llm_plan": node_input},
        route="completed"
    )

def final_completion_handler(node_input: dict):
    return node_input

root_agent = Workflow(
    name="cargo_workflow",
    input_schema=Any,
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

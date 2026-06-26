# Global Supply Chain ADK Agent (Kaggle Capstone)

Welcome to the Global Supply Chain Agent repository! This project implements an advanced AI-driven logistics decision engine designed to solve the complex routing and cost-optimization challenges presented in the Kaggle Supply Chain optimization problem.

## 🏆 Project Overview (The Problem & Solution)

**1. The Kaggle Challenge:** Modern global supply chains face extreme volatility from weather events, geopolitical tensions, and port congestions. This capstone addresses the challenge of dynamically rerouting high-value cargo in real-time to minimize financial loss.
**2. The Inefficiency of Static Routing:** Traditional systems rely on static logic trees. If a typhoon hits a destination port, human managers often lack the consolidated data (weather + inland alternatives) to make split-second, cost-effective decisions.
**3. The Solution - Agentic AI:** We developed an autonomous, multi-node AI agent using the Google Agent Development Kit (ADK 2.0). 
**4. Dynamic Decision Making:** The agent dynamically ingests cargo data, fetches live context via a Model Context Protocol (MCP) server, and utilizes Gemini 1.5 Flash to weigh the cost of delays against the cost of rerouting.
**5. Security First:** Financial data (e.g., cargo value, corporate buyer) is strictly redacted before being passed to any LLM or external API.
**6. Human-in-the-Loop (HITL):** High-stakes decisions are never fully autonomous. The workflow pauses to request human approval via a sleek Command UI before executing a reroute.

## 🏗️ Architecture & Technical Stack

**7. ADK 2.0 Workflow Graph:** The core intelligence is built as a stateful Workflow Graph in Python, enabling complex routing based on event state.
**8. Node 1 - Deterministic Screen:** A fast-path router that auto-approves low-priority/low-delay cargo to save LLM inference costs.
**9. Node 2 - Security Redaction:** A sanitizer node that strips `total_value` and `corporate_buyer` to prevent PII/Financial leaks.
**10. Node 3 - MCP Context Fetcher:** Integrates locally with our `logistics-mcp` server to pull maritime weather and alternative inland routes based on the cargo's lat/lon.
**11. Node 4 - LLM Review (Gemini):** A `LlmAgent` node that ingests the redacted payload + MCP context to generate a structured JSON decision (Wait vs. Reroute) and a cost estimate.
**12. Node 5 - Human Approval:** Utilizes ADK's `RequestInput` feature to pause the graph execution and wait for human manager approval.
**13. Model Context Protocol (MCP):** A dedicated local server providing tools (`get_maritime_weather`, `find_alternative_routes`) to securely expose internal logistics data to the agent.
**14. Vite + React Frontend:** A premium, dark-themed "Logistics Command UI" built with Tailwind CSS and React-Leaflet to visualize the agent's state and trigger HITL approvals.
**15. Google Cloud Run Deployment:** The backend agent is containerized and deployed as a serverless Cloud Run service using ADK's scaffold infrastructure.

## 🚀 Setup & Installation Instructions

**16. Prerequisites:**
- Python 3.10+ and `uv` package manager installed.
- Node.js and `npm` installed.
- Google Cloud CLI (`gcloud`) authenticated to your project.
- Gemini API Key.

**17. Backend Setup:**
```bash
# Navigate to the project root
cd supply-chain-capstone

# Install Python dependencies
uv sync

# Set your environment variables
echo "GEMINI_API_KEY=your_key_here" > .env
```

**18. MCP Server Setup:**
Ensure the `logistics-mcp` server is running or its tools are properly registered in your path, as the agent imports them directly for context fetching.

**19. Frontend Setup:**
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
Navigate to `http://localhost:5173` to view the Logistics Command UI.

**20. Evaluation & Testing:**
To run the automated LLM-as-judge evaluation dataset against the workflow:
```bash
uvx --from google-agents-cli agents-cli eval run --dataset eval.json --config eval.yaml
```

---
*Built with Google ADK 2.0 • Gemini 1.5 • React • Leaflet*

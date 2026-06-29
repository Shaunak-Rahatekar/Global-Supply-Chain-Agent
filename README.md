# Global Supply Chain ADK Agent (V2 Capstone Edition)

Welcome to the **Global Supply Chain Agent** repository! This project implements an advanced, dynamic AI-driven logistics decision engine designed to solve the complex routing and cost-optimization challenges presented in the Kaggle Supply Chain optimization problem.

## 🏆 Project Overview (The Problem & Solution)

**1. The Kaggle Challenge:** Modern global supply chains face extreme volatility from weather events, geopolitical tensions, and port congestions. This capstone addresses the challenge of dynamically rerouting high-value cargo in real-time to minimize financial loss.
**2. The Inefficiency of Static Routing:** Traditional systems rely on static logic trees or human dispatchers manually checking weather APIs and calling trucking companies for rates. This is slow and error-prone.
**3. The Solution - Agentic AI:** We developed an autonomous, multi-node AI agent using the **Google Agent Development Kit (ADK 2.0)**. 
**4. Dynamic Real-World Data:** The agent dynamically ingests cargo data and fetches live context via a robust Model Context Protocol (MCP) server. 
  - **Live Weather**: Integrated with the OpenWeatherMap API for live maritime storm tracking.
  - **Live Routing**: Integrates the **OSRM Public API** for accurate driving distances along real-world highway networks, coupled with **Haversine Math** for sea freight distances.
  - **Congestion Simulation**: Features a deterministic algorithm to simulate real-world Port Anchorage backlogs.
**5. Multi-Option LLM Analysis:** Utilizing Gemini 2.5 Flash, the agent weighs the cost of delays against the cost of rerouting, outputting multiple competitive bids (e.g., *Fastest Route* vs *Cheapest Route*).
**6. Security First:** Financial data (e.g., cargo value, corporate buyer) is strictly redacted before being passed to any LLM or external API.
**7. Human-in-the-Loop (HITL):** High-stakes decisions are never fully autonomous. The workflow pauses to request human approval via a sleek React dashboard before executing a reroute.

## 🏗️ Architecture & Technical Stack

**8. ADK 2.0 Workflow Graph:** The core intelligence is built as a stateful Workflow Graph in Python, enabling complex routing based on event state.
**9. Node 1 - Deterministic Screen:** A fast-path router that auto-approves low-priority cargo to save LLM inference costs.
**10. Node 2 - Security Redaction:** A sanitizer node that strips sensitive data to prevent PII/Financial leaks.
**11. Node 3 - MCP Context Fetcher:** Integrates locally with our `logistics-mcp` tools to pull live weather, congestion, and OSRM route data based on a massive 5,000+ Global Seaports dataset.
**12. Node 4 - LLM Review (Gemini):** A `LlmAgent` node that ingests the redacted payload + MCP context to generate a structured JSON decision array (`fastest_route`, `cheapest_route`).
**13. Node 5 - Human Approval:** Utilizes ADK's `RequestInput` feature to pause the graph execution and wait for human manager approval of the selected route.
**14. Vite + React Frontend:** A premium, dark-themed "Logistics Command UI" built with Tailwind CSS. It features a smart autocomplete Port Search (5,000 global ports) and an interactive radio-button interface for selecting the LLM's proposed routes.
**15. Google Cloud Run Deployment:** The entire full-stack application (FastAPI backend + Vite React frontend) is containerized and deployed as a serverless Cloud Run service.

## 🚀 Setup & Installation Instructions

**16. Prerequisites:**
- Python 3.10+ and `uv` package manager installed.
- Node.js and `npm` installed.
- Google Cloud CLI (`gcloud`) authenticated to your project.
- Gemini API Key & OpenWeatherMap API Key.

**17. Backend Setup:**
```bash
# Navigate to the project root
cd supply-chain-capstone

# Install Python dependencies
uv sync

# Set your environment variables
echo "GEMINI_API_KEY=your_key_here" > .env
echo "OPENWEATHERMAP_API_KEY=your_key_here" >> .env
```

**18. Frontend Setup:**
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Build the frontend (Vite bundles this into the backend's static assets for production!)
npm run build
```

**19. Deployment:**
Use the included deployment script to push the fully integrated agent to Google Cloud Run!
```bash
bash deploy.sh
```

**20. Evaluation & Testing:**
To run the automated LLM-as-judge evaluation dataset against the workflow logic:
```bash
uvx --from google-agents-cli agents-cli eval run --dataset eval.json --config eval.yaml
```

---
*Built with Google ADK 2.0 • Gemini 2.5 • React • OSRM Routing*

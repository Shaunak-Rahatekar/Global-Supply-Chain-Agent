import asyncio
from app.agent import root_agent
from dotenv import load_dotenv

load_dotenv()

async def test_agent():
    print("Testing delay > 24 hours (High Priority, 48 hrs delay)...")
    payload = {
        "id": "CGO-TEST-24",
        "priority": "High",
        "delay_hours": 48,
        "total_value": 1000000.0,
        "corporate_buyer": "TestBuyer",
        "lat": 34.05,
        "lon": -118.24
    }
    
    # We will just run the agent offline
    events = []
    async for event in root_agent.run(payload):
        events.append(event)
        print(f"Node output from {event.node_name}:")
        if event.node_name == "llm_review":
            print(f"LLM Decision: {event.content}")
        elif event.node_name == "human_approval":
            print("Agent paused for human approval!")

if __name__ == "__main__":
    asyncio.run(test_agent())

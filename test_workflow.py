import asyncio
import json
from google.adk.runners import InMemoryRunner
from google.genai import types

# Import the workflow to catch any missing imports or syntax issues
from app.agent import app

async def run_test():
    print("Initializing InMemoryRunner...")
    runner = InMemoryRunner(app=app)
    
    print("Creating session...")
    session = await runner.session_service.create_session(
        app_name="app", user_id="test_user"
    )
    
    # High priority event to bypass the fast-path and trigger the whole graph
    payload = {
        "id": "CGO-TEST-123",
        "priority": "High",
        "delay_hours": 48,
        "total_value": 2500000.0,
        "corporate_buyer": "Global Logistics Corp",
        "lat": 35.6895,
        "lon": 139.6917
    }
    
    print(f"Sending payload: {payload}")
    try:
        async for event in runner.run_async(
            user_id="test_user",
            session_id=session.id,
            new_message=types.Content(role="user", parts=[types.Part.from_text(text=json.dumps(payload))])
        ):
            if event.output is not None:
                print(f"-> Node Output: {event.output}")
            
            if type(event).__name__ == "RequestInput":
                print("\n--- HUMAN IN THE LOOP TRIGGERED ---")
                print(f"Manager Prompt: {event.message}")
                print("Simulating Manager Approval: 'Yes'")
                
                async for res_evt in runner.run_async(
                    user_id="test_user",
                    session_id=session.id,
                    resume_inputs={event.interrupt_id: "Yes"}
                ):
                    if getattr(res_evt, "output", None) is not None:
                        print(f"-> Resumed Node Output: {res_evt.output}")
                        
    except Exception as e:
        print(f"\n[ERROR] Execution failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())

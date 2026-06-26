import asyncio
import os
import sys
from dotenv import load_dotenv

# Load .env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Import the tools from server.py
from server import get_maritime_weather, find_alternative_routes

async def main():
    print("Testing get_maritime_weather...")
    # New York coordinates
    weather_result = await get_maritime_weather(40.7128, -74.0060)
    print("Weather Result:")
    print(weather_result)
    
    print("\n" + "-"*40 + "\n")
    
    print("Testing find_alternative_routes...")
    routes_result = find_alternative_routes("CARGO-9981", "Port of LA")
    print("Routes Result:")
    print(routes_result)
    
    print("\n" + "-"*40 + "\n")
    print("Test completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())

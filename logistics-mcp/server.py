import os
import httpx
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("Logistics MCP")

@mcp.tool()
async def get_maritime_weather(lat: float, lon: float) -> str:
    """Fetches real weather data using OpenWeatherMap API to check for storms or high winds.
    
    Args:
        lat: Latitude of the location.
        lon: Longitude of the location.
        
    Returns:
        A string describing the current weather and wind conditions.
    """
    api_key = os.environ.get("OPENWEATHERMAP_API_KEY")
    if not api_key or api_key == "<YOUR_OPENWEATHERMAP_API_KEY_HERE>":
        return "Error: OPENWEATHERMAP_API_KEY not found or not set properly in environment."
    
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return f"Error fetching weather data (Status {resp.status_code}): {resp.text}"
            
            data = resp.json()
            weather = data.get("weather", [{}])[0].get("description", "Unknown")
            wind_speed = data.get("wind", {}).get("speed", 0.0)
            
            # Simple condition to highlight high winds/storms
            alert = ""
            if wind_speed > 17.0: # roughly 33+ knots
                alert = " ⚠️ WARNING: High winds detected, potential storm!"
                
            return f"Weather at ({lat}, {lon}): {weather.capitalize()}. Wind speed: {wind_speed} m/s.{alert}"
        except Exception as e:
            return f"Exception occurred while fetching weather: {str(e)}"

@mcp.tool()
def find_alternative_routes(cargo_id: str, current_port: str) -> str:
    """Find alternative rail and truck routes for a cargo.
    
    Args:
        cargo_id: The ID of the cargo.
        current_port: The current port where the cargo is located.
        
    Returns:
        A JSON string containing alternative routes and estimated costs.
    """
    import json
    routes = [
        {"type": "rail", "destination": "Inland Depot A", "estimated_cost": 1500, "currency": "USD", "transit_time_days": 3},
        {"type": "truck", "destination": "Regional Hub B", "estimated_cost": 2200, "currency": "USD", "transit_time_days": 2},
        {"type": "rail_truck_combo", "destination": "Final Destination C", "estimated_cost": 3100, "currency": "USD", "transit_time_days": 5}
    ]
    return json.dumps({"cargo_id": cargo_id, "current_port": current_port, "alternative_routes": routes}, indent=2)

if __name__ == "__main__":
    # Run the server using stdio
    mcp.run(transport='stdio')

import os
import httpx
import math
import json
import hashlib
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
def get_port_congestion(port_name: str) -> str:
    """Gets the live anchorage wait time (congestion delay) at a destination port.
    
    Args:
        port_name: The name of the destination port.
        
    Returns:
        A string describing the current wait time in days.
    """
    # Deterministic mock based on port name for demonstration
    hash_val = int(hashlib.md5(port_name.encode('utf-8')).hexdigest(), 16)
    wait_days = (hash_val % 15) # Random wait between 0 and 14 days
    
    if wait_days == 0:
        return f"Port Congestion at {port_name}: 0 days (No backlog, operations nominal)."
    return f"Port Congestion at {port_name}: {wait_days} days anchorage wait time."

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance_km = R * c
    return distance_km

async def get_osrm_distance(lat1, lon1, lat2, lon2):
    """Fetches real-world driving distance from OSRM. Falls back to Haversine * 1.2 if no route (e.g., ocean)."""
    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                    distance_meters = data["routes"][0]["distance"]
                    return distance_meters / 1000.0
        except Exception:
            pass
    # Fallback to math if OSRM fails (e.g., coordinates are in the middle of the ocean)
    return haversine(lat1, lon1, lat2, lon2) * 1.2

@mcp.tool()
async def find_alternative_routes(start_lat: float, start_lon: float, dest_lat: float, dest_lon: float) -> str:
    """Finds alternative routing options and dynamically calculates distance, time, and costs.
    
    Args:
        start_lat: Current latitude.
        start_lon: Current longitude.
        dest_lat: Destination latitude.
        dest_lon: Destination longitude.
        
    Returns:
        A JSON string containing alternative routes and estimated costs.
    """
    sea_air_distance_km = haversine(start_lat, start_lon, dest_lat, dest_lon)
    land_distance_km = await get_osrm_distance(start_lat, start_lon, dest_lat, dest_lon)
    
    if sea_air_distance_km < 1:
        sea_air_distance_km = 100 # Prevent zero division
    if land_distance_km < 1:
        land_distance_km = 100
        
    routes = [
        {
            "type": "sea_freight",
            "distance_km": int(sea_air_distance_km),
            "estimated_cost": int(sea_air_distance_km * 0.15),
            "currency": "USD",
            "transit_time_days": round(sea_air_distance_km / 800, 1) # Approx 18 knots (800km/day)
        },
        {
            "type": "rail_truck_combo",
            "distance_km": int(land_distance_km), 
            "estimated_cost": int(land_distance_km * 1.50),
            "currency": "USD",
            "transit_time_days": round(land_distance_km / 1000, 1) # Approx 1000km/day for trucks
        },
        {
            "type": "air_freight",
            "distance_km": int(sea_air_distance_km),
            "estimated_cost": int(sea_air_distance_km * 8.50),
            "currency": "USD",
            "transit_time_days": round(sea_air_distance_km / 15000, 1) + 1 # Add 1 day handling
        }
    ]
    return json.dumps({"alternative_routes": routes}, indent=2)

if __name__ == "__main__":
    # Run the server using stdio
    mcp.run(transport='stdio')

FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN pip install uv==0.4.10

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml .
COPY uv.lock .

# Install dependencies (system-wide)
RUN uv sync --no-dev

# Copy application source
COPY app/ ./app/
COPY logistics-mcp/ ./logistics-mcp/

# Expose Cloud Run default port
EXPOSE 8080

# Run the ADK application using uvicorn
CMD ["uv", "run", "uvicorn", "app.fast_api_app:app", "--host", "0.0.0.0", "--port", "8080"]
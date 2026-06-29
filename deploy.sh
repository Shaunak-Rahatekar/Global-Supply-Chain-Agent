#!/bin/bash
# deploy.sh
# Cloud Run deployment script for the Global Supply Chain Agent

PROJECT_ID="global-supply-chain-agent"
SERVICE_NAME="supply-chain-agent"
REGION="us-central1"

echo "Deploying $SERVICE_NAME to Google Cloud Run in $REGION..."

# Source .env file if it exists so env vars are passed to Cloud Run
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Submit the build and deploy
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=${GEMINI_API_KEY},OPENWEATHERMAP_API_KEY=${OPENWEATHERMAP_API_KEY}" \
  --cpu=1 \
  --memory=2Gi \
  --concurrency=8

echo "Deployment complete! Your agent is now live."

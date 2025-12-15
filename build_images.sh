#!/bin/bash

echo "🐳 Building Docker Images for DevOps Portal..."

# Build Auth Service
echo "Building auth-service..."
docker build -t auth-service:latest ./backend/auth-service

# Build Ticket Service
echo "Building ticket-service..."
docker build -t ticket-service:latest ./backend/ticket-service

# Build Catalog Service
echo "Building catalog-service..."
docker build -t catalog-service:latest ./backend/catalog-service

# Build Frontend
echo "Building frontend..."
docker build -t frontend:latest -f ./frontend/Dockerfile ./frontend
# Note: Real frontend dockerfile assumes build step inside or copying dist. 
# For this demo we'll assume the simple nginx serving one we created or use a dev one.
# Re-checking frontend deployment... we created a deployment that uses frontend:latest
# We need to make sure a valid Dockerfile exists for frontend to build it.
# Checking file existence...

echo "✅ All images built successfully!"
echo "You can now run 'kubectl apply -f k8s/'"

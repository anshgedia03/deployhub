#!/bin/bash

echo "Starting infrastructure (MongoDB, Redis)..."
docker-compose up -d 

echo "Building shared module..."
npm run build -w shared

echo "Starting Next.js Frontend..."
npm run dev --workspace=frontend &

echo "Starting Backend API..."
npm run dev --workspace=backend &

echo "Starting Worker..."
npm run dev --workspace=worker &

wait

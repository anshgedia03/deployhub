#!/bin/bash

echo "Starting infrastructure (MongoDB, Redis)..."
docker-compose up -d mongodb redis

echo "Starting Next.js Frontend..."
npm run dev --workspace=frontend &

echo "Starting Backend API..."
npm run dev --workspace=backend &

echo "Starting Worker..."
npm run dev --workspace=worker &

wait

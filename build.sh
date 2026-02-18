#!/bin/bash
set -e
echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Contents: $(ls -la)"
cd frontend
echo "In frontend directory: $(pwd)"
echo "Frontend contents: $(ls -la)"
npm install
npm run build
echo "Build completed successfully!"
echo "Build directory contents: $(ls -la build/)"

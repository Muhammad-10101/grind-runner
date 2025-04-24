#!/bin/bash
set -e

echo "Starting build process..."

# Create necessary directories
echo "Creating directories..."
mkdir -p public/assets/images
mkdir -p public/assets/sound
mkdir -p public/assets/music

# Copy and optimize assets
echo "Copying assets..."
if [ -d "assets/images" ]; then
  cp -R assets/images/* public/assets/images/ || echo "Warning: Could not copy image assets"
fi

if [ -d "assets/sound" ]; then
  cp -R assets/sound/* public/assets/sound/ || echo "Warning: Could not copy sound assets"
fi

if [ -d "assets/music" ]; then
  cp -R assets/music/* public/assets/music/ || echo "Warning: Could not copy music assets"
fi

# Copy files from assets root (only if there are any .wav files)
if ls assets/*.wav 1> /dev/null 2>&1; then
  cp assets/*.wav public/assets/ || echo "Warning: No .wav files in assets root"
fi

# Copy web files
echo "Copying web files..."
cp -f *.html public/ || echo "Warning: No HTML files found"
cp -f *.css public/ || echo "Warning: No CSS files found"
cp -f *.js public/ || echo "Warning: No JS files found"

# Make build script executable
chmod +x build.sh || echo "Warning: Could not make build script executable"

echo "Build completed successfully!" 
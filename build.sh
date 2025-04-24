#!/bin/bash
set -e

echo "Starting build process..."

# Create necessary directories
echo "Creating directories..."
mkdir -p public/assets/images
mkdir -p public/assets/sound
mkdir -p public/assets/music

# Copy static files
echo "Copying static files..."
cp index.html public/
cp game.js public/
cp shop.js public/
cp inventory.js public/
cp gameState.js public/
cp style.css public/
cp custom-styles.css public/
cp asset-path.js public/
cp .htaccess public/

# Check and copy assets
if [ -d "assets/images" ]; then
  echo "Copying image assets..."
  cp -R assets/images/* public/assets/images/ || echo "Warning: Could not copy image assets"
fi

if [ -d "assets/sound" ]; then
  echo "Copying sound assets..."
  cp -R assets/sound/* public/assets/sound/ || echo "Warning: Could not copy sound assets"
fi

if [ -d "assets/music" ]; then
  echo "Copying music assets..."
  cp -R assets/music/* public/assets/music/ || echo "Warning: Could not copy music assets"
fi

# Copy music.wav from assets root
if [ -f "assets/music.wav" ]; then
  echo "Copying music.wav..."
  cp assets/music.wav public/assets/ || echo "Warning: Could not copy music.wav"
else
  echo "Warning: music.wav not found in assets directory"
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
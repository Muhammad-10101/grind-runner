#!/bin/bash

# Create necessary directories
mkdir -p public/assets/images
mkdir -p public/assets/sound
mkdir -p public/assets/music

# Copy and optimize assets
cp -R assets/images/* public/assets/images/
cp -R assets/sound/* public/assets/sound/
cp -R assets/music/* public/assets/music/
# Copy files from assets root
cp assets/*.wav public/assets/ 2>/dev/null || true

# Copy web files
cp *.html public/
cp *.css public/
cp *.js public/

# Make build script executable
chmod +x build.sh

echo "Build completed successfully!" 
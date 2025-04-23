#!/bin/bash

# Create necessary directories
mkdir -p public/assets/images
mkdir -p public/assets/sound

# Copy and optimize assets
cp -R assets/images/* public/assets/images/
cp -R assets/sound/* public/assets/sound/

# Copy web files
cp *.html public/
cp *.css public/
cp *.js public/

# Make build script executable
chmod +x build.sh

echo "Build completed successfully!" 
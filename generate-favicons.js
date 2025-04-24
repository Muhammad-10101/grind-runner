const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Source favicon file
const sourceFile = path.join(__dirname, 'public', 'favicon.ico');

// Generate different sized PNG favicons
async function generateFavicons() {
  try {
    // Create a temporary PNG from the ICO file
    const tempPng = path.join(__dirname, 'temp.png');
    
    // Use sharp to convert and resize the favicon
    await sharp(sourceFile)
      .resize(16, 16)
      .png()
      .toFile(path.join(outputDir, 'favicon-16x16.png'));
    
    await sharp(sourceFile)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    
    await sharp(sourceFile)
      .resize(180, 180)
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    
    await sharp(sourceFile)
      .resize(192, 192)
      .png()
      .toFile(path.join(outputDir, 'android-chrome-192x192.png'));
    
    await sharp(sourceFile)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'android-chrome-512x512.png'));
    
    await sharp(sourceFile)
      .resize(150, 150)
      .png()
      .toFile(path.join(outputDir, 'mstile-150x150.png'));
    
    console.log('All favicon files have been generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 
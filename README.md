# $Grind Runner Game

A fun web-based runner game built with HTML, CSS, and JavaScript.

## Features

- Pixel-art style graphics
- Playful hamster mascot
- Web3 integration (wallet connection)
- $GRIND token balance display
- Multiple playable characters (Hamster, Bearish, Plague of Frog)
- Animated start screen with floating clouds

## Deployment Instructions

### Local Development

1. Clone the repository
2. Open `index.html` in your browser to test locally

### Deploying to Vercel

1. Push your code to GitHub
2. Log in to Vercel and create a new project
3. Import the GitHub repository
4. Settings to configure:
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Install Command: `npm install`
5. Deploy!

## Troubleshooting

If assets (images, sounds) are not loading properly on the deployed site:

1. Check the browser console for 404 errors
2. Verify that the paths in the code match the actual file structure
3. Make sure Vercel configuration is correctly set up with the routes in `vercel.json`
4. Ensure all files are committed to the repository

## Asset Optimization

Large image files (like hamster.png at 3.2MB) should be optimized to improve load times.
Consider compressing large images before deployment.

## License

All rights reserved. 
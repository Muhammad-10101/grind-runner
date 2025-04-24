// Helper function to get correct asset paths regardless of environment
function getAssetPath(relativePath) {
    if (!relativePath) {
        console.error('getAssetPath called with empty path');
        return '';
    }
    
    console.log(`Getting asset path for: ${relativePath}`);
    
    // Get the current URL pathname
    const currentPath = window.location.pathname;
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    let finalPath;
    
    if (isLocalhost) {
        // In local development on localhost
        finalPath = relativePath;
    } else {
        // For deployed environments, ensure we're using the correct path
        // First, clean any leading slashes to avoid double slashes
        const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        
        // Special handling for music files
        if (cleanPath.includes('assets/music')) {
            // Make sure we're pointing to where the file actually is in production
            finalPath = `/${cleanPath}`;
            console.log(`Music file path: ${finalPath}`);
        } else {
            // For all other assets
            finalPath = `/${cleanPath}`;
        }
    }
    
    console.log(`Resolved to: ${finalPath}`);
    return finalPath;
}

// Export the function
window.getAssetPath = getAssetPath; 
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
        // For deployed environments, use the current pathname as base
        const basePath = currentPath.endsWith('/') ? currentPath : currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        finalPath = `${basePath}${relativePath}`;
    }
    
    console.log(`Resolved to: ${finalPath}`);
    return finalPath;
}

// Export the function
window.getAssetPath = getAssetPath; 
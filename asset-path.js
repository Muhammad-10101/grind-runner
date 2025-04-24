// Helper function to get correct asset paths regardless of environment
function getAssetPath(relativePath) {
    if (!relativePath) {
        console.error('getAssetPath called with empty path');
        return '';
    }
    
    console.log(`Getting asset path for: ${relativePath}`);
    
    // Check if we're running on Vercel production
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    let finalPath;
    
    // If on Vercel, use absolute paths from root
    if (isVercel) {
        // Remove leading slash if present
        const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        finalPath = `/${cleanPath}`;
    } else if (isLocalhost) {
        // In local development on localhost
        finalPath = relativePath;
    } else {
        // For other environments, use relative path with parent directory removed
        // This helps when running from file:// protocol
        const pathParts = relativePath.split('/');
        if (pathParts[0] === 'assets') {
            finalPath = relativePath;
        } else {
            finalPath = relativePath;
        }
    }
    
    console.log(`Resolved to: ${finalPath}`);
    return finalPath;
}

// Export the function
window.getAssetPath = getAssetPath; 
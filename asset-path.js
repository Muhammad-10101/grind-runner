// Helper function to get correct asset paths regardless of environment
function getAssetPath(relativePath) {
    // Check if we're running on Vercel production
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    
    // If on Vercel, use absolute paths from root
    if (isVercel) {
        // Remove leading slash if present
        const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        return `/${cleanPath}`;
    }
    
    // In local development, use relative paths
    return relativePath;
}

// Export the function
window.getAssetPath = getAssetPath; 
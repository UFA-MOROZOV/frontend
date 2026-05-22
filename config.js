// Configuration file
const CONFIG = {
    // API base URL - change this to match your backend
    API_BASE: 'http://localhost:5089', // Update with your backend URL
    
    // Token storage key
    TOKEN_KEY: 'auth_token',
    
    // Token expiration check (in seconds)
    TOKEN_EXPIRY_BUFFER: 60, // Show warning 60 seconds before expiry
    
    // Request timeout in milliseconds
    REQUEST_TIMEOUT: 90000,
    
    // Maximum file size in bytes (100MB)
    MAX_FILE_SIZE: 100 * 1024 * 1024,
    
    // Allowed file types
    ALLOWED_FILE_TYPES: {
        compiler: ['.zip', '.tar.gz', '.exe', '.sh'],
        test: ['.txt', '.cs', '.cpp', '.c', '.java', '.py'],
        header: ['.h', '.hpp', '.txt']
    },
    
    // Debug mode
    DEBUG: true
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);

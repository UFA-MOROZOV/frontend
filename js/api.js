// API service
const ApiService = {
    getToken: function() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },
    
    setToken: function(token) {
        if (token) {
            localStorage.setItem(CONFIG.TOKEN_KEY, token);
        } else {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
        }
    },
    
    request: async function(endpoint, options = {}) {
        const token = this.getToken();
        
        const headers = options.headers || {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        }
        
        headers['Accept'] = 'application/json';
        
        const config = {
            ...options,
            headers,
            mode: 'cors',
            credentials: 'include'
        };
        
        Utils.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
            
            const response = await fetch(CONFIG.API_BASE + endpoint, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.status === 401) {
                this.setToken(null);
                // Store the current URL to return after login
                sessionStorage.setItem('returnUrl', window.location.href);
                window.location.href = 'index.html';
                throw new Error('Session expired. Please login again.');
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error (${response.status}): ${errorText}`);
            }
            
            return response;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            Utils.error('API request failed:', error);
            throw error;
        }
    },
    
    get: function(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    post: function(endpoint, data) {
        const options = { method: 'POST' };
        if (data instanceof FormData) {
            options.body = data;
        } else {
            options.body = JSON.stringify(data);
        }
        return this.request(endpoint, options);
    },
    
    put: function(endpoint, data) {
        const options = { method: 'PUT' };
        if (data instanceof FormData) {
            options.body = data;
        } else {
            options.body = JSON.stringify(data);
        }
        return this.request(endpoint, options);
    },
    
    delete: function(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};
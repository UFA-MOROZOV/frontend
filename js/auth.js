// Authentication module
const AuthModule = {
    init: function() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.loginStatus = document.getElementById('loginStatus');
        this.loginForm = document.getElementById('loginForm');
        
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        this.checkAuth();
    },
    
    checkAuth: function() {
        const token = ApiService.getToken();
        
        if (token && !Utils.isTokenExpired(token)) {
            if (this.loginStatus) {
                this.loginStatus.textContent = 'Logged in';
            }
        } else {
            if (token) {
                ApiService.setToken(null);
            }
            // Redirect to login if not on index page
            const currentPath = window.location.pathname;
            if (!currentPath.includes('index.html')) {
                window.location.href = 'index.html';
            }
        }
    },
    
    handleLogout: function() {
        ApiService.setToken(null);
        Utils.showToast('Logged out successfully', 'info');
        window.location.href = 'index.html';
    },

    handleLogin: async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            // HERE - The /api/login endpoint is called
            const response = await fetch(CONFIG.API_BASE + '/api/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`Login failed: ${response.status}`);
            }
            
            // Parse response to get token
            const contentType = response.headers.get('content-type');
            let token;
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                // Try different token field names
                token = data.accessToken || data.token || data.access_token;
            } else {
                token = await response.text();
            }
            
            // Store token and redirect
            ApiService.setToken(token);
            window.location.href = 'compilers.html';
            
        } catch (error) {
            Utils.showToast(error.message, 'error');
        }
    }
};
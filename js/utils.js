// Utility functions
const Utils = {
    showToast: function(message, type = 'info', duration = 5000) {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;
        
        const toastId = 'toast-' + Date.now();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="toast-header">
                <strong class="me-auto">${type.toUpperCase()}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: duration });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },
    
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    },
    
    isTokenExpired: function(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp < Date.now() / 1000;
        } catch {
            return true;
        }
    },
    
    getTokenExpiry: function(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return new Date(payload.exp * 1000);
        } catch {
            return null;
        }
    },
    
    showLoading: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        }
    },
    
    showError: function(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        }
    },
    
    showEmpty: function(elementId, message = 'No items found') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-folder-open fa-3x mb-3"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    },
    
    validateFileSize: function(file) {
        return file.size <= CONFIG.MAX_FILE_SIZE;
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    log: function(...args) {
        if (CONFIG.DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    },
    
    error: function(...args) {
        console.error('[ERROR]', ...args);
    }
};
// Headers page
const headersPage = {
    uploadModal: null,
    
    init: function() {
        this.initializeModals();
        this.loadHeaders();
    },
    
    initializeModals: function() {
        const uploadModalEl = document.getElementById('uploadModal');
        if (uploadModalEl) {
            this.uploadModal = new bootstrap.Modal(uploadModalEl);
        }
        
        const uploadForm = document.getElementById('uploadHeaderForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
        }
    },
    
    showUploadModal: function() {
        if (this.uploadModal) {
            this.uploadModal.show();
        }
    },
    
    loadHeaders: async function() {
        const container = document.getElementById('headersList');
        if (!container) return;
        
        Utils.showLoading('headersList');
        
        try {
            const response = await ApiService.get('/api/headerFiles');
            const data = await response.json();
            const headers = data.headerFiles || [];
            
            if (headers.length === 0) {
                Utils.showEmpty('headersList', 'No header files found');
                return;
            }
            
            let html = '<div class="list-group">';
            headers.forEach(h => {
                html += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-file-code text-success me-2"></i>
                                <strong>${h.name}</strong>
                                
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-info" onclick="headersPage.viewHeader('${h.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="headersPage.editHeader('${h.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="headersPage.deleteHeader('${h.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            container.innerHTML = html;
            
        } catch (error) {
            Utils.error('Failed to load headers:', error);
            Utils.showError('headersList', error.message);
        }
    },
    
    viewHeader: function(id) {
        window.location.href = `header-view.html?id=${id}`;
    },
    
    editHeader: function(id) {
        window.location.href = `header-edit.html?id=${id}`;
    },
    
    deleteHeader: function(id) {
        if (!confirm('Are you sure you want to delete this header file?')) return;
        
        ApiService.delete(`/api/headerFiles/${id}`)
            .then(() => {
                this.loadHeaders();
                Utils.showToast('Header file deleted successfully', 'success');
            })
            .catch(error => {
                Utils.error('Delete failed:', error);
                Utils.showToast(error.message, 'error');
            });
    },
    
    handleUpload: async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const file = formData.get('file');
        
        if (!Utils.validateFileSize(file)) {
            Utils.showToast('File too large (max 100MB)', 'error');
            return;
        }
        
        try {
            await ApiService.post('/api/headerFiles/upload', formData);
            e.target.reset();
            if (this.uploadModal) {
                this.uploadModal.hide();
            }
            this.loadHeaders();
            Utils.showToast('File uploaded successfully', 'success');
        } catch (error) {
            Utils.error('Upload failed:', error);
            Utils.showToast(error.message, 'error');
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    headersPage.init();
});
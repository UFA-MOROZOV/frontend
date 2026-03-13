// Compilers page
const compilersPage = {
    allCompilers: [], // Store all compilers for filtering
    dockerFilter: false, // Default OFF - show all compilers
    searchTerm: '',
    searchTimeout: null, // Add timeout for debounce
    
    init: function() {
        this.createForm = document.getElementById('createCompilerForm');
        this.executeForm = document.getElementById('executeCodeForm');
        
        this.bindEvents();
        this.loadCompilers();
        this.loadDockerOnlyCompilers(); // Load dropdown with Docker-only compilers
    },
    
    bindEvents: function() {
        if (this.createForm) {
            this.createForm.addEventListener('submit', (e) => this.handleCreate(e));
        }
        if (this.executeForm) {
            this.executeForm.addEventListener('submit', (e) => this.handleExecute(e));
        }
        
        // Search input with debounce
        const searchInput = document.getElementById('compilerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                // Clear previous timeout
                if (this.searchTimeout) {
                    clearTimeout(this.searchTimeout);
                }
                
                // Set new timeout
                this.searchTimeout = setTimeout(() => {
                    this.searchTerm = searchInput.value.trim();
                    this.loadCompilers(); // Reload with search parameter
                }, 500); // 500ms debounce
            });
        }
        
        // Docker filter
        const dockerFilter = document.getElementById('dockerFilter');
        if (dockerFilter) {
            dockerFilter.addEventListener('change', () => {
                this.dockerFilter = dockerFilter.checked;
                this.applyFilters(); // Apply filter to current data
            });
        }
    },
    
    loadCompilers: async function() {
        const container = document.getElementById('compilerList');
        if (!container) return;
        
        Utils.showLoading('compilerList');
        
        try {
            // Build URL with query parameters
            let url = '/api/compilers';
            const params = new URLSearchParams();
            
            // Add search parameter if present
            if (this.searchTerm) {
                params.append('keyword', this.searchTerm);
            }
            
            const queryString = params.toString();
            if (queryString) {
                url += '?' + queryString;
            }
            
            Utils.log('Loading compilers with URL:', url);
            
            const response = await ApiService.get(url);
            this.allCompilers = await response.json();
            
            this.applyFilters();
            
        } catch (error) {
            Utils.error('Failed to load compilers:', error);
            Utils.showError('compilerList', error.message);
        }
    },
    
    applyFilters: function() {
        let filtered = [...this.allCompilers];
        
        // Apply Docker filter (if enabled)
        if (this.dockerFilter) {
            filtered = filtered.filter(c => c.hasDockerLocally === true);
        }
        
        // Update active filters display
        this.updateFiltersDisplay();
        
        // Render filtered compilers
        this.renderCompilers(filtered);
    },
    
    updateFiltersDisplay: function() {
        const filtersDiv = document.getElementById('activeFilters');
        if (!filtersDiv) return;
        
        let filters = [];
        if (this.dockerFilter) filters.push('Docker only');
        if (this.searchTerm) filters.push(`Search: "${this.searchTerm}"`);
        
        if (filters.length > 0) {
            filtersDiv.innerHTML = `<i class="fas fa-filter me-1"></i>Active filters: ${filters.join(' • ')}`;
        } else {
            filtersDiv.innerHTML = '';
        }
    },
    
    renderCompilers: function(compilers) {
        const container = document.getElementById('compilerList');
        if (!container) return;
        
        if (!compilers || compilers.length === 0) {
            if (this.allCompilers.length > 0) {
                Utils.showEmpty('compilerList', 'No compilers match the current filters');
            } else {
                Utils.showEmpty('compilerList', 'No compilers found');
            }
            return;
        }
        
        let html = '<div class="list-group">';
        compilers.forEach(c => {
            const hasDocker = c.hasDockerLocally ? 
                '<span class="badge bg-success ms-2">Docker ✓</span>' : 
                '<span class="badge bg-secondary ms-2">No Docker</span>';
            
            // Highlight search term if present
            let nameDisplay = c.name;
            let versionDisplay = c.version;
            let commandDisplay = c.commandName;
            
            if (this.searchTerm) {
                const regex = new RegExp(`(${this.searchTerm})`, 'gi');
                nameDisplay = c.name.replace(regex, '<mark>$1</mark>');
                versionDisplay = c.version.replace(regex, '<mark>$1</mark>');
                commandDisplay = c.commandName.replace(regex, '<mark>$1</mark>');
            }
            
            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${nameDisplay} <small class="text-muted">v${versionDisplay}</small> ${hasDocker}</h6>
                            <small class="text-muted">
                                <i class="fas fa-id-card me-1"></i>ID: ${c.id} | 
                                <i class="fas fa-terminal me-1"></i>Command: ${commandDisplay}
                            </small>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="compilersPage.editCompiler(${c.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="compilersPage.deleteCompiler(${c.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    },
    
    loadDockerOnlyCompilers: async function() {
        const select = document.getElementById('executeCompilerId');
        if (!select) return;
        
        try {
            // Load only compilers with Docker locally
            const response = await ApiService.get('/api/compilers?hasDockerLocally=true');
            const compilers = await response.json();
            
            if (compilers.length === 0) {
                select.innerHTML = '<option value="">No compilers with Docker available</option>';
                return;
            }
            
            let options = '<option value="">Select a compiler...</option>';
            compilers.forEach(c => {
                options += `<option value="${c.id}">${c.name} v${c.version} (ID: ${c.id})</option>`;
            });
            select.innerHTML = options;
            
        } catch (error) {
            Utils.error('Failed to load Docker compilers:', error);
            select.innerHTML = '<option value="">Error loading compilers</option>';
        }
    },
    
    handleCreate: async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const file = formData.get('File');
        
        // File is optional, only validate if provided
        if (file && file.size > 0 && !Utils.validateFileSize(file)) {
            Utils.showToast('File too large (max 100MB)', 'error');
            return;
        }
        
        // Show loading overlay
        const hasFile = file && file.size > 0;
        LoadingOverlay.show(
            hasFile ? 'Uploading compiler and setting up...' : 'Creating compiler...', 
            true
        );
        LoadingOverlay.updateProgress(30, 'Processing...');
        
        try {
            // If no file was selected, remove the File field from FormData
            if (!file || file.size === 0) {
                formData.delete('File');
            }
            
            await ApiService.post('/api/compilers', formData);
            
            LoadingOverlay.updateProgress(100, 'Complete!');
            setTimeout(() => {
                LoadingOverlay.hide();
            }, 500);
            
            e.target.reset();
            await this.loadCompilers();
            await this.loadDockerOnlyCompilers(); // Refresh Docker-only dropdown
            Utils.showToast('Compiler created successfully', 'success');
            
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Create compiler failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },
    
    handleExecute: async function(e) {
        e.preventDefault();
        
        const compilerId = document.getElementById('executeCompilerId').value;
        const code = document.getElementById('executeCode').value;
        const resultDiv = document.getElementById('executeResult');
        
        if (!compilerId) {
            Utils.showToast('Please select a compiler', 'error');
            return;
        }
        
        resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm"></div> Executing...</div>';
        
        LoadingOverlay.show('Executing code...', true);
        LoadingOverlay.updateProgress(50, 'Running compilation');
        
        try {
            const response = await ApiService.post('/api/compilers/execute', {
                id: parseInt(compilerId),
                code: code
            });
            
            const result = await response.text();
            
            LoadingOverlay.updateProgress(100, 'Execution complete');
            setTimeout(() => {
                LoadingOverlay.hide();
            }, 300);
            
            resultDiv.innerHTML = `
                <div class="execution-result">
                    <pre>${Utils.escapeHtml(result)}</pre>
                </div>
            `;
            
            Utils.showToast('Code executed successfully', 'success');
            
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Execute code failed:', error);
            resultDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    },
    
    editCompiler: function(id) {
        window.location.href = `compiler-edit.html?id=${id}`;
    },
    
    deleteCompiler: function(id) {
        if (!confirm('Are you sure you want to delete this compiler?')) return;
        
        LoadingOverlay.show('Deleting compiler...', true);
        LoadingOverlay.updateProgress(50, 'Removing...');
        
        ApiService.delete(`/api/compilers/${id}`)
            .then(() => {
                LoadingOverlay.updateProgress(100, 'Deleted');
                setTimeout(() => {
                    LoadingOverlay.hide();
                    this.loadCompilers();
                    this.loadDockerOnlyCompilers(); // Refresh Docker-only dropdown
                    Utils.showToast('Compiler deleted successfully', 'success');
                }, 500);
            })
            .catch(error => {
                LoadingOverlay.hide();
                Utils.error('Delete failed:', error);
                Utils.showToast(error.message, 'error');
            });
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    compilersPage.init();
});
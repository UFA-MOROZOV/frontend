// Compilers page
const compilersPage = {
    allCompilers: [],
    dockerFilter: false,
    searchTerm: '',
    searchTimeout: null,

    init: function () {
        this.createForm = document.getElementById('createCompilerForm');
        this.executeForm = document.getElementById('executeCodeForm');
        this.typeSelect = document.getElementById('compilerType');
        this.commandNameGroup = document.getElementById('commandNameGroup');
        this.fileHint = document.getElementById('compilerFileHint');

        this.bindEvents();
        this.updateCreateFormByType();
        this.loadCompilers();
        this.loadRunnableCompilers();
    },

    bindEvents: function () {
        if (this.createForm) {
            this.createForm.addEventListener('submit', (e) => this.handleCreate(e));
        }
        if (this.executeForm) {
            this.executeForm.addEventListener('submit', (e) => this.handleExecute(e));
        }

        if (this.typeSelect) {
            this.typeSelect.addEventListener('change', () => this.updateCreateFormByType());
        }

        const searchInput = document.getElementById('compilerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                if (this.searchTimeout) {
                    clearTimeout(this.searchTimeout);
                }

                this.searchTimeout = setTimeout(() => {
                    this.searchTerm = searchInput.value.trim();
                    this.loadCompilers();
                }, 500);
            });
        }

        const dockerFilter = document.getElementById('dockerFilter');
        if (dockerFilter) {
            dockerFilter.addEventListener('change', () => {
                this.dockerFilter = dockerFilter.checked;
                this.applyFilters();
            });
        }
    },

    updateCreateFormByType: function () {
        if (!this.typeSelect) return;

        const type = parseInt(this.typeSelect.value, 10);
        const isDocker = type === 0;

        if (this.commandNameGroup) {
            this.commandNameGroup.style.display = isDocker ? '' : 'none';

            const input = this.commandNameGroup.querySelector('input[name="CommandName"]');
            if (input) {
                input.required = isDocker;
                if (!isDocker) {
                    input.value = '';
                }
            }
        }

        if (this.fileHint) {
            this.fileHint.textContent = isDocker
                ? 'Optional: upload a Docker image archive (.tar). Command name is used only for Docker compilers.'
                : 'Optional: upload an executable compiler file.';
        }
    },

    getCompilerTypeLabel: function (type) {
        return type === 0 ? 'Docker' : 'Executable';
    },

    getCompilerTypeBadge: function (type) {
        return type === 0
            ? '<span class="badge bg-primary ms-2">Docker</span>'
            : '<span class="badge bg-dark ms-2">Executable</span>';
    },

    getCompilerStatusBadge: function (c) {
        if (c.type === 0) {
            return c.hasDockerLocally === true
                ? '<span class="badge bg-success ms-2">Docker Ready</span>'
                : '<span class="badge bg-secondary ms-2">Docker Missing</span>';
        }

        return c.executablePath
            ? '<span class="badge bg-success ms-2">File Ready</span>'
            : '<span class="badge bg-secondary ms-2">No File</span>';
    },

    isRunnableCompiler: function (c) {
        return (c.type === 0 && c.hasDockerLocally === true) || (c.type === 1 && !!c.executablePath);
    },

    highlightText: function (text) {
        const value = text || '';
        const escaped = Utils.escapeHtml(value);

        if (!this.searchTerm) {
            return escaped;
        }

        const escapedSearch = this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        return escaped.replace(regex, '<mark>$1</mark>');
    },

    loadCompilers: async function () {
        const container = document.getElementById('compilerList');
        if (!container) return;

        Utils.showLoading('compilerList');

        try {
            let url = '/api/compilers';
            const params = new URLSearchParams();

            if (this.searchTerm) {
                params.append('Keyword', this.searchTerm);
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

    applyFilters: function () {
        let filtered = [...this.allCompilers];

        if (this.dockerFilter) {
            filtered = filtered.filter(c => c.hasDockerLocally === true);
        }

        this.updateFiltersDisplay();
        this.renderCompilers(filtered);
    },

    updateFiltersDisplay: function () {
        const filtersDiv = document.getElementById('activeFilters');
        if (!filtersDiv) return;

        let filters = [];
        if (this.dockerFilter) filters.push('Docker ready only');
        if (this.searchTerm) filters.push(`Search: "${Utils.escapeHtml(this.searchTerm)}"`);

        if (filters.length > 0) {
            filtersDiv.innerHTML = `<i class="fas fa-filter me-1"></i>Active filters: ${filters.join(' • ')}`;
        } else {
            filtersDiv.innerHTML = '';
        }
    },

    renderCompilers: function (compilers) {
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
            const typeBadge = this.getCompilerTypeBadge(c.type);
            const statusBadge = this.getCompilerStatusBadge(c);

            const nameDisplay = this.highlightText(c.name || '');
            const versionDisplay = this.highlightText(c.version || '');

            const commandLine = c.type === 0
                ? `
                    <small class="text-muted d-block">
                        <i class="fas fa-terminal me-1"></i>Command: ${c.commandName ? this.highlightText(c.commandName) : '<em>Not set</em>'}
                    </small>
                `
                : `
                    <small class="text-muted d-block">
                        <i class="fas fa-file me-1"></i>Executable compiler
                    </small>
                `;

            const uploadLabel = c.type === 0 ? 'Upload .tar' : 'Upload file';
            const dockerActions = c.type === 0 ? `
                <button class="btn btn-sm btn-outline-success" onclick="compilersPage.downloadDocker(${c.id})" title="Download Docker image">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" onclick="compilersPage.deleteDockerImage(${c.id})" title="Delete Docker image">
                    <i class="fas fa-box-open"></i>
                </button>
            ` : '';

            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center gap-3">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                ${nameDisplay}
                                <small class="text-muted">v${versionDisplay || '-'}</small>
                                ${typeBadge}
                                ${statusBadge}
                            </h6>
                            ${commandLine}
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-secondary" onclick="compilersPage.triggerUpload(${c.id})" title="${uploadLabel}">
                                <i class="fas fa-upload"></i>
                            </button>
                            ${dockerActions}
                            <button class="btn btn-sm btn-outline-primary" onclick="compilersPage.editCompiler(${c.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="compilersPage.deleteCompiler(${c.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <input type="file" id="compilerUpload_${c.id}" class="d-none" onchange="compilersPage.handleExistingFileUpload(${c.id}, this)">
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    },

    loadRunnableCompilers: async function () {
        const select = document.getElementById('executeCompilerId');
        if (!select) return;

        try {
            const response = await ApiService.get('/api/compilers');
            const compilers = await response.json();
            const runnable = compilers.filter(c => this.isRunnableCompiler(c));

            if (runnable.length === 0) {
                select.innerHTML = '<option value="">No runnable compilers available</option>';
                return;
            }

            let options = '<option value="">Select a compiler...</option>';
            runnable.forEach(c => {
                options += `<option value="${c.id}">${Utils.escapeHtml(c.name || '')} v${Utils.escapeHtml(c.version || '')} (${this.getCompilerTypeLabel(c.type)})</option>`;
            });
            select.innerHTML = options;

        } catch (error) {
            Utils.error('Failed to load runnable compilers:', error);
            select.innerHTML = '<option value="">Error loading compilers</option>';
        }
    },

    triggerUpload: function (id) {
        const input = document.getElementById(`compilerUpload_${id}`);
        if (input) {
            input.click();
        }
    },

    handleExistingFileUpload: async function (id, input) {
        const file = input.files && input.files[0];
        if (!file) return;

        if (!Utils.validateFileSize(file)) {
            Utils.showToast('File too large (max 100MB)', 'error');
            input.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('imageFile', file);

        LoadingOverlay.show('Uploading file...', true);
        LoadingOverlay.updateProgress(40, 'Sending file');

        try {
            await ApiService.put(`/api/compilers/${id}/uploadFile`, formData);

            LoadingOverlay.updateProgress(100, 'Upload complete');
            setTimeout(() => {
                LoadingOverlay.hide();
            }, 400);

            await this.loadCompilers();
            await this.loadRunnableCompilers();
            Utils.showToast('Compiler file uploaded successfully', 'success');
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Upload failed:', error);
            Utils.showToast(error.message, 'error');
        } finally {
            input.value = '';
        }
    },

    handleCreate: async function (e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const file = formData.get('File');
        const type = parseInt(formData.get('Type'), 10);

        if (type !== 0) {
            formData.delete('CommandName');
        }

        if (file && file.size > 0 && !Utils.validateFileSize(file)) {
            Utils.showToast('File too large (max 100MB)', 'error');
            return;
        }

        LoadingOverlay.show(
            file && file.size > 0 ? 'Uploading compiler and setting up...' : 'Creating compiler...',
            true
        );
        LoadingOverlay.updateProgress(30, 'Processing...');

        try {
            if (!file || file.size === 0) {
                formData.delete('File');
            }

            await ApiService.post('/api/compilers', formData);

            LoadingOverlay.updateProgress(100, 'Complete!');
            setTimeout(() => {
                LoadingOverlay.hide();
            }, 500);

            e.target.reset();
            this.updateCreateFormByType();
            await this.loadCompilers();
            await this.loadRunnableCompilers();
            Utils.showToast('Compiler created successfully', 'success');

        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Create compiler failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },

    handleExecute: async function (e) {
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
                id: parseInt(compilerId, 10),
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
            resultDiv.innerHTML = `<div class="alert alert-danger">${Utils.escapeHtml(error.message)}</div>`;
        }
    },

    downloadDocker: async function (id) {
        LoadingOverlay.show('Downloading Docker image...', true);
        LoadingOverlay.updateProgress(50, 'Request sent');

        try {
            await ApiService.put(`/api/compilers/${id}/download`);

            LoadingOverlay.updateProgress(100, 'Done');
            setTimeout(() => {
                LoadingOverlay.hide();
            }, 400);

            await this.loadCompilers();
            await this.loadRunnableCompilers();
            Utils.showToast('Docker image download started successfully', 'success');
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Download Docker image failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },

    deleteDockerImage: async function (id) {
        if (!confirm('Are you sure you want to delete the Docker image for this compiler?')) return;

        LoadingOverlay.show('Deleting Docker image...', true);
        LoadingOverlay.updateProgress(50, 'Removing image');

        try {
            await ApiService.delete(`/api/compilers/${id}/image`);

            LoadingOverlay.updateProgress(100, 'Deleted');
            setTimeout(() => {
                LoadingOverlay.hide();
            }, 400);

            await this.loadCompilers();
            await this.loadRunnableCompilers();
            Utils.showToast('Docker image deleted successfully', 'success');
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Delete Docker image failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },

    editCompiler: function (id) {
        window.location.href = `compiler-edit.html?id=${id}`;
    },

    deleteCompiler: function (id) {
        if (!confirm('Are you sure you want to delete this compiler?')) return;

        LoadingOverlay.show('Deleting compiler...', true);
        LoadingOverlay.updateProgress(50, 'Removing...');

        ApiService.delete(`/api/compilers/${id}`)
            .then(async () => {
                LoadingOverlay.updateProgress(100, 'Deleted');
                setTimeout(() => {
                    LoadingOverlay.hide();
                }, 500);

                await this.loadCompilers();
                await this.loadRunnableCompilers();
                Utils.showToast('Compiler deleted successfully', 'success');
            })
            .catch(error => {
                LoadingOverlay.hide();
                Utils.error('Delete failed:', error);
                Utils.showToast(error.message, 'error');
            });
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    AuthModule.init();

    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    compilersPage.init();
});
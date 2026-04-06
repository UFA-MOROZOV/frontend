// Tests header assignment module
const TestsHeaderAssignment = {
    headerAssignmentModal: null,
    currentHeaderTargetId: null,
    currentHeaderTargetType: null,
    allHeaders: [],
    
    // Initialize header assignment
    init: function() {
        this.loadAllHeaders();
        this.createHeaderAssignmentModal();
    },
    
    // Load all headers
    loadAllHeaders: async function() {
        try {
            const response = await ApiService.get('/api/headerFiles');
            const data = await response.json();
            this.allHeaders = data.headerFiles || [];
            Utils.log('Loaded all headers:', this.allHeaders.length);
        } catch (error) {
            Utils.error('Failed to load headers:', error);
        }
    },
    
    // Create header assignment modal
    createHeaderAssignmentModal: function() {
        // Check if modal already exists
        if (document.getElementById('headerAssignmentModal')) {
            const modalEl = document.getElementById('headerAssignmentModal');
            this.headerAssignmentModal = new bootstrap.Modal(modalEl);
            
            const saveBtn = document.getElementById('saveHeaderAssignment');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveHeaderAssignment());
            }
            
            const selectAllBtn = document.getElementById('selectAllHeaders');
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => this.selectAllHeaders());
            }
            
            const deselectAllBtn = document.getElementById('deselectAllHeaders');
            if (deselectAllBtn) {
                deselectAllBtn.addEventListener('click', () => this.deselectAllHeaders());
            }
            return;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="headerAssignmentModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-file-code me-2"></i>
                                <span id="headerAssignmentTitle">Assign Headers</span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info" id="headerAssignmentDescription"></div>
                            
                            <div class="row mb-3">
                                <div class="col-12">
                                    <div class="btn-group" role="group">
                                        <button type="button" class="btn btn-sm btn-outline-primary" id="selectAllHeaders">
                                            <i class="fas fa-check-double me-1"></i>Select All
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" id="deselectAllHeaders">
                                            <i class="fas fa-times me-1"></i>Deselect All
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-7">
                                    <label class="form-label fw-bold">Available Headers</label>
                                    <div class="border rounded p-2" style="max-height: 300px; overflow-y: auto;">
                                        <div id="headersCheckboxList" class="list-group">
                                            Loading headers...
                                        </div>
                                    </div>
                                    <small class="text-muted">Click checkboxes to select/deselect headers</small>
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label fw-bold">Selected Headers</label>
                                    <div id="selectedHeadersList" class="border rounded p-2" style="max-height: 300px; overflow-y: auto;">
                                        <p class="text-muted text-center">No headers selected</p>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveHeaderAssignment">
                                <i class="fas fa-save me-2"></i>Save Assignment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modalEl = document.getElementById('headerAssignmentModal');
        this.headerAssignmentModal = new bootstrap.Modal(modalEl);
        
        const saveBtn = document.getElementById('saveHeaderAssignment');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveHeaderAssignment());
        }
        
        const selectAllBtn = document.getElementById('selectAllHeaders');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllHeaders());
        }
        
        const deselectAllBtn = document.getElementById('deselectAllHeaders');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => this.deselectAllHeaders());
        }
    },
    
    // Load headers for a specific test
    loadHeadersForTest: async function(testId) {
        try {
            const response = await ApiService.get(`/api/headerFiles?TestId=${testId}`);
            const data = await response.json();
            return data.headerFiles || [];
        } catch (error) {
            Utils.error('Failed to load headers for test:', error);
            return [];
        }
    },
    
    // Load headers for a specific group
    loadHeadersForGroup: async function(groupId) {
        try {
            const response = await ApiService.get(`/api/headerFiles?TestGroupId=${groupId}`);
            const data = await response.json();
            return data.headerFiles || [];
        } catch (error) {
            Utils.error('Failed to load headers for group:', error);
            return [];
        }
    },
    
    // Show header assignment modal
    showHeaderAssignmentModal: async function(targetId, targetType, targetName) {
        this.currentHeaderTargetId = targetId;
        this.currentHeaderTargetType = targetType;
        
        const titleEl = document.getElementById('headerAssignmentTitle');
        const descEl = document.getElementById('headerAssignmentDescription');
        const checkboxList = document.getElementById('headersCheckboxList');
        const selectedListEl = document.getElementById('selectedHeadersList');
        
        if (titleEl) {
            titleEl.textContent = `Assign Headers to ${targetType === 'test' ? 'Test' : 'Group'}`;
        }
        
        if (descEl) {
            descEl.innerHTML = `Select headers to assign to: <strong>${targetName}</strong>`;
        }
        
        // Load currently assigned headers
        let assignedHeaders = [];
        if (targetType === 'test') {
            assignedHeaders = await this.loadHeadersForTest(targetId);
        } else {
            assignedHeaders = await this.loadHeadersForGroup(targetId);
        }
        
        const assignedHeaderIds = assignedHeaders.map(h => h.id);
        Utils.log('Currently assigned headers:', assignedHeaderIds);
        
        // Create checkboxes for all headers
        if (checkboxList) {
            if (this.allHeaders.length === 0) {
                checkboxList.innerHTML = '<p class="text-muted text-center">No headers available</p>';
            } else {
                let checkboxes = '';
                this.allHeaders.forEach(header => {
                    const checked = assignedHeaderIds.includes(header.id) ? 'checked' : '';
                    checkboxes += `
                        <div class="list-group-item">
                            <div class="form-check">
                                <input class="form-check-input header-checkbox" type="checkbox" value="${header.id}" id="header-${header.id}" ${checked}>
                                <label class="form-check-label" for="header-${header.id}">
                                    <strong>${header.name}</strong>
                                </label>
                            </div>
                        </div>
                    `;
                });
                checkboxList.innerHTML = checkboxes;
                
                // Add event listeners to all checkboxes
                document.querySelectorAll('.header-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', () => this.updateSelectedHeaders());
                });
            }
        }
        
        // Update selected headers list and IDs
        this.updateSelectedHeaders();
        
        this.headerAssignmentModal.show();
    },
    
    // Update selected headers display
    updateSelectedHeaders: function() {
        const checkboxes = document.querySelectorAll('.header-checkbox:checked');
        const selectedListEl = document.getElementById('selectedHeadersList');
        
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        const selectedHeaders = this.allHeaders.filter(h => selectedIds.includes(h.id));
        
        // Update visual list
        if (selectedListEl) {
            if (selectedHeaders.length === 0) {
                selectedListEl.innerHTML = '<p class="text-muted text-center">No headers selected</p>';
            } else {
                let listHtml = '<ul class="list-unstyled mb-0">';
                selectedHeaders.forEach(header => {
                    listHtml += `
                        <li class="mb-2">
                            <i class="fas fa-file-code text-info me-2"></i>
                            <strong>${header.name}</strong>
                            
                        </li>
                    `;
                });
                listHtml += '</ul>';
                selectedListEl.innerHTML = listHtml;
            }
        }
    },
    
    // Select all headers
    selectAllHeaders: function() {
        document.querySelectorAll('.header-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updateSelectedHeaders();
    },
    
    // Deselect all headers
    deselectAllHeaders: function() {
        document.querySelectorAll('.header-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateSelectedHeaders();
    },
    
    // Save header assignment
    saveHeaderAssignment: async function() {
        if (!this.currentHeaderTargetId) return;
        
        const checkboxes = document.querySelectorAll('.header-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedIds.length === 0 && !confirm('No headers selected. This will remove all header assignments. Continue?')) {
            return;
        }
        
        try {
            let url = '';
            if (this.currentHeaderTargetType === 'test') {
                url = '/api/tests/headerFiles';
            } else {
                url = '/api/testsgroups/headerFiles';
            }
            
            // Build query parameters
            const params = new URLSearchParams();
            params.append('Id', this.currentHeaderTargetId);
            selectedIds.forEach(id => params.append('HeaderIds', id));
            
            const fullUrl = url + '?' + params.toString();
            Utils.log('Saving header assignment:', fullUrl);
            
            await ApiService.put(fullUrl);
            
            Utils.showToast('Headers assigned successfully', 'success');
            this.headerAssignmentModal.hide();
            
            return true;
            
        } catch (error) {
            Utils.error('Failed to assign headers:', error);
            Utils.showToast(error.message, 'error');
            return false;
        }
    }
};
// Test Execution Page
const testExecutePage = {
    compilers: [],
    selectedItemId: null,
    selectedItemType: null,
    selectedItemName: null,
    
    init: function() {
        this.loadCompilers();
        this.bindEvents();
        this.loadTests();
    },
    
    bindEvents: function() {
        const form = document.getElementById('executeTestsForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleExecute(e));
        }
        
        const clearBtn = document.getElementById('clearSelectionBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSelection());
        }
        
        const modeRadios = document.querySelectorAll('input[name="executionMode"]');
        modeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.clearSelection();
                this.updateExecuteButton();
            });
        });
        
        const compilerSelect = document.getElementById('compilerSelect');
        if (compilerSelect) {
            compilerSelect.addEventListener('change', () => this.updateExecuteButton());
        }
        
        const executionName = document.getElementById('executionName');
        if (executionName) {
            executionName.addEventListener('input', () => this.updateExecuteButton());
        }
    },
    
    loadCompilers: async function() {
        const select = document.getElementById('compilerSelect');
        if (!select) return;
        
        try {
            // Load only compilers with Docker locally
            const response = await ApiService.get('/api/compilers?onlyReady=true');
            this.compilers = await response.json();
            
            if (this.compilers.length === 0) {
                select.innerHTML = '<option value="">No compilers available</option>';
                return;
            }
            
            let options = '<option value="">Select a compiler...</option>';
            this.compilers.forEach(c => {
                options += `<option value="${c.id}">${c.name} v${c.version}</option>`;
            });
            select.innerHTML = options;
            
        } catch (error) {
            Utils.error('Failed to load compilers:', error);
            select.innerHTML = '<option value="">Error loading compilers</option>';
        }
    },
    
    loadTests: async function(parentId = null) {
        // Update current parent ID in TestsCommon
        TestsCommon.currentParentId = parentId;
        
        // Load tests using TestsCommon
        await TestsCommon.loadTests(parentId, 'testsList', (data) => this.renderTests(data));
        TestsCommon.renderBreadcrumb('breadcrumbNav', 'currentFolder', 'testExecutePage.goToRoot()');
    },
    
    goToRoot: function() {
        TestsCommon.currentParentId = null;
        TestsCommon.currentPath = [];
        this.loadTests(null);
        TestsCommon.renderBreadcrumb('breadcrumbNav', 'currentFolder', 'testExecutePage.goToRoot()');
        this.clearSelection();
    },
    
    renderTests: function(data) {
        const container = document.getElementById('testsList');
        if (!container) return;
        
        let html = '';
        
        // Show groups with navigation
        if (data.subGroups && data.subGroups.length > 0) {
            html += '<h6 class="mt-2 mb-2"><i class="fas fa-folder me-2"></i>Groups</h6>';
            html += '<div class="list-group mb-3">';
            data.subGroups.forEach(g => {
                const isSelected = (this.selectedItemType === 'group' && this.selectedItemId === g.id);
                const selectedClass = isSelected ? 'list-group-item-success' : '';
                
                html += `
                    <div class="list-group-item list-group-item-action ${selectedClass}" style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div onclick="testExecutePage.navigateToGroup('${g.id}', '${g.name}')" style="flex-grow: 1;">
                                <i class="fas fa-folder-open text-warning me-2"></i>
                                <strong>${g.name}</strong>
                                
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary ms-2" onclick="event.stopPropagation(); testExecutePage.selectGroup('${g.id}', '${g.name}')" title="Select this group for execution">
                                    <i class="fas fa-check-circle"></i> Select
                                </button>
                                <span class="badge bg-info ms-2">Group</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Show tests
        if (data.tests && data.tests.length > 0) {
            html += '<h6 class="mt-3 mb-2"><i class="fas fa-file-code me-2"></i>Tests</h6>';
            html += '<div class="list-group">';
            data.tests.forEach(t => {
                const isSelected = (this.selectedItemType === 'test' && this.selectedItemId === t.id);
                const selectedClass = isSelected ? 'list-group-item-success' : '';
                
                html += `
                    <div class="list-group-item ${selectedClass}">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-file-code text-primary me-2"></i>
                                <strong>${t.name}</strong>
                                
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary" onclick="testExecutePage.selectTest('${t.id}', '${t.name}')" title="Select this test for execution">
                                    <i class="fas fa-check-circle"></i> Select
                                </button>
                                <span class="badge bg-primary ms-2">Test</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Show empty state
        if ((!data.subGroups || data.subGroups.length === 0) && (!data.tests || data.tests.length === 0)) {
            html += '<div class="text-center py-4 text-muted">';
            html += '<i class="fas fa-folder-open fa-3x mb-3"></i>';
            html += '<p>This folder is empty</p>';
            html += '</div>';
        }
        
        container.innerHTML = html;
    },
    
    navigateToGroup: function(groupId, groupName) {
        Utils.log('Navigating to group:', groupId, groupName);
        
        // Add to path
        TestsCommon.currentPath.push({ id: groupId, name: groupName });
        
        // Load tests for this group
        this.loadTests(groupId);
    },
    
    selectTest: function(id, name) {
        // Check if execution mode matches
        const mode = document.querySelector('input[name="executionMode"]:checked')?.value;
        if (mode === 'group') {
            Utils.showToast('Switch to "Single Test" mode to select a test', 'warning');
            return;
        }
        
        this.selectedItemId = id;
        this.selectedItemType = 'test';
        this.selectedItemName = name;
        this.updateSelectionDisplay();
        this.updateExecuteButton();
        
        // Refresh to show selection highlight
        this.loadTests(TestsCommon.currentParentId);
    },
    
    selectGroup: function(id, name) {
        // Check if execution mode matches
        const mode = document.querySelector('input[name="executionMode"]:checked')?.value;
        if (mode === 'test') {
            Utils.showToast('Switch to "Test Group" mode to select a group', 'warning');
            return;
        }
        
        this.selectedItemId = id;
        this.selectedItemType = 'group';
        this.selectedItemName = name;
        this.updateSelectionDisplay();
        this.updateExecuteButton();
        
        // Refresh to show selection highlight
        this.loadTests(TestsCommon.currentParentId);
    },
    
    clearSelection: function() {
        this.selectedItemId = null;
        this.selectedItemType = null;
        this.selectedItemName = null;
        this.updateSelectionDisplay();
        this.updateExecuteButton();
        this.loadTests(TestsCommon.currentParentId);
    },
    
    updateSelectionDisplay: function() {
        const display = document.getElementById('selectedItemDisplay');
        const idInput = document.getElementById('selectedItemId');
        const typeInput = document.getElementById('selectedItemType');
        
        if (this.selectedItemId && this.selectedItemName) {
            const typeLabel = this.selectedItemType === 'test' ? 'Test' : 'Group';
            display.value = `${typeLabel}: ${this.selectedItemName} (${this.selectedItemId})`;
            if (idInput) idInput.value = this.selectedItemId;
            if (typeInput) typeInput.value = this.selectedItemType;
        } else {
            display.value = 'Navigate and select a test or group using the "Select" button';
            if (idInput) idInput.value = '';
            if (typeInput) typeInput.value = '';
        }
    },
    
    updateExecuteButton: function() {
        const compilerSelect = document.getElementById('compilerSelect');
        const executeBtn = document.getElementById('executeBtn');
        const executionName = document.getElementById('executionName');
        const mode = document.querySelector('input[name="executionMode"]:checked')?.value;
        
        const hasCompiler = compilerSelect && compilerSelect.value;
        const hasSelection = this.selectedItemId && 
                           ((mode === 'test' && this.selectedItemType === 'test') ||
                            (mode === 'group' && this.selectedItemType === 'group'));
        const hasName = executionName && executionName.value.trim().length > 0;
        
        if (executeBtn) {
            executeBtn.disabled = !(hasCompiler && hasSelection && hasName);
        }
    },
    
    handleExecute: async function(e) {
        e.preventDefault();
        
        const compilerId = document.getElementById('compilerSelect').value;
        const executionName = document.getElementById('executionName').value.trim();
        const mode = document.querySelector('input[name="executionMode"]:checked')?.value;
        
        if (!compilerId) {
            Utils.showToast('Please select a compiler', 'error');
            return;
        }
        
        if (!this.selectedItemId) {
            Utils.showToast(`Please select a ${mode === 'test' ? 'test' : 'group'} to execute`, 'error');
            return;
        }
        
        if (!executionName) {
            Utils.showToast('Execution name is required', 'error');
            document.getElementById('executionName').focus();
            return;
        }
        
        const statusDiv = document.getElementById('executionStatus');
        statusDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div><p>Starting execution...</p></div>';
        
        try {
            // Build payload - name is required
            const payload = {
                name: executionName,
                compilerId: parseInt(compilerId)
            };
            
            // Add testId or testGroupId based on mode
            if (mode === 'test') {
                payload.testId = this.selectedItemId;
            } else {
                payload.testGroupId = this.selectedItemId;
            }
            
            Utils.log('Executing with payload:', payload);
            
            const response = await ApiService.post('/api/compilers/executeTask', payload);
            const taskId = await response.json();
            
            statusDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Execution started successfully!</strong>
                                        <p class="mb-0">Name: ${executionName}</p>
                    <hr>
                    <a href="tasks.html" class="btn btn-sm btn-primary">
                        <i class="fas fa-tasks me-1"></i>View Task Status
                    </a>
                    <button class="btn btn-sm btn-info ms-2" onclick="testExecutePage.refreshTaskStatus('${taskId}')">
                        <i class="fas fa-sync-alt me-1"></i>Refresh Status
                    </button>
                </div>
            `;
            
            Utils.showToast('Execution started', 'success');
            
        } catch (error) {
            Utils.error('Execution failed:', error);
            statusDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Execution failed:</strong>
                    <p class="mb-0 mt-2">${error.message}</p>
                </div>
            `;
        }
    },
    
    refreshTaskStatus: async function(taskId) {
        const statusDiv = document.getElementById('executionStatus');
        statusDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div><p>Refreshing task status...</p></div>';
        
        try {
            const response = await ApiService.get(`/api/compilersTasks/${taskId}`);
            const task = await response.json();
            
            let html = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Task Status Updated</strong>
                                        <p class="mb-0">Name: ${task.name || 'Unnamed'}</p>
                    <p class="mb-0">Status: ${task.isCompleted ? 'Completed' : 'In Progress'}</p>
                    ${task.dateOfCompletion ? `<p class="mb-0">Completed: ${Utils.formatDate(task.dateOfCompletion)}</p>` : ''}
                    <hr>
                    <a href="tasks.html" class="btn btn-sm btn-primary">
                        <i class="fas fa-tasks me-1"></i>View All Tasks
                    </a>
                    <button class="btn btn-sm btn-info ms-2" onclick="testExecutePage.refreshTaskStatus('${task.id}')">
                        <i class="fas fa-sync-alt me-1"></i>Refresh Again
                    </button>
                </div>
            `;
            
            if (task.testsExecuted && task.testsExecuted.length > 0) {
                html += '<div class="mt-3"><h6>Executed Tests:</h6><ul class="list-group">';
                task.testsExecuted.forEach(ex => {
                    const statusIcon = ex.isSuccessful ? 'fa-check-circle text-success' : 'fa-times-circle text-danger';
                    html += `
                        <li class="list-group-item">
                            <i class="fas ${statusIcon} me-2"></i>
                            ${ex.test.name} - ${ex.duration}
                        </li>
                    `;
                });
                html += '</ul></div>';
            }
            
            statusDiv.innerHTML = html;
            
        } catch (error) {
            Utils.error('Failed to refresh task:', error);
            statusDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Failed to refresh:</strong>
                    <p class="mb-0 mt-2">${error.message}</p>
                </div>
            `;
        }
    }
};

// Override TestsCommon navigation methods
TestsCommon.navigateToGroup = function(groupId, groupName, pathIndex) {
    if (pathIndex !== undefined) {
        // This is from breadcrumb - cut the path and navigate
        TestsCommon.currentPath = TestsCommon.currentPath.slice(0, pathIndex);
        testExecutePage.loadTests(groupId);
        TestsCommon.renderBreadcrumb('breadcrumbNav', 'currentFolder', 'testExecutePage.goToRoot()');
    } else if (groupId) {
        // Navigate into group
        testExecutePage.navigateToGroup(groupId, groupName);
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    testExecutePage.init();
});
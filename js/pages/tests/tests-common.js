// Shared test utilities
const TestsCommon = {
    // Current state
    currentParentId: null,
    currentPath: [],
    
    // Initialize common module
    init: function() {
        Utils.log('TestsCommon initialized');
    },
    
    // Load tests with optional parent ID
    loadTests: async function(parentId = null, containerId = 'testsList', renderCallback) {
        const container = document.getElementById(containerId);
        if (!container) {
            Utils.log(`Container ${containerId} not found`);
            return;
        }
        
        Utils.showLoading(containerId);
        
        try {
            let url = '/api/tests';
            const params = new URLSearchParams();
            if (parentId) {
                params.append('ParentId', parentId);
                this.currentParentId = parentId;
                Utils.log('Setting currentParentId to:', parentId);
            } else {
                this.currentParentId = null;
                this.currentPath = [];
                Utils.log('Resetting to root');
            }
            
            const queryString = params.toString();
            if (queryString) {
                url += '?' + queryString;
            }
            
            Utils.log('Loading tests with URL:', url);
            
            const response = await ApiService.get(url);
            const data = await response.json();
            
            // If we have a parentId, try to get the group name for breadcrumb
            if (parentId && this.currentPath.length === 0) {
                try {
                    // We need to get the parent group's name
                    // This is tricky - we might need to search for it
                    // For now, we'll just use the ID
                    this.currentPath = [{ id: parentId, name: 'Loading...' }];
                    
                    // Try to get the actual name by looking at the response
                    // The response should contain the subgroups, but we need the current group's info
                    // This might require a separate API call
                    const groupResponse = await ApiService.get(`/api/tests?ParentId=${parentId}`);
                    const groupData = await groupResponse.json();
                    
                    // The current group should be in the subgroups of its parent
                    // But we don't have the parent ID here
                    // For now, we'll leave it as ID and let the next load update it
                    
                } catch (error) {
                    Utils.log('Could not load group name for breadcrumb:', error);
                    this.currentPath = [{ id: parentId, name: parentId.substring(0, 8) + '...' }];
                }
            }
            
            if (renderCallback) {
                renderCallback(data);
            }
            
            return data;
            
        } catch (error) {
            Utils.error('Failed to load tests:', error);
            Utils.showError(containerId, error.message);
        }
    },
    
    // Render breadcrumb navigation
    renderBreadcrumb: function(breadcrumbNavId = 'breadcrumbNav', currentFolderSpanId = 'currentFolder', navigateToRootCallback) {
        const breadcrumbNav = document.getElementById(breadcrumbNavId);
        const currentFolderSpan = document.getElementById(currentFolderSpanId);
        if (!breadcrumbNav) return;
        
        let html = '<nav aria-label="breadcrumb"><ol class="breadcrumb">';
        
        // Root level - make it clickable
        html += '<li class="breadcrumb-item">';
        if (this.currentParentId) {
            // If we're not at root, make root a clickable link
            html += '<a href="#" onclick="';
            if (navigateToRootCallback) {
                html += navigateToRootCallback;
            } else {
                html += 'TestsCommon.navigateToRoot()';
            }
            html += '; return false;">Root</a>';
        } else {
            html += '<span>Root</span>';
        }
        html += '</li>';
        
        // Path items
        this.currentPath.forEach((item, index) => {
            if (index === this.currentPath.length - 1) {
                html += `<li class="breadcrumb-item active">${Utils.escapeHtml(item.name)}</li>`;
                if (currentFolderSpan) {
                    currentFolderSpan.textContent = `Current: ${item.name}`;
                }
            } else {
                html += `<li class="breadcrumb-item"><a href="#" onclick="TestsCommon.navigateToGroup('${item.id}', '${Utils.escapeHtml(item.name)}', ${index + 1}); return false;">${Utils.escapeHtml(item.name)}</a></li>`;
            }
        });
        
        html += '</ol></nav>';
        breadcrumbNav.innerHTML = html;
        
        if (!this.currentParentId && currentFolderSpan) {
            currentFolderSpan.textContent = 'Current: Root';
        }
    },
    
    // Navigate to root
    navigateToRoot: function() {
        Utils.log('Navigating to root');
        this.currentParentId = null;
        this.currentPath = [];
        // This will be overridden by the page-specific implementation
        if (window.location.pathname.includes('test-execute.html')) {
            if (typeof testExecutePage !== 'undefined') {
                testExecutePage.goToRoot();
            }
        } else {
            if (typeof testsPage !== 'undefined') {
                testsPage.goToRoot();
            }
        }
    },
    
    // Navigate to a group
    navigateToGroup: function(groupId, groupName, pathIndex = null) {
        Utils.log('NavigateToGroup called with:', groupId, groupName, pathIndex);
        // This method will be overridden by page-specific implementations
        // Do nothing here - each page provides its own implementation
    },
    
    // Get group name and navigate
    getGroupNameAndNavigate: async function(groupId, loadCallback) {
        try {
            const response = await ApiService.get(`/api/tests?ParentId=${groupId}`);
            const data = await response.json();
            const group = data.subGroups?.find(g => g.id === groupId);
            if (group) {
                this.currentPath.push({ id: groupId, name: group.name });
                if (loadCallback) loadCallback(groupId);
            } else {
                if (loadCallback) loadCallback(groupId);
            }
        } catch (error) {
            Utils.log('Could not get group name:', error);
            if (loadCallback) loadCallback(groupId);
        }
    },
    
    // Reset navigation
    resetNavigation: function() {
        this.currentParentId = null;
        this.currentPath = [];
    }
};

// Auto-initialize
TestsCommon.init();
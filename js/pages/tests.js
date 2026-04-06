// Main Tests page
const testsPage = {
    initialized: false,
    
    init: function() {
        if (this.initialized) return;
        Utils.log('TestsPage initializing...');
        
        // Initialize header assignment
        if (typeof TestsHeaderAssignment !== 'undefined') {
            TestsHeaderAssignment.init();
        } else {
            Utils.error('TestsHeaderAssignment not loaded!');
        }
        
        // Initialize modals with handlers
        if (typeof TestsModals !== 'undefined') {
            TestsModals.init(
                (e) => this.handleUpload(e),
                (e) => this.handleGroupUpload(e),
                (e) => this.handleCreateGroup(e)
            );
        } else {
            Utils.error('TestsModals not loaded!');
        }
        
        // FIRST: Check URL for folder parameter (this must happen before any other navigation)
        this.checkUrlForNavigation();
        
        this.initialized = true;
    },
    
    checkUrlForNavigation: function() {
        Utils.log('🔍 Checking URL for navigation...');
        
        // Get folder from URL
        const urlParams = new URLSearchParams(window.location.search);
        const folderId = urlParams.get('folder');
        
        if (folderId) {
            Utils.log('✅ Found folder in URL:', folderId);
            
            // Clear any existing state
            TestsCommon.currentParentId = null;
            TestsCommon.currentPath = [];
            
            // Set the folder and load tests
            setTimeout(() => {
                this.loadTests(folderId);
            }, 100);
            return true;
        }
        
        Utils.log('❌ No folder in URL, checking session storage...');
        
        // Then check session storage (for back navigation from other pages)
        const navigateToTests = sessionStorage.getItem('navigateToTests');
        const navigateToGroup = sessionStorage.getItem('navigateToGroup');
        const navigateToRoot = sessionStorage.getItem('navigateToRoot');
        
        if (navigateToTests) {
            sessionStorage.removeItem('navigateToTests');
            
            if (navigateToGroup) {
                sessionStorage.removeItem('navigateToGroup');
                Utils.log('Navigating to group from storage:', navigateToGroup);
                setTimeout(() => {
                    this.navigateToGroup(navigateToGroup);
                }, 100);
                return true;
            } else if (navigateToRoot) {
                sessionStorage.removeItem('navigateToRoot');
                Utils.log('Navigating to root from storage');
                setTimeout(() => {
                    this.loadTests(null);
                }, 100);
                return true;
            }
        }
        
        // Default to root
        Utils.log('Loading root by default');
        setTimeout(() => {
            this.loadTests(null);
        }, 100);
        return false;
    },
    
    loadTests: async function(parentId = null) {
        Utils.log('🚀 Loading tests with parentId:', parentId);
        
        // Update URL to reflect current folder (for refresh)
        this.updateUrlWithFolder(parentId);
        
        await TestsCommon.loadTests(parentId, 'testsList', (data) => this.renderTests(data));
        TestsCommon.renderBreadcrumb('breadcrumbNav', 'currentFolder', 'testsPage.goToRoot()');
        
        // Update create button with current folder
        const createTestBtn = document.querySelector('a[href="test-create.html"]');
        if (createTestBtn && parentId) {
            createTestBtn.href = `test-create.html?groupId=${parentId}`;
        } else if (createTestBtn) {
            createTestBtn.href = 'test-create.html';
        }
    },
    
    updateUrlWithFolder: function(folderId) {
        const url = new URL(window.location);
        if (folderId) {
            url.searchParams.set('folder', folderId);
        } else {
            url.searchParams.delete('folder');
        }
        // Update URL without reloading page
        window.history.replaceState({}, '', url);
        Utils.log('📝 Updated URL with folder:', folderId);
    },
    
    goToRoot: function() {
        Utils.log('Going to root');
        TestsCommon.currentParentId = null;
        TestsCommon.currentPath = [];
        this.loadTests(null);
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
                html += `
                    <div class="list-group-item list-group-item-action" style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div onclick="testsPage.navigateToGroup('${g.id}', '${g.name}')" style="flex-grow: 1; padding: 5px 0;">
                                <i class="fas fa-folder-open text-warning me-2"></i>
                                <strong>${g.name}</strong>
                                
                            </div>
                            <div class="btn-group" onclick="event.stopPropagation();">
                                <button class="btn btn-sm btn-outline-info" onclick="testsPage.assignHeadersToGroup('${g.id}', '${g.name}')" title="Assign Headers">
                                    <i class="fas fa-file-code"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="testsPage.deleteGroup('${g.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
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
                html += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-file-code text-primary me-2"></i>
                                <strong>${t.name}</strong>
                                
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-info" onclick="testsPage.viewTest('${t.id}')" title="View">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="testsPage.editTest('${t.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="testsPage.assignHeadersToTest('${t.id}', '${t.name}')" title="Assign Headers">
                                    <i class="fas fa-file-code"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="testsPage.deleteTest('${t.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
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
        
        // Load tests for this group (this will update URL)
        this.loadTests(groupId);
    },
    
    // Navigation from breadcrumb
    navigateToBreadcrumbGroup: function(groupId, groupName, pathIndex) {
        Utils.log('Navigating via breadcrumb to:', groupId, groupName, 'at index:', pathIndex);
        // Cut the path at the specified index
        TestsCommon.currentPath = TestsCommon.currentPath.slice(0, pathIndex);
        this.loadTests(groupId);
    },
    
    // Header assignment methods
    assignHeadersToTest: async function(testId, testName) {
        Utils.log('Assigning headers to test:', testId, testName);
        await TestsHeaderAssignment.showHeaderAssignmentModal(testId, 'test', testName);
        this.loadTests(TestsCommon.currentParentId);
    },
    
    assignHeadersToGroup: async function(groupId, groupName) {
        Utils.log('Assigning headers to group:', groupId, groupName);
        await TestsHeaderAssignment.showHeaderAssignmentModal(groupId, 'group', groupName);
        this.loadTests(TestsCommon.currentParentId);
    },
    
    // CRUD operations
    viewTest: function(id) {
        // Save current folder before navigating away
        if (TestsCommon.currentParentId) {
            sessionStorage.setItem('returnToFolder', TestsCommon.currentParentId);
        }
        TestsCRUD.viewTest(id);
    },
    
    editTest: function(id) {
        // Save current folder before navigating away
        if (TestsCommon.currentParentId) {
            sessionStorage.setItem('returnToFolder', TestsCommon.currentParentId);
        }
        TestsCRUD.editTest(id);
    },
    
    deleteTest: function(id) {
        TestsCRUD.deleteTest(id, () => this.loadTests(TestsCommon.currentParentId));
    },
    
    deleteGroup: function(id) {
        TestsCRUD.deleteGroup(id, () => this.loadTests(TestsCommon.currentParentId));
    },
    
    // Modal handlers
    showUploadModal: function() {
        TestsModals.showUploadModal(TestsCommon.currentParentId);
    },
    
    showGroupUploadModal: function() {
        TestsModals.showGroupUploadModal(TestsCommon.currentParentId);
    },
    
    showCreateGroupModal: function() {
        TestsModals.showCreateGroupModal();
    },
    
    handleUpload: async function(e) {
        await TestsCRUD.handleUpload(e, TestsCommon.currentParentId, (id) => this.loadTests(id));
        TestsModals.hideAll();
    },
    
    handleGroupUpload: async function(e) {
        await TestsCRUD.handleGroupUpload(
            e, 
            TestsCommon.currentParentId, 
            (id) => this.loadTests(id),
            (groupId) => this.navigateToGroup(groupId)
        );
        TestsModals.hideAll();
    },
    
    handleCreateGroup: async function(e) {
        await TestsCRUD.handleCreateGroup(e, TestsCommon.currentParentId, (id) => this.loadTests(id));
        TestsModals.hideAll();
    },

    refreshCurrentFolder: function() {
        Utils.log('Refreshing current folder:', TestsCommon.currentParentId);
        this.loadTests(TestsCommon.currentParentId);
    },
};

// Override TestsCommon navigation methods
TestsCommon.navigateToGroup = function(groupId, groupName, pathIndex) {
    Utils.log('TestsCommon.navigateToGroup called:', groupId, groupName, pathIndex);
    if (pathIndex !== undefined) {
        // This is from breadcrumb
        testsPage.navigateToBreadcrumbGroup(groupId, groupName, pathIndex);
    } else if (groupId) {
        // Navigate into group
        testsPage.navigateToGroup(groupId, groupName);
    } else {
        // Navigate to root
        testsPage.goToRoot();
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    testsPage.init();
});

// Also check for URL folder parameter when page fully loads (backup)
window.addEventListener('load', function() {
    Utils.log('Window fully loaded, checking URL again...');
    
    // Double-check URL for folder parameter
    const urlParams = new URLSearchParams(window.location.search);
    const folderId = urlParams.get('folder');
    const currentParentId = TestsCommon.currentParentId;
    
    Utils.log('Current parent ID:', currentParentId, 'URL folder:', folderId);
    
    // If URL has a folder and we're not in that folder, navigate to it
    if (folderId && currentParentId !== folderId) {
        Utils.log('🔄 URL folder mismatch, correcting navigation to:', folderId);
        TestsCommon.currentPath = [];
        TestsCommon.currentParentId = folderId;
        testsPage.loadTests(folderId);
    }
    
    // Check for return navigation
    const returnToFolder = sessionStorage.getItem('returnToFolder');
    if (returnToFolder) {
        sessionStorage.removeItem('returnToFolder');
        Utils.log('Return to folder from storage:', returnToFolder);
        setTimeout(() => {
            if (testsPage) {
                testsPage.navigateToGroup(returnToFolder);
            }
        }, 100);
    }
});
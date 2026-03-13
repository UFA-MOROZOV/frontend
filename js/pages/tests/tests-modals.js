// Tests modals module
const TestsModals = {
    uploadModal: null,
    groupUploadModal: null,
    createGroupModal: null,
    
    // Initialize modals
    init: function(uploadHandler, groupUploadHandler, createGroupHandler) {
        this.initializeModals(uploadHandler, groupUploadHandler, createGroupHandler);
    },
    
    // Initialize all modals
    initializeModals: function(uploadHandler, groupUploadHandler, createGroupHandler) {
        const uploadModalEl = document.getElementById('uploadModal');
        if (uploadModalEl) {
            this.uploadModal = new bootstrap.Modal(uploadModalEl);
        }
        
        const groupUploadModalEl = document.getElementById('groupUploadModal');
        if (groupUploadModalEl) {
            this.groupUploadModal = new bootstrap.Modal(groupUploadModalEl);
        }
        
        const createGroupModalEl = document.getElementById('createGroupModal');
        if (createGroupModalEl) {
            this.createGroupModal = new bootstrap.Modal(createGroupModalEl);
        }
        
        // Bind form submissions
        const uploadForm = document.getElementById('uploadTestForm');
        if (uploadForm && uploadHandler) {
            uploadForm.addEventListener('submit', uploadHandler);
        }
        
        const groupUploadForm = document.getElementById('uploadGroupForm');
        if (groupUploadForm && groupUploadHandler) {
            groupUploadForm.addEventListener('submit', groupUploadHandler);
        }
        
        const createGroupForm = document.getElementById('createGroupForm');
        if (createGroupForm && createGroupHandler) {
            createGroupForm.addEventListener('submit', createGroupHandler);
        }
    },
    
    // Show upload modal
    showUploadModal: function(currentParentId) {
        if (this.uploadModal) {
            // Set current folder in the upload form
            const groupIdInput = document.getElementById('groupUploadId');
            if (groupIdInput) {
                groupIdInput.value = currentParentId || '';
            }
            this.uploadModal.show();
        }
    },
    
    // Show group upload modal
    showGroupUploadModal: function(currentParentId) {
        if (this.groupUploadModal) {
            // Set current folder in the group upload form
            const groupIdInput = document.getElementById('groupUploadId');
            if (groupIdInput) {
                groupIdInput.value = currentParentId || '';
            }
            this.groupUploadModal.show();
        }
    },
    
    // Show create group modal
    showCreateGroupModal: function() {
        if (this.createGroupModal) {
            this.createGroupModal.show();
        }
    },
    
    // Hide all modals
    hideAll: function() {
        if (this.uploadModal) this.uploadModal.hide();
        if (this.groupUploadModal) this.groupUploadModal.hide();
        if (this.createGroupModal) this.createGroupModal.hide();
    }
};
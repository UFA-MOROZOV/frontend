// Tests CRUD module
const TestsCRUD = {
    // View test
    viewTest: function(id) {
        window.location.href = `test-view.html?id=${id}`;
    },
    
    // Edit test
    editTest: function(id) {
        window.location.href = `test-edit.html?id=${id}`;
    },
    
    // Delete test
    deleteTest: async function(id, loadCallback) {
        if (!confirm('Are you sure you want to delete this test?')) return;
        
        try {
            await ApiService.delete(`/api/tests/${id}`);
            Utils.showToast('Test deleted successfully', 'success');
            if (loadCallback) loadCallback();
        } catch (error) {
            Utils.error('Delete failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },
    
    // Delete group
    deleteGroup: async function(id, loadCallback) {
        if (!confirm('Are you sure you want to delete this group? All tests in this group will also be deleted.')) return;
        
        try {
            await ApiService.delete(`/api/testGroup/${id}`);
            Utils.showToast('Group deleted successfully', 'success');
            if (loadCallback) loadCallback();
        } catch (error) {
            Utils.error('Delete group failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },
    
    // Handle test upload
    handleUpload: async function(e, currentParentId, loadCallback) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const file = formData.get('file');
        
        if (!Utils.validateFileSize(file)) {
            Utils.showToast('File too large (max 100MB)', 'error');
            return;
        }
        
        let url = '/api/tests/upload';
        if (currentParentId) {
            url += `?groupId=${currentParentId}`;
        }
        
        try {
            await ApiService.post(url, formData);
            e.target.reset();
            Utils.showToast('File uploaded successfully', 'success');
            if (loadCallback) loadCallback(currentParentId);
        } catch (error) {
            Utils.error('Upload failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },
    
    // Handle group upload
    handleGroupUpload: async function(e, currentParentId, loadCallback, navigateCallback) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const file = formData.get('file');
        const groupId = document.getElementById('groupUploadId').value.trim() || currentParentId || '';
        
        if (!Utils.validateFileSize(file)) {
            Utils.showToast('File too large (max 100MB)', 'error');
            return;
        }
        
        let url = '/api/testsgroups/upload';
        if (groupId) {
            url += `?groupId=${groupId}`;
        }
        
        try {
            await ApiService.post(url, formData);
            e.target.reset();
            Utils.showToast('Test group uploaded successfully', 'success');
            
            // Navigate to the group if specified
            if (groupId && groupId !== currentParentId && navigateCallback) {
                navigateCallback(groupId);
            } else if (loadCallback) {
                loadCallback(currentParentId);
            }
        } catch (error) {
            Utils.error('Group upload failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },
    
    // Handle create group
    handleCreateGroup: async function(e, currentParentId, loadCallback) {
        e.preventDefault();
        
        const name = document.getElementById('groupName').value.trim();
        if (!name) {
            Utils.showToast('Group name is required', 'error');
            return;
        }
        
        let url = '/api/testGroup';
        const params = new URLSearchParams();
        params.append('Name', name);
        if (currentParentId) {
            params.append('ParentGroupId', currentParentId);
        }
        url += '?' + params.toString();
        
        try {
            await ApiService.post(url);
            document.getElementById('groupName').value = '';
            Utils.showToast('Group created successfully', 'success');
            if (loadCallback) loadCallback(currentParentId);
        } catch (error) {
            Utils.error('Create group failed:', error);
            Utils.showToast(error.message, 'error');
        }
    }
};
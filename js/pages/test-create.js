// Test Create Page
document.addEventListener('DOMContentLoaded', async function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get group ID from URL if coming from a folder
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');
    
    const groupIdInput = document.getElementById('testGroupId');
    if (groupIdInput && groupId) {
        groupIdInput.value = groupId;
        // Make it readonly so user doesn't accidentally change it
        groupIdInput.readOnly = true;
        groupIdInput.classList.add('bg-light');
        
        // Try to get group name for display
        try {
            const response = await ApiService.get(`/api/tests?ParentId=${groupId}`);
            const data = await response.json();
            const group = data.subGroups?.find(g => g.id === groupId);
            if (group) {
                // Add a small indicator showing which folder we're in
                const formCard = document.querySelector('.card-body');
                const infoDiv = document.createElement('div');
                infoDiv.className = 'alert alert-info mb-3';
                infoDiv.innerHTML = `<i class="fas fa-folder-open me-2"></i>Creating test in folder: <strong>${group.name}</strong>`;
                formCard.insertBefore(infoDiv, formCard.firstChild);
            }
        } catch (error) {
            Utils.log('Could not get group name:', error);
        }
    }
    
    const createForm = document.getElementById('createTestForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateTest);
    }
});

async function handleCreateTest(e) {
    e.preventDefault();
    
    const name = document.getElementById('testName').value.trim();
    const content = document.getElementById('testContent').value.trim();
    const groupIdInput = document.getElementById('testGroupId');
    const groupId = groupIdInput ? groupIdInput.value.trim() || null : null;
    
    if (!name) {
        Utils.showToast('Test name is required', 'error');
        return;
    }
    
    if (!content) {
        Utils.showToast('Test content is required', 'error');
        return;
    }
    
    try {
        const response = await ApiService.post('/api/tests', {
            name: name,
            content: content,
            groupId: groupId
        });
        
        const data = await response.json();
        Utils.showToast('Test created successfully', 'success');
        
        // Store navigation info to return to the correct folder
        if (groupId) {
            sessionStorage.setItem('navigateToTests', 'true');
            sessionStorage.setItem('navigateToGroup', groupId);
        } else {
            sessionStorage.setItem('navigateToTests', 'true');
            sessionStorage.setItem('navigateToRoot', 'true');
        }
        
        // Redirect to the test view page
        setTimeout(() => {
            window.location.href = `test-view.html?id=${data}`;
        }, 1500);
        
    } catch (error) {
        Utils.error('Create test failed:', error);
        Utils.showToast(error.message, 'error');
    }
}
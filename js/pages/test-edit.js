// Test Edit Page
let currentTestId = null;
let returnFolder = null;

document.addEventListener('DOMContentLoaded', async function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get test ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTestId = urlParams.get('id');
    returnFolder = urlParams.get('folder');
    
    if (!currentTestId) {
        Utils.showToast('No test ID provided', 'error');
        setTimeout(() => {
            window.location.href = 'tests.html';
        }, 2000);
        return;
    }
    
    await loadTestData();
    
    // Bind events
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (returnFolder) {
                window.location.href = `test-view.html?id=${currentTestId}&folder=${returnFolder}`;
            } else {
                window.location.href = `test-view.html?id=${currentTestId}`;
            }
        });
    }
    
    const editForm = document.getElementById('editTestForm');
    if (editForm) {
        editForm.addEventListener('submit', saveTest);
    }
    
    const viewLink = document.getElementById('viewTestLink');
    if (viewLink) {
        if (returnFolder) {
            viewLink.href = `test-view.html?id=${currentTestId}&folder=${returnFolder}`;
        } else {
            viewLink.href = `test-view.html?id=${currentTestId}`;
        }
    }
});

async function loadTestData() {
    try {
        Utils.log('Loading test data for ID:', currentTestId);
        
        const response = await ApiService.get(`/api/tests/${currentTestId}/content`);
        if (!response.ok) {
            throw new Error(`Failed to load test content: ${response.status}`);
        }
        const data = await response.json();
        Utils.log('Content data received:', data);
        
        // Populate form
        const nameInput = document.getElementById('editTestName');
        const idInput = document.getElementById('editTestId');
        const contentInput = document.getElementById('editTestContent');
        const groupInput = document.getElementById('editTestGroupId');
        
        if (nameInput) nameInput.value = data.name || '';
        if (idInput) idInput.value = data.id;
        if (contentInput) contentInput.value = data.content || '';
        if (groupInput) groupInput.value = data.testGroupId || '';
        
    } catch (error) {
        Utils.error('Failed to load test data:', error);
        Utils.showToast(error.message, 'error');
    }
}

async function saveTest(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('editTestName');
    const contentInput = document.getElementById('editTestContent');
    const groupInput = document.getElementById('editTestGroupId');
    
    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    const groupId = groupInput ? groupInput.value.trim() : null;
    
    if (!name) {
        Utils.showToast('Name is required', 'error');
        return;
    }
    
    if (!content) {
        Utils.showToast('Content is required', 'error');
        return;
    }
    
    try {
        await ApiService.put('/api/tests', {
            id: currentTestId,
            name: name,
            content: content
        });
        
        Utils.showToast('Test updated successfully', 'success');
        
        // Return to view page with folder context
        if (returnFolder) {
            setTimeout(() => {
                window.location.href = `test-view.html?id=${currentTestId}&folder=${returnFolder}`;
            }, 1500);
        } else if (groupId) {
            setTimeout(() => {
                window.location.href = `test-view.html?id=${currentTestId}&folder=${groupId}`;
            }, 1500);
        } else {
            setTimeout(() => {
                window.location.href = `test-view.html?id=${currentTestId}`;
            }, 1500);
        }
        
    } catch (error) {
        Utils.error('Failed to update test:', error);
        Utils.showToast(error.message, 'error');
    }
}
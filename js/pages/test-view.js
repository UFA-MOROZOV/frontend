// Test View Page
let currentTestId = null;
let currentTestGroupId = null;

document.addEventListener('DOMContentLoaded', async function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get test ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTestId = urlParams.get('id');
    
    // Also check for folder parameter to return to
    const returnFolder = urlParams.get('folder');
    if (returnFolder) {
        sessionStorage.setItem('returnToFolder', returnFolder);
    }
    
    if (!currentTestId) {
        Utils.showToast('No test ID provided', 'error');
        setTimeout(() => {
            window.location.href = 'tests.html';
        }, 2000);
        return;
    }
    
    await loadTestData();
    
    // Bind events
    const backBtn = document.getElementById('backToTestsBtn');
    if (backBtn) {
        backBtn.addEventListener('click', goBack);
    }
    
    const copyBtn = document.getElementById('copyContentBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyContent);
    }
    
    const editBtn = document.getElementById('editTestBtn');
    if (editBtn) {
        // Preserve folder parameter in edit link
        if (currentTestGroupId) {
            editBtn.href = `test-edit.html?id=${currentTestId}&folder=${currentTestGroupId}`;
        } else {
            editBtn.href = `test-edit.html?id=${currentTestId}`;
        }
    }
});

async function loadTestData() {
    const contentDisplay = document.getElementById('testContentDisplay');
    if (contentDisplay) {
        contentDisplay.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div><p>Loading...</p></div>';
    }
    
    try {
        Utils.log('Loading test data for view, ID:', currentTestId);
        
        const response = await ApiService.get(`/api/tests/${currentTestId}/content`);
        if (!response.ok) {
            throw new Error(`Failed to load test content: ${response.status}`);
        }
        const data = await response.json();
        Utils.log('Test data received:', data);
        
        currentTestGroupId = data.testGroupId || null;
        
        // Update page title
        const titleElement = document.getElementById('testName');
        if (titleElement) {
            titleElement.textContent = data.name || 'View Test';
        }
        
        // Update display fields
        const nameDisplay = document.getElementById('testNameDisplay');
        if (nameDisplay) {
            nameDisplay.textContent = data.name || 'Unnamed Test';
        }
        
        const idDisplay = document.getElementById('testIdDisplay');
        if (idDisplay) {
            idDisplay.textContent = data.id;
        }
        
        // Display group info
        const groupDisplay = document.getElementById('testGroupDisplay');
        if (groupDisplay) {
            if (data.testGroupId) {
                groupDisplay.innerHTML = `<a href="#" onclick="goToGroup('${data.testGroupId}'); return false;">View in folder</a> (${data.testGroupId})`;
            } else {
                groupDisplay.textContent = 'Root folder';
            }
        }
        
        // Display content
        if (contentDisplay) {
            const content = data.content || 'No content available';
            contentDisplay.innerHTML = `<code>${Utils.escapeHtml(content)}</code>`;
        }
        
        // Update edit button link again now that we have the group ID
        const editBtn = document.getElementById('editTestBtn');
        if (editBtn && currentTestGroupId) {
            editBtn.href = `test-edit.html?id=${currentTestId}&folder=${currentTestGroupId}`;
        }
        
    } catch (error) {
        Utils.error('Failed to load test data:', error);
        Utils.showToast(error.message, 'error');
        
        if (contentDisplay) {
            contentDisplay.innerHTML = `<div class="alert alert-danger">Error loading content: ${error.message}</div>`;
        }
    }
}

function goBack() {
    // Use URL parameter for reliable navigation
    if (currentTestGroupId) {
        window.location.href = `tests.html?folder=${currentTestGroupId}`;
    } else {
        window.location.href = 'tests.html';
    }
}

function goToGroup(groupId) {
    window.location.href = `tests.html?folder=${groupId}`;
}

function copyContent() {
    const contentElement = document.getElementById('testContentDisplay');
    if (!contentElement) return;
    
    const content = contentElement.textContent || '';
    
    navigator.clipboard.writeText(content).then(() => {
        Utils.showToast('Content copied to clipboard', 'success');
    }).catch(() => {
        Utils.showToast('Failed to copy content', 'error');
    });
}
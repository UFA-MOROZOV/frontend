// Header View Page
let currentHeaderId = null;

document.addEventListener('DOMContentLoaded', async function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get header ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentHeaderId = urlParams.get('id');
    
    if (!currentHeaderId) {
        Utils.showToast('No header ID provided', 'error');
        setTimeout(() => {
            window.location.href = 'headers.html';
        }, 2000);
        return;
    }
    
    await loadHeaderData();
    
    // Bind events
    const backBtn = document.getElementById('backToHeadersBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'headers.html';
        });
    }
    
    const copyBtn = document.getElementById('copyHeaderContentBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyContent);
    }
    
    const editBtn = document.getElementById('editHeaderBtn');
    if (editBtn) {
        editBtn.href = `header-edit.html?id=${currentHeaderId}`;
    }
});

async function loadHeaderData() {
    const contentDisplay = document.getElementById('headerContentDisplay');
    if (contentDisplay) {
        contentDisplay.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div><p>Loading...</p></div>';
    }
    
    try {
        Utils.log('Loading header data for view, ID:', currentHeaderId);
        
        const response = await ApiService.get(`/api/headerFiles/${currentHeaderId}/content`);
        if (!response.ok) {
            throw new Error(`Failed to load header content: ${response.status}`);
        }
        const data = await response.json();
        Utils.log('Header data received:', data);
        
        // Update page title
        const titleElement = document.getElementById('headerName');
        if (titleElement) {
            titleElement.textContent = data.name || 'View Header';
        }
        
        // Update display fields
        const nameDisplay = document.getElementById('headerNameDisplay');
        if (nameDisplay) {
            nameDisplay.textContent = data.name || 'Unnamed Header';
        }
        
        // Display content
        if (contentDisplay) {
            const content = data.content || 'No content available';
            contentDisplay.innerHTML = `<code>${Utils.escapeHtml(content)}</code>`;
        }
        
    } catch (error) {
        Utils.error('Failed to load header data:', error);
        Utils.showToast(error.message, 'error');
        
        if (contentDisplay) {
            contentDisplay.innerHTML = `<div class="alert alert-danger">Error loading content: ${error.message}</div>`;
        }
    }
}

function copyContent() {
    const contentElement = document.getElementById('headerContentDisplay');
    if (!contentElement) return;
    
    const content = contentElement.textContent || '';
    
    navigator.clipboard.writeText(content).then(() => {
        Utils.showToast('Content copied to clipboard', 'success');
    }).catch(() => {
        Utils.showToast('Failed to copy content', 'error');
    });
}
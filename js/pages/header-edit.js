// Header Edit Page
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
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = `header-view.html?id=${currentHeaderId}`;
        });
    }
    
    const editForm = document.getElementById('editHeaderForm');
    if (editForm) {
        editForm.addEventListener('submit', saveHeader);
    }
    
    const viewLink = document.getElementById('viewHeaderLink');
    if (viewLink) {
        viewLink.href = `header-view.html?id=${currentHeaderId}`;
    }
});

async function loadHeaderData() {
    try {
        Utils.log('Loading header data for ID:', currentHeaderId);
        
        const response = await ApiService.get(`/api/headerFiles/${currentHeaderId}/content`);
        if (!response.ok) {
            throw new Error(`Failed to load header content: ${response.status}`);
        }
        const data = await response.json();
        Utils.log('Header data received:', data);
        
        // Populate form
        const nameInput = document.getElementById('editHeaderName');
        const idInput = document.getElementById('editHeaderId');
        const contentInput = document.getElementById('editHeaderContent');
        
        if (nameInput) nameInput.value = data.name || '';
        if (idInput) idInput.value = data.id;
        if (contentInput) contentInput.value = data.content || '';
        
    } catch (error) {
        Utils.error('Failed to load header data:', error);
        Utils.showToast(error.message, 'error');
    }
}

async function saveHeader(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('editHeaderName');
    const contentInput = document.getElementById('editHeaderContent');
    
    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!name) {
        Utils.showToast('Name is required', 'error');
        return;
    }
    
    if (!content) {
        Utils.showToast('Content is required', 'error');
        return;
    }
    
    try {
        await ApiService.put('/api/headerFiles', {
            id: currentHeaderId,
            name: name,
            content: content
        });
        
        Utils.showToast('Header file updated successfully', 'success');
        
        setTimeout(() => {
            window.location.href = `header-view.html?id=${currentHeaderId}`;
        }, 1500);
        
    } catch (error) {
        Utils.error('Failed to update header:', error);
        Utils.showToast(error.message, 'error');
    }
}
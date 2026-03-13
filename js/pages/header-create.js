// Header Create Page
document.addEventListener('DOMContentLoaded', async function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    const createForm = document.getElementById('createHeaderForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateHeader);
    }
});

async function handleCreateHeader(e) {
    e.preventDefault();
    
    const name = document.getElementById('headerName').value.trim();
    const content = document.getElementById('headerContent').value.trim();
    
    if (!name) {
        Utils.showToast('Header name is required', 'error');
        return;
    }
    
    if (!content) {
        Utils.showToast('Header content is required', 'error');
        return;
    }
    
    try {
        const response = await ApiService.post('/api/headerFiles', {
            name: name,
            content: content
        });
        
        const data = await response.json();
        Utils.showToast('Header file created successfully', 'success');
        
        setTimeout(() => {
            window.location.href = `header-view.html?id=${data}`;
        }, 1500);
        
    } catch (error) {
        Utils.error('Create header failed:', error);
        Utils.showToast(error.message, 'error');
    }
}
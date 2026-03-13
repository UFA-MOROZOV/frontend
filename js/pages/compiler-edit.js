// Compiler Edit Page
let currentCompilerId = null;

document.addEventListener('DOMContentLoaded', async function() {
    AuthModule.init();
    
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get compiler ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentCompilerId = urlParams.get('id');
    
    if (!currentCompilerId) {
        Utils.showToast('No compiler ID provided', 'error');
        setTimeout(() => {
            window.location.href = 'compilers.html';
        }, 2000);
        return;
    }
    
    await loadCompilerData();
    
    // Bind events
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = 'compilers.html';
        });
    }
    
    const editForm = document.getElementById('editCompilerForm');
    if (editForm) {
        editForm.addEventListener('submit', saveCompiler);
    }
    
    const deleteDockerBtn = document.getElementById('deleteDockerImageBtn');
    if (deleteDockerBtn) {
        deleteDockerBtn.addEventListener('click', deleteDockerImage);
    }
    
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    if (downloadImageBtn) {
        downloadImageBtn.addEventListener('click', downloadImage);
    }
});

async function loadCompilerData() {
    try {
        Utils.log('Loading compiler data for ID:', currentCompilerId);
        
        const response = await ApiService.get('/api/compilers');
        const compilers = await response.json();
        const compiler = compilers.find(c => c.id == currentCompilerId);
        
        if (!compiler) {
            throw new Error('Compiler not found');
        }
        
        Utils.log('Compiler data received:', compiler);
        
        // Update page title
        const titleElement = document.getElementById('compilerName');
        if (titleElement) {
            titleElement.textContent = compiler.name || 'Edit Compiler';
        }
        
        // Populate form
        document.getElementById('editCompilerId').value = compiler.id;
        document.getElementById('editCompilerName').value = compiler.name || '';
        document.getElementById('editCompilerVersion').value = compiler.version || '';
        document.getElementById('editCompilerCommand').value = compiler.commandName || '';
        
        const hasDockerCheckbox = document.getElementById('editCompilerHasDocker');
        if (hasDockerCheckbox) {
            hasDockerCheckbox.checked = compiler.hasDockerLocally || false;
        }
        
        // Update Docker status and buttons
        const dockerStatus = document.getElementById('dockerStatus');
        const deleteDockerBtn = document.getElementById('deleteDockerImageBtn');
        
        if (dockerStatus) {
            if (compiler.hasDockerLocally) {
                dockerStatus.innerHTML = '<span class="text-success"><i class="fas fa-check-circle me-2"></i>Docker image is present locally</span>';
                if (deleteDockerBtn) deleteDockerBtn.disabled = false;
            } else {
                dockerStatus.innerHTML = '<span class="text-muted"><i class="fas fa-times-circle me-2"></i>No Docker image present locally</span>';
                if (deleteDockerBtn) deleteDockerBtn.disabled = true;
            }
        }
        
    } catch (error) {
        Utils.error('Failed to load compiler data:', error);
        Utils.showToast(error.message, 'error');
    }
}

async function saveCompiler(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editCompilerId').value);
    const name = document.getElementById('editCompilerName').value.trim();
    const version = document.getElementById('editCompilerVersion').value.trim();
    const commandName = document.getElementById('editCompilerCommand').value.trim();
    
    if (!name || !version || !commandName) {
        Utils.showToast('All fields are required', 'error');
        return;
    }
    
    try {
        await ApiService.put('/api/compilers', {
            id: id,
            name: name,
            version: version,
            commandName: commandName
        });
        
        Utils.showToast('Compiler updated successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'compilers.html';
        }, 1500);
        
    } catch (error) {
        Utils.error('Failed to update compiler:', error);
        Utils.showToast(error.message, 'error');
    }
}

async function deleteDockerImage() {
    if (!confirm('Are you sure you want to delete the Docker image for this compiler? This action cannot be undone.')) {
        return;
    }
    
    LoadingOverlay.show('Deleting Docker image...', true);
    LoadingOverlay.updateProgress(30, 'Removing image...');
    
    try {
        await ApiService.delete(`/api/compilers/${currentCompilerId}/image`);
        
        LoadingOverlay.updateProgress(100, 'Image deleted successfully');
        LoadingOverlay.hide();
        
        Utils.showToast('Docker image deleted successfully', 'success');
        await loadCompilerData();
        
    } catch (error) {
        LoadingOverlay.hide();
        Utils.error('Failed to delete Docker image:', error);
        Utils.showToast(error.message, 'error');
    }
}

async function downloadImage() {
    // Show loading overlay with steps
    const steps = [
        { message: 'Initiating download...', detail: 'Connecting to server' },
        { message: 'Downloading Docker image...', detail: 'This may take several minutes' },
        { message: 'Processing image...', detail: 'Almost done' },
        { message: 'Finalizing...', detail: 'Completing setup' }
    ];
    
    LoadingOverlay.showSteps(steps);
    
    try {
        // Step 1: Initiating
        LoadingOverlay.updateStep(0);
        
        // Make the API call with longer timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout for download
        
        // Step 2: Downloading
        LoadingOverlay.updateStep(1);
        
        const response = await fetch(CONFIG.API_BASE + `/api/compilers/${currentCompilerId}/download`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${ApiService.getToken()}`
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }
        
        // Step 3: Processing
        LoadingOverlay.updateStep(2);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
        
        // Step 4: Finalizing
        LoadingOverlay.updateStep(3);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        LoadingOverlay.hide();
        Utils.showToast('Download triggered successfully', 'success');
        
        // Reload compiler data to update status
        setTimeout(async () => {
            await loadCompilerData();
        }, 5000);
        
    } catch (error) {
        LoadingOverlay.hide();
        
        if (error.name === 'AbortError') {
            Utils.showToast('Download timed out after 5 minutes', 'error');
        } else {
            Utils.error('Failed to download image:', error);
            Utils.showToast(error.message, 'error');
        }
    }
}
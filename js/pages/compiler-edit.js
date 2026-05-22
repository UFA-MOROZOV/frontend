const compilerEditPage = {
    compilerId: null,
    compiler: null,

    init: async function () {
        const params = new URLSearchParams(window.location.search);
        this.compilerId = params.get('id');

        if (!this.compilerId) {
            Utils.showToast('Compiler id is missing', 'error');
            window.location.href = 'compilers.html';
            return;
        }

        this.form = document.getElementById('editCompilerForm');
        this.typeSelect = document.getElementById('compilerType');
        this.commandNameGroup = document.getElementById('commandNameGroup');
        this.commandNameInput = document.querySelector('input[name="CommandName"]');
        this.imageNameGroup = document.getElementById('imageNameGroup');
        this.imageNameInput = document.querySelector('input[name="ImageName"]');
        this.fileHint = document.getElementById('compilerFileHint');
        this.dockerActions = document.getElementById('dockerActions');
        this.uploadSectionTitle = document.getElementById('uploadSectionTitle');

        if (this.dockerActions) {
            this.dockerActions.classList.add('d-none');
        }
        if (this.commandNameGroup) {
            this.commandNameGroup.classList.add('d-none');
        }
        if (this.imageNameGroup) {
            this.imageNameGroup.classList.add('d-none');
        }

        this.bindEvents();
        await this.loadCompiler();
    },

    bindEvents: function () {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSave(e));
        }

        if (this.typeSelect) {
            this.typeSelect.addEventListener('change', () => this.updateFormByType());
        }

        const uploadForm = document.getElementById('uploadCompilerFileForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
        }

        const deleteDockerBtn = document.getElementById('deleteDockerImageBtn');
        if (deleteDockerBtn) {
            deleteDockerBtn.addEventListener('click', () => this.deleteDockerImage());
        }

        const downloadDockerBtn = document.getElementById('downloadDockerImageBtn');
        if (downloadDockerBtn) {
            downloadDockerBtn.addEventListener('click', () => this.downloadDockerImage());
        }
    },

    loadCompiler: async function () {
        LoadingOverlay.show('Loading compiler...', true);

        try {
            const response = await ApiService.get('/api/compilers');
            const compilers = await response.json();

            this.compiler = compilers.find(c => String(c.id) === String(this.compilerId));

            if (!this.compiler) {
                throw new Error('Compiler not found');
            }

            document.querySelector('input[name="Id"]').value = this.compiler.id;
            document.querySelector('input[name="Name"]').value = this.compiler.name || '';
            document.querySelector('input[name="Version"]').value = this.compiler.version || '';
            document.querySelector('input[name="Include"]').value = this.compiler.includeFlag || '';
            this.typeSelect.value = String(this.compiler.type ?? 0);

            if (this.commandNameInput) {
                this.commandNameInput.value = this.compiler.commandName || '';
            }
            if (this.imageNameInput) {
                this.imageNameInput.value = this.compiler.imageName || '';
            }

            this.updateFormByType();
            this.renderCompilerStatus();

            LoadingOverlay.hide();
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Failed to load compiler:', error);
            Utils.showToast(error.message, 'error');
        }
    },

    updateFormByType: function () {
        const type = parseInt(this.typeSelect.value, 10);
        const isDocker = type === 0;

        if (this.commandNameGroup) {
            this.commandNameGroup.classList.toggle('d-none', !isDocker);
        }

        if (this.commandNameInput) {
            this.commandNameInput.required = isDocker;
            if (!isDocker) {
                this.commandNameInput.value = '';
            } else if (this.compiler) {
                this.commandNameInput.value = this.compiler.commandName || '';
            }
        }

        if (this.imageNameGroup) {
            this.imageNameGroup.classList.toggle('d-none', !isDocker);
        }

        if (this.imageNameInput) {
            this.imageNameInput.required = isDocker;
            if (!isDocker) {
                this.imageNameInput.value = '';
            } else if (this.compiler) {
                this.imageNameInput.value = this.compiler.imageName || '';
            }
        }

        if (this.fileHint) {
            this.fileHint.textContent = isDocker
                ? 'Optional: upload a Docker image archive (.tar).'
                : 'Optional: upload an executable compiler file.';
        }

        if (this.uploadSectionTitle) {
            this.uploadSectionTitle.textContent = isDocker ? 'Docker Image File' : 'Executable File';
        }

        if (this.dockerActions) {
            this.dockerActions.classList.toggle('d-none', !isDocker);
        }

        const downloadBtn = document.getElementById('downloadDockerImageBtn');
        const deleteBtn = document.getElementById('deleteDockerImageBtn');

        if (!isDocker) {
            if (downloadBtn) downloadBtn.disabled = true;
            if (deleteBtn) deleteBtn.disabled = true;
        } else if (this.compiler) {
            const hasDocker = this.compiler.hasDockerLocally === true;

            if (downloadBtn) {
                downloadBtn.disabled = hasDocker;
                downloadBtn.title = hasDocker ? 'Docker image already exists locally' : 'Download Docker image';
            }

            if (deleteBtn) {
                deleteBtn.disabled = !hasDocker;
                deleteBtn.title = hasDocker ? 'Delete Docker image' : 'No Docker image to delete';
            }
        }
    },

    renderCompilerStatus: function () {
        const statusBox = document.getElementById('compilerStatus');
        if (!statusBox || !this.compiler) return;

        const isDocker = this.compiler.type === 0;

        let statusHtml = `
            <div><strong>Type:</strong> ${isDocker ? 'Docker' : 'Executable'}</div>
            <div><strong>Name:</strong> ${Utils.escapeHtml(this.compiler.name || 'N/A')}</div>
            <div><strong>Version:</strong> ${Utils.escapeHtml(this.compiler.version || 'N/A')}</div>
        `;

        if (isDocker) {
            const hasDocker = this.compiler.hasDockerLocally === true;

            statusHtml += `
                <div><strong>Command:</strong> ${Utils.escapeHtml(this.compiler.commandName || 'Not set')}</div>
                <div><strong>Image name:</strong> ${Utils.escapeHtml(this.compiler.imageName || 'Not set')}</div>
                <div><strong>Docker status:</strong> ${hasDocker ? 'Available locally' : 'Not downloaded'}</div>
            `;

            const downloadBtn = document.getElementById('downloadDockerImageBtn');
            const deleteBtn = document.getElementById('deleteDockerImageBtn');

            if (downloadBtn) {
                downloadBtn.disabled = hasDocker;
                downloadBtn.title = hasDocker ? 'Docker image already exists locally' : 'Download Docker image';
            }

            if (deleteBtn) {
                deleteBtn.disabled = !hasDocker;
                deleteBtn.title = hasDocker ? 'Delete Docker image' : 'No Docker image to delete';
            }
        } else {
            statusHtml += `
                <div><strong>File status:</strong> ${this.compiler.executablePath ? 'Uploaded' : 'Not uploaded'}</div>
            `;
        }

        statusBox.innerHTML = statusHtml;
    },

    handleSave: async function (e) {
        e.preventDefault();

        const type = parseInt(this.typeSelect.value, 10);

        const payload = {
            id: parseInt(document.querySelector('input[name="Id"]').value, 10),
            name: document.querySelector('input[name="Name"]').value,
            version: document.querySelector('input[name="Version"]').value,
            includeFlag: document.querySelector('input[name="Include"]').value
        };

        if (type === 0) {
            payload.commandName = document.querySelector('input[name="CommandName"]').value;
            payload.imageName = document.querySelector('input[name="ImageName"]').value;
        }

        LoadingOverlay.show('Saving compiler...', true);
        LoadingOverlay.updateProgress(50, 'Updating data');

        try {
            await ApiService.put('/api/compilers', payload);

            LoadingOverlay.updateProgress(100, 'Saved');
            setTimeout(() => LoadingOverlay.hide(), 400);

            Utils.showToast('Compiler updated successfully', 'success');

            await this.loadCompiler();
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Failed to update compiler:', error);
            Utils.showToast(error.message, 'error');
        }
    },

    handleUpload: async function (e) {
        e.preventDefault();

        const fileInput = document.getElementById('compilerFile');
        const file = fileInput.files && fileInput.files[0];

        if (!file) {
            Utils.showToast('Please choose a file', 'error');
            return;
        }

        if (!Utils.validateFileSize(file)) {
            Utils.showToast('File too large (max 100MB)', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('imageFile', file);

        LoadingOverlay.show('Uploading file...', true);
        LoadingOverlay.updateProgress(50, 'Sending file');

        try {
            await ApiService.put(`/api/compilers/${this.compilerId}/uploadFile`, formData);

            LoadingOverlay.updateProgress(100, 'Uploaded');
            setTimeout(() => LoadingOverlay.hide(), 400);

            Utils.showToast('File uploaded successfully', 'success');
            fileInput.value = '';

            await this.loadCompiler();
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Upload failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },

    downloadDockerImage: async function () {
        if (!this.compiler || this.compiler.type !== 0) return;

        LoadingOverlay.show('Downloading Docker image...', true);
        LoadingOverlay.updateProgress(50, 'Request sent');

        try {
            await ApiService.put(`/api/compilers/${this.compilerId}/download`);

            LoadingOverlay.updateProgress(100, 'Started');
            setTimeout(() => LoadingOverlay.hide(), 400);

            Utils.showToast('Docker image download started', 'success');
            await this.loadCompiler();
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Docker download failed:', error);
            Utils.showToast(error.message, 'error');
        }
    },

    deleteDockerImage: async function () {
        if (!this.compiler || this.compiler.type !== 0) return;
        if (!confirm('Are you sure you want to delete the Docker image?')) return;

        LoadingOverlay.show('Deleting Docker image...', true);
        LoadingOverlay.updateProgress(50, 'Removing image');

        try {
            await ApiService.delete(`/api/compilers/${this.compilerId}/image`);

            LoadingOverlay.updateProgress(100, 'Deleted');
            setTimeout(() => LoadingOverlay.hide(), 400);

            Utils.showToast('Docker image deleted successfully', 'success');
            await this.loadCompiler();
        } catch (error) {
            LoadingOverlay.hide();
            Utils.error('Delete Docker image failed:', error);
            Utils.showToast(error.message, 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    AuthModule.init();

    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    compilerEditPage.init();
});
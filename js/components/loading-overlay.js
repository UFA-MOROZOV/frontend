// Loading Overlay Component
const LoadingOverlay = {
    overlay: null,
    messageEl: null,
    progressBar: null,
    progressText: null,
    
    init: function() {
        // Check if overlay already exists
        if (document.getElementById('globalLoadingOverlay')) {
            this.overlay = document.getElementById('globalLoadingOverlay');
            this.messageEl = document.getElementById('loadingMessage');
            this.progressBar = document.getElementById('loadingProgressBar');
            this.progressText = document.getElementById('loadingProgressText');
            return;
        }
        
        // Create overlay HTML
        const overlayHTML = `
            <div id="globalLoadingOverlay" class="loading-overlay" style="display: none;">
                <div class="loading-content">
                    <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h4 id="loadingMessage" class="mt-3">Processing...</h4>
                    <div class="progress mt-3" style="width: 80%; display: none;">
                        <div id="loadingProgressBar" class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" style="width: 0%">0%</div>
                    </div>
                    <p id="loadingProgressText" class="text-muted mt-2"></p>
                    <button id="cancelLongOperation" class="btn btn-sm btn-outline-secondary mt-3" style="display: none;">
                        <i class="fas fa-times me-1"></i>Cancel
                    </button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        
        // Get references
        this.overlay = document.getElementById('globalLoadingOverlay');
        this.messageEl = document.getElementById('loadingMessage');
        this.progressBar = document.getElementById('loadingProgressBar');
        this.progressText = document.getElementById('loadingProgressText');
        
        // Add styles
        this.addStyles();
    },
    
    addStyles: function() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
            }
            
            .loading-content {
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                min-width: 300px;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .loading-content .progress {
                height: 25px;
                border-radius: 12px;
            }
            
            .loading-content .progress-bar {
                font-weight: bold;
                line-height: 25px;
            }
        `;
        document.head.appendChild(styleEl);
    },
    
    show: function(message = 'Processing...', showProgress = false) {
        this.init();
        if (this.messageEl) this.messageEl.textContent = message;
        
        if (showProgress) {
            if (this.progressBar) {
                this.progressBar.style.width = '0%';
                this.progressBar.textContent = '0%';
                this.progressBar.closest('.progress').style.display = 'block';
            }
            if (this.progressText) this.progressText.textContent = '';
        } else {
            if (this.progressBar) this.progressBar.closest('.progress').style.display = 'none';
            if (this.progressText) this.progressText.textContent = '';
        }
        
        this.overlay.style.display = 'flex';
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    },
    
    updateMessage: function(message) {
        if (this.messageEl) this.messageEl.textContent = message;
    },
    
    updateProgress: function(percent, text = null) {
        if (this.progressBar) {
            this.progressBar.style.width = percent + '%';
            this.progressBar.textContent = percent + '%';
        }
        if (text && this.progressText) {
            this.progressText.textContent = text;
        }
    },
    
    hide: function() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    },
    
    // For long operations with multiple steps
    showSteps: function(steps) {
        this.show('Starting...', true);
        this.currentStep = 0;
        this.steps = steps;
        this.updateStep(0);
    },
    
    updateStep: function(stepIndex) {
        if (this.steps && stepIndex < this.steps.length) {
            const step = this.steps[stepIndex];
            this.updateMessage(step.message);
            this.updateProgress(Math.round((stepIndex / this.steps.length) * 100), step.detail);
            this.currentStep = stepIndex;
        }
    },
    
    nextStep: function() {
        if (this.currentStep < this.steps.length - 1) {
            this.updateStep(this.currentStep + 1);
        }
    }
};

// Auto-initialize
LoadingOverlay.init();
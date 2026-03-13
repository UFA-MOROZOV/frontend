// Tests navigation module
const TestsNavigation = {
    // Initialize navigation
    init: function(loadTestsCallback) {
        this.checkForNavigation(loadTestsCallback);
    },
    
    // Check for navigation from session storage
    checkForNavigation: function(loadTestsCallback) {
        const navigateToTests = sessionStorage.getItem('navigateToTests');
        const navigateToGroup = sessionStorage.getItem('navigateToGroup');
        const navigateToRoot = sessionStorage.getItem('navigateToRoot');
        
        if (navigateToTests) {
            sessionStorage.removeItem('navigateToTests');
            
            if (navigateToGroup) {
                sessionStorage.removeItem('navigateToGroup');
                Utils.log('Navigating to group from storage:', navigateToGroup);
                setTimeout(() => {
                    TestsCommon.navigateToGroup(navigateToGroup, null, null, loadTestsCallback);
                }, 100);
            } else if (navigateToRoot) {
                sessionStorage.removeItem('navigateToRoot');
                Utils.log('Navigating to root from storage');
                setTimeout(() => {
                    if (loadTestsCallback) loadTestsCallback(null);
                }, 100);
            } else {
                if (loadTestsCallback) loadTestsCallback(null);
            }
        } else {
            // Check URL for group parameter
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('groupId');
            if (groupId) {
                TestsCommon.navigateToGroup(groupId, null, null, loadTestsCallback);
            } else {
                if (loadTestsCallback) loadTestsCallback(null);
            }
        }
    },
    
    // Update create button with current folder
    updateCreateButton: function(buttonSelector, baseUrl) {
        const createBtn = document.querySelector(buttonSelector);
        if (createBtn && TestsCommon.currentParentId) {
            createBtn.href = `${baseUrl}?groupId=${TestsCommon.currentParentId}`;
        } else if (createBtn) {
            createBtn.href = baseUrl;
        }
    }
};
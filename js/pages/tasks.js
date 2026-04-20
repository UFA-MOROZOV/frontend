// Tasks page
const tasksPage = {
    currentTaskId: null,

    init: function () {
        this.loadTasks();
    },

    // Helper to determine task status from available data
    getTaskStatus: function (task, fromList = false) {
        // If we're in the list view and have isCompleted, use it
        if (fromList && task.hasOwnProperty('isCompleted')) {
            if (task.isCompleted) {
                return {
                    text: 'Completed',
                    class: 'success',
                    icon: 'fa-check-circle'
                };
            } else {
                return {
                    text: 'In Progress',
                    class: 'warning',
                    icon: 'fa-spinner fa-pulse'
                };
            }
        }

        // For details view or when isCompleted isn't available, use dates
        if (task.dateOfCompletion) {
            return {
                text: 'Completed',
                class: 'success',
                icon: 'fa-check-circle'
            };
        }

        if (task.dateOfStart) {
            return {
                text: 'In Progress',
                class: 'warning',
                icon: 'fa-spinner fa-pulse'
            };
        }

        if (task.dateOfCreation) {
            return {
                text: 'Pending',
                class: 'secondary',
                icon: 'fa-clock'
            };
        }

        return {
            text: 'Unknown',
            class: 'secondary',
            icon: 'fa-question-circle'
        };
    },

    loadTasks: async function () {
        const container = document.getElementById('tasksList');
        if (!container) return;

        Utils.showLoading('tasksList');

        try {
            const response = await ApiService.get('/api/compilersTasks');
            const tasks = await response.json();

            if (!tasks || tasks.length === 0) {
                Utils.showEmpty('tasksList', 'No tasks found');
                return;
            }

            let html = '<div class="list-group">';
            tasks.forEach(t => {
                // Use fromList=true since list has isCompleted
                const status = this.getTaskStatus(t, true);

                html += `
                    <button class="list-group-item list-group-item-action" onclick="tasksPage.showTaskDetails('${t.id}')">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas ${status.icon} text-${status.class} me-2"></i>
                                <strong>${t.name || 'Unnamed Task'}</strong>
                                <small class="text-muted ms-2">ID: ${t.id}</small>
                            </div>
                            <span class="badge bg-${status.class}">${status.text}</span>
                        </div>
                    </button>
                `;
            });
            html += '</div>';

            container.innerHTML = html;

        } catch (error) {
            Utils.error('Failed to load tasks:', error);
            Utils.showError('tasksList', error.message);
        }
    },

    exportTask: async function (taskId) {
        try {
            Utils.showToast('Preparing export...', 'info');

            const response = await ApiService.get(`/api/compilersTasks/${taskId}/export`);

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `task-${taskId}.json`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            // Get the blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            Utils.showToast('Export completed successfully', 'success');

        } catch (error) {
            Utils.error('Failed to export task:', error);
            Utils.showToast('Failed to export task: ' + error.message, 'error');
        }
    },

    showTaskDetails: async function (id) {
        this.currentTaskId = id;
        const detailsDiv = document.getElementById('taskDetails');
        if (!detailsDiv) return;

        detailsDiv.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading...</div>';

        try {
            const response = await ApiService.get(`/api/compilersTasks/${id}`);
            const task = await response.json();

            // Use fromList=false for details view (use dates)
            const status = this.getTaskStatus(task, false);

            let html = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="text-primary mb-0">Task Information</h6>
                    <div>
                        <button class="btn btn-sm btn-outline-success me-2" onclick="tasksPage.exportTask('${task.id}')" title="Export task">
                            <i class="fas fa-download me-1"></i>Export
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="tasksPage.refreshCurrentTask()" title="Refresh this task">
                            <i class="fas fa-sync-alt me-1"></i>Refresh
                        </button>
                    </div>
                </div>
                <p><strong>ID:</strong> ${task.id}</p>
                <p><strong>Name:</strong> ${task.name || 'Unnamed'}</p>
                <p><strong>Created:</strong> ${Utils.formatDate(task.dateOfCreation)}</p>
                ${task.dateOfStart ? `<p><strong>Started:</strong> ${Utils.formatDate(task.dateOfStart)}</p>` : ''}
                ${task.dateOfCompletion ? `<p><strong>Completed:</strong> ${Utils.formatDate(task.dateOfCompletion)}</p>` : ''}
                <p><strong>Status:</strong> <span class="badge bg-${status.class}">${status.text}</span></p>
                <p><strong>Run after compile:</strong> ${task.run ? 'Yes' : 'No'}</p>
                <p><strong>Successful compilations:</strong> ${task.successfulCompilations || 0}/${task.tasksCount || 0}</p>
                ${task.run ? `<p><strong>Successful runs:</strong> ${task.successfulRuns || 0}/${task.tasksCount || 0}</p>` : ''}
            `;

            if (task.compiler) {
                const compiler = task.compiler;

                const compilerTypeLabel = compiler?.type === 0 ? 'Docker' : 'Executable';
                const compilerCommand = compiler?.type === 0
                    ? (compiler?.commandName || 'Not set')
                    : 'N/A';

                html += `
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Compiler</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Name:</strong> ${Utils.escapeHtml(compiler?.name || 'N/A')}</p>
                            <p><strong>Version:</strong> ${Utils.escapeHtml(compiler?.version || 'N/A')}</p>
                            <p><strong>Type:</strong> ${compilerTypeLabel}</p>
                            <p><strong>Command:</strong> ${Utils.escapeHtml(compilerCommand)}</p>
                        </div>
                    </div>
                `;
            }

            if (task.test) {
                html += `
                    <div class="mt-3">
                        <h6 class="text-primary">Test</h6>
                        <p><strong>Name:</strong> ${task.test.name}</p>
                        <p><strong>ID:</strong> ${task.test.id}</p>
                    </div>
                `;
            }

            if (task.testGroup) {
                html += `
                    <div class="mt-3">
                        <h6 class="text-primary">Test Group</h6>
                        <p><strong>Name:</strong> ${task.testGroup.name}</p>
                        <p><strong>ID:</strong> ${task.testGroup.id}</p>
                    </div>
                `;
            }

            if (task.testsExecuted && task.testsExecuted.length > 0) {
                html += `
                    <div class="mt-3">
                        <h6 class="text-primary">Executed Tests (${task.testsExecuted.length})</h6>
                        <div class="accordion mt-2" id="executedTestsAccordion">
                `;

                task.testsExecuted.forEach((ex, index) => {
                    const success = ex.compilationSucceeded;
                    const statusIcon = success ? 'fa-check-circle text-success' : 'fa-times-circle text-danger';
                    const statusText = success ? 'Passed' : 'Failed';
                    const accordionId = `test-${index}`;
                    const collapseId = `collapse-${index}`;

                    html += `
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="heading-${accordionId}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                                    <div class="d-flex align-items-center w-100">
                                        <i class="fas ${statusIcon} me-2"></i>
                                        <strong>${ex.test.name}</strong>
                                        <span class="badge bg-secondary ms-2 me-2">${ex.duration || '0s'}</span>
                                        <span class="badge bg-${success ? 'success' : 'danger'}">${statusText}</span>
                                    </div>
                                </button>
                            </h2>
                            <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="heading-${accordionId}" data-bs-parent="#executedTestsAccordion">
                                <div class="accordion-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h6>Compilation</h6>
                                            <p><strong>Duration:</strong> ${ex.compileDuration || 'N/A'}</p>
                                            <p><strong>Exit Code:</strong> ${ex.compilerExitCode !== null ? ex.compilerExitCode : 'N/A'}</p>
                                            ${ex.compilerOutput ? `<pre class="execution-result mt-2"><code>${Utils.escapeHtml(ex.compilerOutput)}</code></pre>` : '<p class="text-muted">No compiler output</p>'}
                                        </div>
                                        <div class="col-md-6">
                                            <h6>Execution</h6>
                                            <p><strong>Duration:</strong> ${ex.runDuration || 'N/A'}</p>
                                            <p><strong>Exit Code:</strong> ${ex.programExitCode !== null ? ex.programExitCode : 'N/A'}</p>
                                            ${ex.programOutput ? `<pre class="execution-result mt-2"><code>${Utils.escapeHtml(ex.programOutput)}</code></pre>` : '<p class="text-muted">No program output</p>'}
                                        </div>
                                    </div>
                                    ${ex.duration && ex.duration !== '00:00:00' ? `<p><strong>Total Duration:</strong> ${ex.duration}</p>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += '</div></div>';
            } else {
                html += '<p class="text-muted mt-3">No tests executed yet</p>';
            }

            detailsDiv.innerHTML = html;

        } catch (error) {
            Utils.error('Failed to load task details:', error);
            detailsDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    },

    refreshCurrentTask: function () {
        if (this.currentTaskId) {
            this.showTaskDetails(this.currentTaskId);
            // Also refresh the task list to update status
            this.loadTasks();
            Utils.showToast('Refreshing task details...', 'info');
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    AuthModule.init();

    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    tasksPage.init();
});
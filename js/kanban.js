import { TaskAPI } from './api.js';
import { DragDrop } from './drag-drop.js';

const STATUS_COLUMNS = [
    { value: 'Some day', label: 'Some day' },
    { value: 'This week', label: 'This week' },
    { value: 'Tomorrow', label: 'Tomorrow' },
    { value: 'Today', label: 'Today' },
    { value: 'In progress', label: 'In progress' },
    { value: 'Done', label: 'Done' },
    { value: 'deleted', label: 'Deleted' }
];

const PRIORITIES = ['low', 'medium', 'high', 'top'];

export class KanbanBoard {
    constructor() {
        this.tasks = [];
        this.editingId = null;
        this.dragDrop = new DragDrop(this.handleDrop.bind(this));
        this.elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            table: document.getElementById('taskTable'),
            body: document.getElementById('taskBody'),
            board: document.getElementById('kanbanBoard'),
            counter: document.getElementById('taskCounter'),
            reload: document.getElementById('reloadBtn')
        };
        this.elements.reload.addEventListener('click', () => this.refresh());
    }

    async init() {
        await this.refresh();
    }

    async refresh() {
        this.setLoading(true);
        try {
            this.tasks = await TaskAPI.getTasks();
            this.setLoading(false);
            this.render();
        } catch (error) {
            this.showError(error.message);
        }
    }

    setLoading(state) {
        this.elements.loading.style.display = state ? 'block' : 'none';
        this.elements.table.style.display = state ? 'none' : 'table';
    }

    showError(message) {
        this.elements.error.textContent = message;
        this.elements.error.style.display = 'block';
        this.setLoading(false);
    }

    hideError() {
        this.elements.error.style.display = 'none';
    }

    render() {
        this.hideError();
        this.updateCounter();
        this.renderTable();
        this.renderBoard();
    }

    updateCounter() {
        this.elements.counter.textContent = `${this.tasks.length} tareas`;
    }

    renderTable() {
        this.elements.body.innerHTML = '';
        this.tasks.forEach(task => {
            const row = task.id === this.editingId ? this.createEditRow(task) : this.createViewRow(task);
            this.elements.body.appendChild(row);
        });
        this.elements.body.appendChild(this.createEditRow());
    }

    renderBoard() {
        this.elements.board.innerHTML = '';
        STATUS_COLUMNS.forEach(column => {
            const columnEl = document.createElement('div');
            columnEl.className = 'kanban-column column';
            columnEl.dataset.status = column.value;
            columnEl.innerHTML = `<h3>${column.label}</h3>`;
            const wrapper = document.createElement('div');
            wrapper.className = 'column';
            wrapper.dataset.status = column.value;
            this.tasks
                .filter(task => task.status === column.value)
                .forEach(task => wrapper.appendChild(this.createCard(task)));
            columnEl.appendChild(wrapper);
            this.elements.board.appendChild(columnEl);
        });
        this.dragDrop.bind(this.elements.board);
    }

    createCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.id = task.id;
        card.innerHTML = `
            <p>${task.description}</p>
            <div class="priority-badge priority-${task.priority}">${task.priority}</div>
        `;
        return card;
    }

    createEditRow(task) {
        const isNew = !task;
        const row = document.createElement('tr');
        if (isNew) {
            row.className = 'new-row';
        }
        row.innerHTML = `
            <td>
                <textarea placeholder="Escribe la descripción...">${task ? task.description : ''}</textarea>
            </td>
            <td>
                <select>
                    ${STATUS_COLUMNS.map(option => `<option value="${option.value}" ${task?.status === option.value ? 'selected' : ''}>${option.value}</option>`).join('')}
                </select>
            </td>
            <td>
                <select>
                    ${PRIORITIES.map(priority => `<option value="${priority}" ${task?.priority === priority ? 'selected' : ''}>${priority}</option>`).join('')}
                </select>
            </td>
            <td>
                <div class="actions">
                    <button class="btn-save">${isNew ? '➕ Crear' : '💾 Guardar'}</button>
                    ${isNew ? '' : '<button class="btn-cancel">❌ Cancelar</button>'}
                </div>
            </td>
        `;

        const textarea = row.querySelector('textarea');
        textarea.addEventListener('input', () => this.autoResize(textarea));
        this.autoResize(textarea);

        const [statusSelect, prioritySelect] = row.querySelectorAll('select');
        const saveButton = row.querySelector('.btn-save');
        saveButton.addEventListener('click', () => {
            const description = textarea.value.trim();
            const status = statusSelect.value;
            const priority = prioritySelect.value;
            if (isNew) {
                this.createTask(description, status, priority);
            } else {
                this.updateTask(task.id, description, status, priority);
            }
        });

        if (!isNew) {
            const cancelButton = row.querySelector('.btn-cancel');
            cancelButton.addEventListener('click', () => {
                this.editingId = null;
                this.render();
            });
        }

        return row;
    }

    createViewRow(task) {
        const row = document.createElement('tr');
        row.dataset.id = task.id;
        row.innerHTML = `
            <td>
                <div class="view-mode">${task.description}</div>
            </td>
            <td>
                <div class="view-mode">${this.statusBadge(task.status)}</div>
            </td>
            <td>
                <div class="view-mode">${this.priorityBadge(task.priority)}</div>
            </td>
            <td>
                <div class="actions">
                    <button class="btn-delete">🗑️ Eliminar</button>
                </div>
            </td>
        `;

        row.querySelectorAll('.view-mode').forEach(cell => {
            cell.addEventListener('dblclick', () => {
                this.editingId = task.id;
                this.render();
            });
        });

        row.querySelector('.btn-delete').addEventListener('click', () => {
            if (confirm('¿Eliminar esta tarea?')) {
                this.deleteTask(task.id);
            }
        });

        return row;
    }

    statusBadge(status) {
        const cls = status.toLowerCase().replace(/\s/g, '');
        return `<span class="status-badge status-${cls}">${status}</span>`;
    }

    priorityBadge(priority) {
        return `<span class="priority-badge priority-${priority}">${priority}</span>`;
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    async createTask(description, status, priority) {
        if (!description) {
            alert('La descripción es obligatoria');
            return;
        }
        try {
            await TaskAPI.createTask(description, status, priority);
            this.editingId = null;
            await this.refresh();
        } catch (error) {
            alert(error.message);
        }
    }

    async updateTask(id, description, status, priority) {
        if (!description) {
            alert('La descripción es obligatoria');
            return;
        }
        try {
            await TaskAPI.updateTask(id, description, status, priority);
            this.editingId = null;
            await this.refresh();
        } catch (error) {
            alert(error.message);
        }
    }

    async deleteTask(id) {
        try {
            await TaskAPI.deleteTask(id);
            await this.refresh();
        } catch (error) {
            alert(error.message);
        }
    }

    async handleDrop(taskId, status) {
        try {
            await TaskAPI.patchTask(taskId, { status });
            await this.refresh();
        } catch (error) {
            alert(error.message);
        }
    }
}


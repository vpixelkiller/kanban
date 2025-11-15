const API_URL = 'http://localhost:8080/tasks.php';

const VALID_STATUS = ['deleted', 'Some day', 'This week', 'Tomorrow', 'Today', 'In progress', 'Done'];
const VALID_PRIORITY = ['low', 'medium', 'high', 'top'];

export class TaskAPI {
    static validate(description, status, priority) {
        if (!description || typeof description !== 'string' || description.trim() === '') {
            throw new Error('La descripción es obligatoria');
        }
        if (status && !VALID_STATUS.includes(status)) {
            throw new Error(`Estado inválido: ${status}`);
        }
        if (priority && !VALID_PRIORITY.includes(priority)) {
            throw new Error(`Prioridad inválida: ${priority}`);
        }
    }

    static async request(path = '', options = {}) {
        const response = await fetch(`${API_URL}${path}`, options);
        const text = await response.text();
        let body;
        try {
            body = text ? JSON.parse(text) : null;
        } catch {
            throw new Error('Respuesta inválida del servidor');
        }
        if (!response.ok) {
            const message = body?.error || `Error ${response.status}`;
            throw new Error(message);
        }
        return body;
    }

    static getTasks() {
        return this.request();
    }

    static createTask(description, status = 'Some day', priority = 'medium') {
        this.validate(description, status, priority);
        return this.request('', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, status, priority })
        });
    }

    static updateTask(id, description, status, priority) {
        this.validate(description, status, priority);
        return this.request(`?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, status, priority })
        });
    }

    static patchTask(id, fields) {
        return this.request(`?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields)
        });
    }

    static deleteTask(id) {
        return this.request(`?id=${id}`, { method: 'DELETE' });
    }
}

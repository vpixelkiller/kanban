const API_URL = 'http://localhost/kanban/tasks.php';

class TaskAPI {

    // Validación básica del contenido de una tarea
    static validateTask(description, status, priority) {
        if (!description || typeof description !== 'string'){
            throw new Error('La descripción debe ser un texto válido.');
        }

        const validStatus = ['deleted','Some day', 'This week','Tomorrow','Today', 'In progress', 'Done'];
        if (status && !validStatus.includes(status)) {'top'
            throw new Error(`Estado inválido. Valores permitidos: ${validStatus.join(', ')}`);
        }

        const validPriority = ['low', 'medium', 'high','top'];
        if (priority && !validPriority.includes(priority)) {
            throw new Error(`Prioridad inválida. Valores
            permitidos: ${validPriority.join(', ')}`);
        }
    }

    // Función común para manejar errores de Fetch y HTTP
    static async handleResponse(response) {
        if (!response.ok) {
            // Intentamos obtener JSON con error del backend
            const errorText = await response.text();
            throw new Error(`Error HTTP ${response.status}:${errorText || 'Respuesta no válida'}`);
        }

        try {
            return await response.json();
        } catch {
            throw new Error('La respuesta del servidor no es JSON válido.');
        }
    }

    static async getTasks() {
        try {
            const response = await fetch(API_URL);
            return await this.handleResponse(response);
        } catch (err) {
            console.error('Error al obtener tareas:', err.message);
            throw err;
        }
    }

    static async createTask(description, status = 'Some day', priority = 'medium') {
        this.validateTask(description, status, priority);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ description, status,
                priority })
            });
            return await this.handleResponse(response);
        } catch (err) {
            console.error('Error al crear tarea:', err.message);
            throw err;
        }
    }

   static async updateTask(id, description, status, priority)
    {
        this.validateTask(description, status, priority);

        try {
          const response = await fetch(`${API_URL}?id=${id}`,
            {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'
                },
                body: JSON.stringify({ description, status,priority })
            });
            return await this.handleResponse(response);
            } catch (err) {
            console.error(`Error al actualizar tarea ${id}:`, err.message);
            throw err;
        }
    }

    static async patchTask(id, fields) {
        try {
          const response = await fetch(`${API_URL}?id=${id}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(fields)
            });
            return await this.handleResponse(response);
        } catch (err) {
            console.error(`Error al actualizar parcialmente tarea ${id}:`, err.message);
            throw err;
        }
    }

    static async deleteTask(id) {
        try {
          const response = await fetch(`${API_URL}?id=${id}`,
            {
                method: 'DELETE'
            });
            return await this.handleResponse(response);
        } catch (err) {
            console.error(`Error al eliminar tarea ${id}:`, err.message);
            throw err;
        }
    }
}

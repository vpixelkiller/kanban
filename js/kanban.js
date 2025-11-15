import { TaskAPI } from "./api.js";
import { DragDrop } from "./drag-drop.js";

const STATUS_COLUMNS = [
  { value: "Some day", label: "Some day" },
  { value: "This week", label: "This week" },
  { value: "Tomorrow", label: "Tomorrow" },
  { value: "Today", label: "Today" },
  { value: "In progress", label: "In progress" },
  { value: "Done", label: "Done" },
  { value: "deleted", label: "Deleted" },
];

export class KanbanBoard {
  constructor() {
    this.tasks = [];
    this.dragDrop = new DragDrop(this.handleDrop.bind(this));
    this.elements = {
      loading: document.getElementById("loading"),
      error: document.getElementById("error"),
      board: document.getElementById("kanbanBoard"),
      form: {
        description: document.getElementById("newDescription"),
        status: document.getElementById("newStatus"),
        priority: document.getElementById("newPriority"),
        createBtn: document.getElementById("createTaskBtn"),
      },
    };
    this.bindCreateForm();
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
    this.elements.loading.style.display = state ? "block" : "none";
  }

  showError(message) {
    this.elements.error.textContent = message;
    this.elements.error.style.display = "block";
    this.setLoading(false);
  }

  hideError() {
    this.elements.error.style.display = "none";
  }

  render() {
    this.hideError();
    this.renderBoard();
  }

  renderBoard() {
    this.elements.board.innerHTML = "";
    STATUS_COLUMNS.forEach((column) => {
      const columnEl = document.createElement("div");
      columnEl.className = "kanban-column column";
      columnEl.dataset.status = column.value;
      columnEl.innerHTML = `<h3>${column.label}</h3>`;
      const wrapper = document.createElement("div");
      wrapper.className = "column";
      wrapper.dataset.status = column.value;
      this.tasks
        .filter((task) => task.status === column.value)
        .forEach((task) => wrapper.appendChild(this.createCard(task)));
      columnEl.appendChild(wrapper);
      this.elements.board.appendChild(columnEl);
    });
    this.dragDrop.bind(this.elements.board);
  }

  createCard(task) {
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = task.id;
    card.innerHTML = `
      <div class="card-text">${task.description}</div>
      <div class="card-meta">
        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        <button class="btn-card-delete" type="button">🗑️</button>
      </div>
    `;
    const deleteBtn = card.querySelector(".btn-card-delete");
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (confirm("¿Eliminar esta tarea?")) {
        this.deleteTask(task.id);
      }
    });
    return card;
  }

  async createTask(description, status, priority) {
    if (!description) {
      alert("La descripción es obligatoria");
      return;
    }
    try {
      await TaskAPI.createTask(description, status, priority);
      this.resetForm();
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

  bindCreateForm() {
    const { description, status, priority, createBtn } = this.elements.form;
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        const desc = description.value.trim();
        this.createTask(desc, status.value, priority.value);
      });
    }
  }

  resetForm() {
    const { description, status, priority } = this.elements.form;
    description.value = "";
    status.value = "Some day";
    priority.value = "medium";
  }
}

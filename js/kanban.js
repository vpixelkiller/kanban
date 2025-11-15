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
      modal: {
        overlay: document.getElementById("taskModal"),
        description: document.getElementById("modalDescription"),
        status: document.getElementById("modalStatus"),
        priority: document.getElementById("modalPriority"),
        createBtn: document.getElementById("modalCreateBtn"),
        cancelBtn: document.getElementById("modalCancelBtn"),
        closeBtn: document.getElementById("modalCloseBtn"),
      },
    };
    this.tooltip = this.createTooltip();
    this.bindModal();
  }

  async init() {
    await this.refresh();
  }

  async refresh() {
    this.setLoading(true);
    try {
      const tasks = await TaskAPI.getTasks();
      this.tasks = tasks.map((task) => ({
        ...task,
        description: this.normalizeText(task.description),
      }));
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

      const header = document.createElement("h3");
      header.textContent = column.label;

      if (column.value === "Some day") {
        const addBtn = document.createElement("button");
        addBtn.className = "add-card-btn";
        addBtn.type = "button";
        addBtn.textContent = "+ Add";
        addBtn.addEventListener("click", () => this.openModal("Some day"));
        header.appendChild(addBtn);
      }

      columnEl.appendChild(header);
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
    card.addEventListener("dblclick", () => this.openModal(task.status, task));
    card.innerHTML = `
      <div class="card-text" data-full-text="${task.description}">${task.description}</div>
      <div class="card-meta">
        <button class="priority-badge priority-${task.priority}" type="button" data-priority="${task.priority}">${task.priority}</button>
        <button class="btn-card-delete" type="button">Eliminar</button>
      </div>
    `;
    const textBlock = card.querySelector(".card-text");
    textBlock.addEventListener("mouseenter", (event) =>
      this.showTooltip(task.description, event, textBlock)
    );
    textBlock.addEventListener("mousemove", (event) => this.positionTooltip(event));
    textBlock.addEventListener("mouseleave", () => this.hideTooltip());
    const priorityBtn = card.querySelector(".priority-badge");
    priorityBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      this.cyclePriority(task);
    });
    const deleteBtn = card.querySelector(".btn-card-delete");
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (confirm("Vas a eliminar la tarjeta de forma definitiva. ¿Continuar?")) {
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

  async updateTask(id, description, status, priority) {
    if (!description) {
      alert("La descripción es obligatoria");
      return;
    }
    try {
      await TaskAPI.updateTask(id, description, status, priority);
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

  bindModal() {
    const { overlay, createBtn, cancelBtn, closeBtn } = this.elements.modal;
    this.modalMode = "create";
    this.editingTaskId = null;
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        const { description, status, priority } = this.elements.modal;
        const desc = description.value.trim();
        if (this.modalMode === "edit" && this.editingTaskId) {
          this.updateTask(this.editingTaskId, desc, status.value, priority.value);
        } else {
          this.createTask(desc, status.value, priority.value);
        }
      });
    }

    const closeHandler = () => this.closeModal();
    cancelBtn?.addEventListener("click", closeHandler);
    closeBtn?.addEventListener("click", closeHandler);
    overlay?.addEventListener("click", (event) => {
      if (event.target === overlay) {
        this.closeModal();
      }
    });
  }

  openModal(defaultStatus = "Some day", task = null) {
    const { overlay, description, status, priority, createBtn } = this.elements.modal;
    if (!overlay) return;
    if (task) {
      this.modalMode = "edit";
      this.editingTaskId = task.id;
      description.value = task.description;
      status.value = task.status;
      priority.value = task.priority;
      createBtn.textContent = "Actualizar";
    } else {
      this.modalMode = "create";
      this.editingTaskId = null;
      description.value = "";
      status.value = defaultStatus;
      priority.value = "medium";
      createBtn.textContent = "Crear tarea";
    }
    overlay.style.display = "flex";
    description.focus();
  }

  closeModal() {
    const { overlay } = this.elements.modal;
    if (overlay) {
      overlay.style.display = "none";
    }
  }

  resetForm() {
    const { description, status, priority } = this.elements.modal;
    description.value = "";
    status.value = "Some day";
    priority.value = "medium";
    this.closeModal();
  }

  normalizeText(value) {
    if (!value || typeof value !== "string") {
      return value;
    }
    if (!/[ÃÂÊÕÕñäëïöüøÆæœ]/.test(value)) {
      return value;
    }
    try {
      const decoder = new TextDecoder("utf-8");
      const bytes = new Uint8Array([...value].map((char) => char.charCodeAt(0)));
      const decoded = decoder.decode(bytes);
      return decoded.includes("�") ? value : decoded;
    } catch {
      try {
        return decodeURIComponent(escape(value));
      } catch {
        return value;
      }
    }
  }

  createTooltip() {
    const tooltip = document.createElement("div");
    tooltip.className = "card-tooltip";
    document.body.appendChild(tooltip);
    return tooltip;
  }

  showTooltip(text, event, target) {
    if (!text || !this.tooltip || !target) return;
    if (!this.isTextTruncated(target)) {
      this.hideTooltip();
      return;
    }
    this.tooltip.textContent = text;
    this.tooltip.style.display = "block";
    this.positionTooltip(event);
  }

  positionTooltip(event) {
    if (!this.tooltip || this.tooltip.style.display === "none") {
      return;
    }
    const offset = 16;
    const { clientX, clientY } = event;
    this.tooltip.style.left = `${clientX + offset}px`;
    this.tooltip.style.top = `${clientY + offset}px`;
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = "none";
    }
  }

  isTextTruncated(element) {
    if (!element) {
      return false;
    }
    return element.scrollHeight - 1 > element.clientHeight;
  }

  async cyclePriority(task) {
    const order = ["low", "medium", "high", "top"];
    const currentIndex = order.indexOf(task.priority);
    const nextPriority = order[(currentIndex + 1) % order.length];
    try {
      await TaskAPI.patchTask(task.id, { priority: nextPriority });
      await this.refresh();
    } catch (error) {
      alert(error.message);
    }
  }
}

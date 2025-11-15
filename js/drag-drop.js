export class DragDrop {
    constructor(onDrop) {
        this.onDrop = onDrop;
    }

    bind(container) {
        const cards = container.querySelectorAll('.task-card');
        cards.forEach(card => {
            card.addEventListener('dragstart', e => this.handleDragStart(e, card));
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        });

        const columns = container.querySelectorAll('[data-status]');
        columns.forEach(column => {
            column.addEventListener('dragover', e => this.handleDragOver(e, column));
            column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
            column.addEventListener('drop', e => this.handleDropEvent(e, column));
        });
    }

    handleDragStart(event, card) {
        event.dataTransfer.setData('text/plain', card.dataset.id);
        card.classList.add('dragging');
    }

    handleDragOver(event, column) {
        event.preventDefault();
        column.classList.add('drag-over');
    }

    handleDropEvent(event, column) {
        event.preventDefault();
        column.classList.remove('drag-over');
        const taskId = Number(event.dataTransfer.getData('text/plain'));
        if (Number.isNaN(taskId)) {
            return;
        }
        this.onDrop(taskId, column.dataset.status);
    }
}


export class DragDrop {
    constructor(onDrop) {
        this.onDrop = onDrop;
        this.activeTouch = null;
    }

    bind(container) {
        const cards = container.querySelectorAll('.task-card');
        cards.forEach(card => {
            card.addEventListener('dragstart', e => this.handleDragStart(e, card));
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            card.addEventListener('pointerdown', e => this.handlePointerDown(e, card));
        });

        const columns = container.querySelectorAll('[data-status]');
        columns.forEach(column => {
            column.addEventListener('dragover', e => this.handleDragOver(e, column));
            column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
            column.addEventListener('drop', e => this.handleDropEvent(e, column));
        });
    }

    handleDragStart(event, card) {
        if (!event.dataTransfer) return;
        event.dataTransfer.setData('text/plain', card.dataset.id);
        event.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
    }

    handleDragOver(event, column) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        column.classList.add('drag-over');
    }

    handleDropEvent(event, column) {
        event.preventDefault();
        column.classList.remove('drag-over');
        if (!event.dataTransfer) return;
        const taskId = Number(event.dataTransfer.getData('text/plain'));
        if (Number.isNaN(taskId)) {
            return;
        }
        this.onDrop(taskId, column.dataset.status);
    }

    handlePointerDown(event, card) {
        if (event.pointerType === 'mouse') return;
        event.preventDefault();
        card.setPointerCapture?.(event.pointerId);
        card.classList.add('dragging');
        const move = e => {
            const column = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-status]');
            if (this.activeTouch?.column && this.activeTouch.column !== column) {
                this.activeTouch.column.classList.remove('drag-over');
            }
            if (column) {
                column.classList.add('drag-over');
            }
            this.activeTouch.column = column;
        };
        const up = e => {
            card.releasePointerCapture?.(e.pointerId);
            card.classList.remove('dragging');
            if (this.activeTouch?.column) {
                this.activeTouch.column.classList.remove('drag-over');
                const taskId = Number(card.dataset.id);
                if (!Number.isNaN(taskId)) {
                    this.onDrop(taskId, this.activeTouch.column.dataset.status);
                }
            }
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            this.activeTouch = null;
        };
        this.activeTouch = { card, column: null };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, { once: true });
    }
}


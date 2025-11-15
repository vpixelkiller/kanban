import { jest } from '@jest/globals';
import { DragDrop } from '../js/drag-drop.js';

function createDataTransfer() {
  const store = {};
  return {
    setData: (key, value) => {
      store[key] = value;
    },
    getData: (key) => store[key],
    effectAllowed: 'move',
    dropEffect: 'move',
  };
}

describe('DragDrop integration', () => {
  let container;
  let onDrop;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="board">
        <div class="kanban-column">
          <div class="column" data-status="Today">
            <div class="task-card" data-id="1">A</div>
          </div>
        </div>
        <div class="kanban-column">
          <div class="column" data-status="Done"></div>
        </div>
      </div>
    `;
    container = document.getElementById('board');
    onDrop = jest.fn();
  });

  test('calls onDrop after mouse drag and drop', () => {
    const dragDrop = new DragDrop(onDrop);
    dragDrop.bind(container);

    const card = container.querySelector('.task-card');
    const targetColumn = container.querySelectorAll('.column')[1];

    const dragStartEvent = new Event('dragstart', { bubbles: true, cancelable: true });
    dragStartEvent.dataTransfer = createDataTransfer();
    card.dispatchEvent(dragStartEvent);

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    dropEvent.dataTransfer = dragStartEvent.dataTransfer;
    targetColumn.dispatchEvent(dropEvent);

    expect(onDrop).toHaveBeenCalledWith(1, 'Done');
  });
});


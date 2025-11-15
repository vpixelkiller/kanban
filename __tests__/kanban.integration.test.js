import { jest } from '@jest/globals';
import { KanbanBoard } from '../js/kanban.js';
import { TaskAPI } from '../js/api.js';
import { DragDrop } from '../js/drag-drop.js';

function mountBaseDom() {
  document.body.innerHTML = `
    <div>
      <div id="loading"></div>
      <div id="error" style="display:none"></div>
      <div class="new-task-panel">
        <textarea id="newDescription"></textarea>
        <select id="newStatus">
          <option value="Some day">Some day</option>
          <option value="Today">Today</option>
        </select>
        <select id="newPriority">
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button id="createTaskBtn">Create</button>
      </div>
      <div class="board-wrapper">
        <div class="kanban-board" id="kanbanBoard"></div>
      </div>
    </div>
  `;
}

describe('KanbanBoard integration', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mountBaseDom();
    jest.spyOn(DragDrop.prototype, 'bind').mockImplementation(() => {});
  });

  test('renders cards received from TaskAPI', async () => {
    jest.spyOn(TaskAPI, 'getTasks').mockResolvedValue([
      { id: 1, description: 'Card 1', status: 'Today', priority: 'high' },
      { id: 2, description: 'Card 2', status: 'Some day', priority: 'medium' },
    ]);

    const board = new KanbanBoard();
    await board.init();

    expect(TaskAPI.getTasks).toHaveBeenCalled();
    expect(document.querySelectorAll('.task-card').length).toBe(2);
  });

  test('create button uses TaskAPI and clears form', async () => {
    jest.spyOn(TaskAPI, 'getTasks').mockResolvedValue([]);
    jest.spyOn(TaskAPI, 'createTask').mockResolvedValue({ id: 3 });
    const board = new KanbanBoard();
    await board.init();

    const description = document.getElementById('newDescription');
    const status = document.getElementById('newStatus');
    const priority = document.getElementById('newPriority');
    description.value = 'New task';
    status.value = 'Today';
    priority.value = 'high';

    document.getElementById('createTaskBtn').click();

    expect(TaskAPI.createTask).toHaveBeenCalledWith('New task', 'Today', 'high');
  });

  test('handleDrop calls TaskAPI.patchTask', async () => {
    jest.spyOn(TaskAPI, 'getTasks').mockResolvedValue([]);
    const board = new KanbanBoard();
    await board.init();

    jest.spyOn(TaskAPI, 'patchTask').mockResolvedValue({ id: 1, status: 'Done' });
    await board.handleDrop(1, 'Done');

    expect(TaskAPI.patchTask).toHaveBeenCalledWith(1, { status: 'Done' });
  });
});


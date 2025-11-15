import { jest } from "@jest/globals";
import { KanbanBoard } from "../js/kanban.js";
import { TaskAPI } from "../js/api.js";
import { DragDrop } from "../js/drag-drop.js";

function mountBaseDom() {
  document.body.innerHTML = `
    <div>
      <div id="loading"></div>
      <div id="error" style="display:none"></div>
      <div class="board-wrapper">
        <div class="kanban-board" id="kanbanBoard"></div>
      </div>
    </div>
    <div id="taskModal" class="modal-overlay">
      <div class="modal-card">
        <textarea id="modalDescription"></textarea>
        <select id="modalStatus">
          <option value="Some day">Some day</option>
          <option value="Today">Today</option>
        </select>
        <select id="modalPriority">
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button id="modalCloseBtn" type="button"></button>
        <button id="modalCancelBtn" type="button"></button>
        <button id="modalCreateBtn" type="button">Create</button>
      </div>
    </div>
  `;
  document.getElementById("taskModal").style.display = "none";
}

describe("KanbanBoard integration", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mountBaseDom();
    jest.spyOn(DragDrop.prototype, "bind").mockImplementation(() => {});
  });

  test("renders cards received from TaskAPI", async () => {
    jest.spyOn(TaskAPI, "getTasks").mockResolvedValue([
      { id: 1, description: "Card 1", status: "Today", priority: "high" },
      { id: 2, description: "Card 2", status: "Some day", priority: "medium" },
    ]);

    const board = new KanbanBoard();
    await board.init();

    expect(TaskAPI.getTasks).toHaveBeenCalled();
    expect(document.querySelectorAll(".task-card").length).toBe(2);
  });

  test("create button uses TaskAPI and clears form", async () => {
    jest.spyOn(TaskAPI, "getTasks").mockResolvedValue([]);
    jest.spyOn(TaskAPI, "createTask").mockResolvedValue({ id: 3 });
    const board = new KanbanBoard();
    await board.init();

    board.openModal("Some day");
    const description = document.getElementById("modalDescription");
    const status = document.getElementById("modalStatus");
    const priority = document.getElementById("modalPriority");
    description.value = "New task";
    status.value = "Today";
    priority.value = "high";

    document.getElementById("modalCreateBtn").click();

    expect(TaskAPI.createTask).toHaveBeenCalledWith("New task", "Today", "high");
  });

  test("handleDrop calls TaskAPI.patchTask", async () => {
    jest.spyOn(TaskAPI, "getTasks").mockResolvedValue([]);
    const board = new KanbanBoard();
    await board.init();

    jest.spyOn(TaskAPI, "patchTask").mockResolvedValue({ id: 1, status: "Done" });
    await board.handleDrop(1, "Done");

    expect(TaskAPI.patchTask).toHaveBeenCalledWith(1, { status: "Done" });
  });
});

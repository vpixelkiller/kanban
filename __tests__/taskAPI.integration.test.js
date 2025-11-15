import { jest } from "@jest/globals";
import { TaskAPI } from "../js/api.js";

describe("TaskAPI integration tests", () => {
  beforeEach(() => {
    global.fetch.mockReset();
  });

  function mockResponse(data, ok = true, status = 200) {
    global.fetch.mockResolvedValue({
      ok,
      status,
      text: () => Promise.resolve(JSON.stringify(data)),
    });
  }

  test("getTasks makes a GET request and returns JSON", async () => {
    const sample = [{ id: 1, description: "Test item", status: "Today", priority: "high" }];
    mockResponse(sample);

    const result = await TaskAPI.getTasks();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe("http://localhost:8080/tasks.php");
    expect(result).toEqual(sample);
  });

  test("createTask sends POST with correct body", async () => {
    const payload = { description: "New task", status: "Some day", priority: "medium" };
    mockResponse({ id: 99, ...payload }, true, 201);

    const result = await TaskAPI.createTask(payload.description, payload.status, payload.priority);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:8080/tasks.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(result.id).toBe(99);
  });

  test("patchTask throws backend HTTP errors", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({ error: "Server error" })),
    });

    await expect(TaskAPI.patchTask(1, { status: "Done" })).rejects.toThrow("Server error");
  });
});

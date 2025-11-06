// test_api_client.js
import {TaskAPI} from "./tasks.js"; // Ajusta la ruta correcta si es necesario




console.log("Testeando API REST con cliente JavaScript");
console.log("=".repeat(50));

async function show(title, fn) {
  console.log(`\n ${title}`);
  console.log("-".repeat(50));
  try {
    const result = await fn();
    console.log("[OK] Respuesta:");
    console.log(result);
  } catch (err) {
    console.log("[KO] Error:");
    console.log(err.message);
  }
}

(async () => {
  let taskId = null;

  await show("1️ GET - Obtener todas las tareas", () => TaskAPI.getTasks());

  await show("2️ POST - Crear nueva tarea", async () => {
    const task = await TaskAPI.createTask("Tarea JS Test", "Today", "high");
    taskId = task.id;
    return task;
  });

  await show("3️ GET - Verificar tareas después de crear", () =>
    TaskAPI.getTasks()
  );

  await show("4️ PATCH - Cambiar estado a 'In progress'", () =>
    TaskAPI.patchTask(taskId, { status: "In progress" })
  );

  await show("5️ PUT - Actualizar tarea completa", () =>
    TaskAPI.updateTask(taskId, "Actualizada por JS", "Done", "medium")
  );

  await show("6️ DELETE - Eliminar tarea", () => TaskAPI.deleteTask(taskId));

  await show("7️ GET - Verificar tareas después de eliminar", () =>
    TaskAPI.getTasks()
  );

  console.log("\n 8️ CASOS DE ERROR");
  console.log("=".repeat(50));

  await show("[KO] POST sin descripción", () =>
    TaskAPI.createTask("", "To do", "low")
  );

  await show("[KO] PUT sin ID", () =>
    TaskAPI.updateTask(undefined, "Test", "Done", "low")
  );

  await show("[KO] DELETE con ID inexistente", () => TaskAPI.deleteTask(99999));

  console.log("\n[OK] Test completado!");
})();

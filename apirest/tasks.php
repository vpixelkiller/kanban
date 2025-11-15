<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query('SELECT * FROM tasks ORDER BY created_at DESC');
            echo json_encode($stmt->fetchAll());
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al obtener las tareas']);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['description'])) {
            http_response_code(400);
            echo json_encode(['error' => 'La descripción es obligatoria']);
            exit;
        }
        $status = $data['status'] ?? 'Some day';
        $priority = $data['priority'] ?? 'medium';

        try {
            $stmt = $pdo->prepare("INSERT INTO tasks (description, status, priority) VALUES (:description, :status, :priority)");
            $stmt->execute([
                ':description' => $data['description'],
                ':status' => $status,
                ':priority' => $priority
            ]);

            $newId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$newId]);
            $task = $stmt->fetch();

            http_response_code(201);
            echo json_encode($task);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear la tarea']);
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de tarea requerido']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $stmt = $pdo->prepare("UPDATE tasks SET description = :description, status = :status, priority = :priority WHERE id = :id");
            $stmt->execute([
                ':description' => $data['description'] ?? '',
                ':status' => $data['status'] ?? 'Some day',
                ':priority' => $data['priority'] ?? 'medium',
                ':id' => $id
            ]);

            $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            $task = $stmt->fetch();

            if ($task) {
                echo json_encode($task);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Tarea no encontrada']);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al actualizar la tarea']);
        }
        break;

    case 'PATCH':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de tarea requerido']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);

        $fields = [];
        $params = [':id' => $id];

        if (isset($data['status'])) {
            $fields[] = "status = :status";
            $params[':status'] = $data['status'];
        }
        if (isset($data['description'])) {
            $fields[] = "description = :description";
            $params[':description'] = $data['description'];
        }
        if (isset($data['priority'])) {
            $fields[] = "priority = :priority";
            $params[':priority'] = $data['priority'];
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No hay campos para actualizar']);
            exit;
        }

        try {
            $sql = "UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            $task = $stmt->fetch();

            if ($task) {
                echo json_encode($task);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Tarea no encontrada']);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al actualizar la tarea']);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de tarea requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            $task = $stmt->fetch();

            if (!$task) {
                http_response_code(404);
                echo json_encode(['error' => 'Tarea no encontrada']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode([
                'message' => 'Tarea eliminada correctamente',
                'deleted_task' => $task
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar la tarea']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}


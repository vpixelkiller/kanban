# Kanban Board

Tablero Kanban

## Arquitectura

```
/kanban
  /apirest
    db.php
    tasks.php
  /css
    responsive.css
    styles.css
  /js
    api.js
    app.js
    drag-drop.js
    kanban.js
  /sql
    database.sql
  db.php
  index.html
  kanban_setup.sql
  task-manager-table.html
  tasks.js
  tasks.php
  docker-compose.yml
  Dockerfile
```

## Requisitos

- Docker Desktop o engine compatible con Compose v2, no es imprescindible pero permite trabajar en cualquier entorno de esearrollo.
- Node.js ≥ 18 solo si quieres ejecutar `test_api_client.js`.
- Navegador moderno para consumir `index.html` desde tu entorno local.

## Puesta en marcha con Docker

1. Levanta los servicios:
   ```bash
   docker compose up --build -d
   ```
   - Backend PHP: http://localhost:8080/tasks.php
   - MySQL: puerto 3306 con credenciales `kanban / kanbanpass` y base `kanban_board`. Para entrar en mysql:
     ```bash
         docker exec -it kanban-mysql mysql -u kanban -pkanbanpass kanban_board
     ```
2. Sirve `index.html` con un servidor estático local (por ejemplo `npx serve .`) para evitar restricciones `file://`.
3. Detén y elimina contenedores cuando termines:
   ```bash
   docker compose down
   ```

## Flujo recomendado con Docker

1. `docker compose up --build -d`
2. Abre `index.html` en tu navegador preferido.

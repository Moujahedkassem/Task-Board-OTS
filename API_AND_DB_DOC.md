# API Documentation

## tRPC Routes

### auth
- **register**  
  **Input:** `{ email: string, name: string, password: string }`  
  **Output:** `{ success: boolean, user: { id, email, name }, token }`  
  **Description:** Register a new user. Returns user info and JWT token.

- **login**  
  **Input:** `{ email: string, password: string }`  
  **Output:** `{ success: boolean, user: { id, email, name }, token }`  
  **Description:** Log in a user. Returns user info and JWT token.

- **requestPasswordReset**  
  **Input:** `{ email: string }`  
  **Output:** `{ success: boolean }`  
  **Description:** Sends a password reset code to the user’s email.

- **resetPassword**  
  **Input:** `{ code: string, newPassword: string }`  
  **Output:** `{ success: boolean }`  
  **Description:** Resets the user’s password using a code.

---

### task
- **getAll**  
  **Input:** `{ search?: string, assigneeId?: string, from?: string, to?: string }`  
  **Output:** `Task[]`  
  **Description:** Get all tasks, optionally filtered by search, assignee, or date.

- **getById**  
  **Input:** `id: string`  
  **Output:** `Task | null`  
  **Description:** Get a single task by ID.

- **create**  
  **Input:** `{ title: string, description: string, status: TaskStatus, assigneeId?: string }`  
  **Output:** `Task`  
  **Description:** Create a new task.

- **update**  
  **Input:** `{ id: string, title: string, description: string, status: TaskStatus, assigneeId?: string }`  
  **Output:** `Task`  
  **Description:** Update an existing task.

- **delete**  
  **Input:** `id: string`  
  **Output:** `Task`  
  **Description:** Delete a task by ID.

---

### user
- **getAll**  
  **Input:** _none_  
  **Output:** `User[]`  
  **Description:** Get all users.

---

# Custom Commands for Claude Code or Cursor

Custom commands in Claude Code or Cursor are special instructions or scripts that automate, streamline, or enhance your development workflow. They can be used to:

- Run scripts or code generation tools (like Prisma, tRPC, or database migrations)
- Automate repetitive tasks (e.g., formatting, linting, testing)
- Interact with your codebase using AI-powered suggestions or refactoring

## Examples in This Project

**1. Prisma Commands**
- `npx prisma generate`  
  Regenerates the Prisma client after schema changes. Used in Dockerfile and during development.
- `npx prisma migrate dev`  
  Applies new migrations to your local database.
- `npx prisma migrate deploy`  
  Applies migrations in production or Docker environments.

**2. tRPC Code/Type Generation**
- No explicit codegen needed, but you can use AI tools to refactor or document your tRPC routers and types.

**3. AI-Powered Refactoring (Cursor/Claude)**
- Use Cursor or Claude to:
  - Generate new API endpoints
  - Refactor React components
  - Write or update documentation
  - Generate markdown tables for API and DB docs
  - Quickly search, rename, or update types and interfaces across the codebase

**4. Custom Scripts in `package.json`**
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev"
}
```
_Then run with `npm run prisma:generate` etc._

## How to Use in Cursor or Claude

- **Cursor:**
  - Use the command palette (`Cmd+K` or `Ctrl+K`) to run scripts, refactor code, or ask for code explanations.
  - Use AI chat to generate, refactor, or document code.
- **Claude:**
  - Paste code or instructions and ask for refactoring, documentation, or code generation.
  - Use Claude’s markdown/code block formatting for clean output.

## Summary Table

| Command/Action                | Purpose                                      | Where Used                |
|-------------------------------|----------------------------------------------|---------------------------|
| `npx prisma generate`         | Generate Prisma client for correct platform  | Dockerfile, dev workflow  |
| `npx prisma migrate dev`      | Apply migrations locally                     | Dev workflow              |
| `npx prisma migrate deploy`   | Apply migrations in Docker/production        | Docker, prod workflow     |
| `npm run build`               | Build frontend (Vite + TypeScript)           | Dockerfile, dev workflow  |
| AI-powered refactor/docs      | Refactor, document, or generate code         | Cursor/Claude chat        |

---

# Database Schema

## User
| Field             | Type      | Attributes             | Description                    |
|-------------------|-----------|------------------------|--------------------------------|
| id                | String    | @id, @default(uuid())  | Primary key, UUID              |
| email             | String    | @unique                | User email (unique)            |
| name              | String    |                        | User's display name            |
| createdAt         | DateTime  | @default(now())        | Account creation timestamp     |
| password          | String    |                        | Hashed password                |
| resetToken        | String?   |                        | Password reset code (optional) |
| resetTokenExpiry  | DateTime? |                        | Reset code expiry (optional)   |
| tasks             | Task[]    | @relation("UserTasks") | Tasks assigned to user         |

## Task
| Field       | Type      | Attributes             | Description                        |
|-------------|-----------|------------------------|------------------------------------|
| id          | String    | @id, @default(uuid())  | Primary key, UUID                  |
| title       | String    |                        | Task title                         |
| description | String    |                        | Task description                   |
| status      | TaskStatus|                        | Task status (enum)                 |
| assigneeId  | String?   |                        | User ID of assignee (optional)     |
| createdAt   | DateTime  | @default(now())        | Task creation timestamp            |
| updatedAt   | DateTime  | @updatedAt             | Last update timestamp              |
| assignee    | User?     | @relation("UserTasks", fields: [assigneeId], references: [id]) | Assigned user (optional) |

## TaskStatus (enum)
- `TODO`
- `IN_PROGRESS`
- `DONE` 
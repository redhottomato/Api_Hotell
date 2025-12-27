# Todo API (Express.js + MySQL + Sequelize)

A RESTful API backend for a Todo management system built using **Express.js**, **Sequelize**, and **MySQL**.  
It includes **JWT authentication**, **status seeding**, and **Swagger API documentation**.  
All responses follow the **JSend** specification.

---

## Application Installation and Usage Instructions

### 1. Prerequisites
Make sure you have the following installed:
- Node.js (version 18 or newer)
- MySQL Server
- npm (comes with Node.js)

### 2. Create the Databases
Before starting, create one database called **mytodo** and one database **mytodo_test** for the testing part, in MySQL.

```sql
CREATE DATABASE mytodo
CREATE DATABASE mytodo_testing
```

### 3. Clone and Install
Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <project-folder>
npm install
```

### 4. Start the Application
Run the app in development mode:

```bash
npm start
```

When the app starts for the first time:
- It creates all required tables.
- It automatically seeds the **Statuses** table with:
  - Not Started  
  - Started  
  - Completed  
  - Deleted

You should see console messages similar to:
```
All models synced with the database.
Statuses have been seeded successfully.
```

---

## Environment Variables

Create a `.env` file in the root directory and add your configuration details:

```env
DB_NAME=mytodo
DB_NAME_TEST=mytodo_test
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_DIALECT=mysql
TOKEN_SECRET=mysecretkey
JWT_EXPIRES_IN=1h
NODE_ENV=development
PORT=3000
```

---

## Additional Libraries/Packages

The project uses the following npm packages:

| Package | Purpose |
|----------|----------|
| express | Web framework |
| sequelize | ORM for MySQL |
| mysql2 | MySQL driver |
| dotenv | Environment variable management |
| jsonwebtoken | JWT authentication |
| bcrypt | Password hashing |
| cors | Cross-origin resource sharing |
| cookie-parser | Parse cookies |
| jsend | Consistent JSON response format |
| morgan | HTTP request logger |
| swagger-ui-express | Swagger documentation UI |
| swagger-jsdoc | Swagger specification generator |
| jest | Testing framework |
| supertest | API testing integration with Jest |

---

## NodeJS Version Used

**v18.x** or newer is recommended.  
You can check your Node.js version by running:

```bash
node -v
```

---

## Running the Application

After setting up the `.env` file and installing dependencies:

```bash
npm start
```

This will:
- Connect to the MySQL database.
- Synchronize models.
- Seed default status values if none exist.

The app will be available at:
```
http://localhost:3000/
```

---

## API Documentation (Swagger)

Swagger UI is included and available at:

```
http://localhost:3000/doc
```

### How to Use:
1. Register a new user or log in via the **Users** section.
2. Copy the JWT token returned after login.
3. Click **Authorize** in Swagger and paste your token.
4. Use the protected endpoints for categories and todos.

---

## API Endpoints

All endpoints respond using **JSend** structure.

### Authentication (Public)
| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/users/signup` | Register a new user |
| POST | `/api/users/login` | Log in and get a JWT |

### Categories (Protected)
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/categories` | Get all categories for the authenticated user |
| POST | `/api/categories` | Create a new category |
| PUT | `/api/categories/:id` | Update a category |
| DELETE | `/api/categories/:id` | Delete a category (fails if linked to todos) |

### Todos (Protected)
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/todos` | Get all todos for the authenticated user |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Soft delete (status set to Deleted) |

---

## Testing

Tests are implemented using **Jest** and **Supertest**.

Run all tests:
```bash
npm test
```

### Tests include:
- Logging in with valid credentials
- Creating, updating, and deleting todos
- Unauthorized and invalid token access
- Category deletion protection

Expected result:
```
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

---

## Project Structure

```
├── config/
│   ├── db.js
│   ├── seedStatuses.js
│   └── swagger.js
├── middleware/
│   └── middleware.js
├── models/
│   ├── Category.js
│   ├── Status.js
│   ├── Todo.js
│   ├── User.js
│   └── index.js
├── routes/
│   ├── categories.js
│   ├── todos.js
│   └── users.js
├── tests/
│   └── api.test.js
├── app.js
├── package.json
└── .env
```

---

## Notes

- A category cannot be deleted if it’s linked to any active (non-deleted) todos.
- All passwords are securely hashed before storage.
- JWT tokens must be included in the `Authorization` header:
  ```
  Authorization: Bearer <your_token>
  ```
- Database syncing uses `alter: true` to auto-update schema.
- Tests reset and clean the database each run.
- `NODE_ENV` should be set to **development** in the `.env` file during local development  
to ensure initial data (e.g., Statuses) is automatically seeded. 

---

## License

This project was forged in the dim glow of an IDE at ungodly hours, stitched together with code and caffeine. It lives... for educational purposes only.

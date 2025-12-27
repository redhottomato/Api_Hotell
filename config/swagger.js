const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
        title: "Todo API Documentation",
        version: "1.0.0",
        description: `

            ### How to use this API
            
            
            1. **POST /users/signup** – create your user account.  
            2. **POST /users/login** – get your JWT token.  
            3. Click **Authorize** and paste Bearer <token> .  
            4. **POST /category** – create a category (e.g. "Work").  
            5. **POST /todos** – create a todo and use the category's id.  
            6. **DELETE /todos/{id}** – soft-delete a todo.  
            7. **DELETE /category/{id}** – remove category (only if todos are deleted).

            ---
            All protected routes require Authorization: Bearer <token>
            
            `,
        },
        servers: [
        {
            url: "http://localhost:3000",
            description: "Local development server",
        },
        ],
        components: {
        securitySchemes: {
            bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            },
        },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        "./routes/users.js",
        "./routes/category.js",
        "./routes/todos.js"
        
    ], // Set the paths to get a correct swagger documentation
};

const specs = swaggerJsdoc(options);

module.exports = specs;

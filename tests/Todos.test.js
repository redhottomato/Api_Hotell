process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../models');
const crypto = require('crypto');

// Silence expected JWT errors during tests
jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (args[0]?.message?.includes('jwt malformed') || args[0]?.toString().includes('JsonWebTokenError')) {
        return; // Skip expected JWT malformed errors
    }
    // Pass through all other errors
    process.stderr.write(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ') + '\n');
});

let token;
let testUser;
let createdCategoryId;
let createdTodoId;

// Create a Setup and Teardown for tests

beforeAll(async () => {
    // Recreate tables fresh for test DB
    await db.sequelize.sync({ alter: true });

    // ✅ Seed the Statuses table
    await db.Status.bulkCreate([
        { name: 'Not Started' },
        { name: 'Started' },
        { name: 'Completed' },
        { name: 'Deleted' },
    ]);
    console.log('Statuses seeded for testing.');

    // Create a test user
    const bcrypt = require('bcrypt');
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    testUser = await db.User.create({
        name: 'Kurt Konrad',
        email: 'kurt@konrad.com',
        encryptedPassword: hashedPassword,
        salt: '',
    });

    console.log('Test user created (with bcrypt hash).');

    // Login to get JWT token
    const res = await request(app)
        .post('/users/login')
        .send({
            email: 'kurt@konrad.com',
            password: '123456',
        });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    token = res.body.data.token;
    console.log('Logged in and obtained token for testing.');
});


afterAll(async () => {
    // Clean up on test user
    await db.Todo.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: { email: 'kurt@konrad.com' } });
    
    await db.sequelize.close();
    console.log('And Thanos snaps his fingers... Test data cleaned up.');

});

// Category tests

describe('Category API tests', () => {
    // Create a new category
    it('should create a new category', async () => {
        const res = await request(app)
            .post('/category')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Homework',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('success');
        createdCategoryId = res.body.data.result.id;
    });

// Get all categories
    it('should get all categories for the authenticated user', async () => {
        const res = await request(app)
            .get('/category')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.data.result)).toBe(true);
    });

// Update a category
    it('should update the created category', async () => {
        const res = await request(app)
            .put(`/category/${createdCategoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Homework',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.result.name).toBe('Updated Homework');
    });

// Prevent deletion if category linked to todos
    it('should prevent deletion of category linked to todos', async () => {
        // First, create a todo linked to this category
        const todoRes = await request(app)
            .post('/todos')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Sample Todo',
                description: 'This is a sample todo item.',
                categoryId: createdCategoryId,
                statusId: 1,
            });

        expect(todoRes.statusCode).toBe(201);
        createdTodoId = todoRes.body.data.result.id;

        // Now, attempt to delete the category
        const res = await request(app)
            .delete(`/category/${createdCategoryId}`)
            .set('Authorization', `Bearer ${token}`);

            // Expect deletion to fail
        expect(res.statusCode).toBe(400);
        expect(res.body.status).toBe('fail');
    });

    // Delete the category after removing todos
    it('should delete the category after removing linked todos', async () => {
        // First, delete the linked todo
        await db.Todo.destroy({ where: { id: createdTodoId } });

        // Try deleting again
        const res = await request(app)
            .delete(`/category/${createdCategoryId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

// Attempt to get categories without authentication
    it('should fail to get categories without authentication', async () => {
        const res = await request(app)
            .get('/category');

        expect(res.statusCode).toBe(401);
        expect(res.body.status).toBe('fail');
    });
});

// Todo tests

describe('Todo API tests', () => {
        beforeAll(async () => {
        // Create a new category for todo tests
        const categoryRes = await request(app)
            .post('/category')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'TodoCategory' });

        expect(categoryRes.statusCode).toBe(201);
        global.todoCategoryId = categoryRes.body.data.result.id;
    });

    // Create a new todo
    it('should create a new todo', async () => {
        const res = await request(app)
            .post('/todos')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'New Todo',
                description: 'This is a new todo item.',
                categoryId: global.todoCategoryId,
                statusId: 1,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('success');
        createdTodoId = res.body.data.result.id;
    });

    // Update todo status
    it('should update the status of the created todo', async () => {
        const res = await request(app)
            .put(`/todos/${createdTodoId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Todo Item',
                description: 'This is an updated todo item.',
                categoryId: global.todoCategoryId,
                statusId: 2,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.result.name).toBe('Updated Todo Item');
    });

    // Get all todos
    it('should get all todos for the authenticated user', async () => {
        const res = await request(app)
            .get('/todos')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success'); 
    });

    // Delete (soft delete) the created todo
    it('should soft delete the created todo', async () => {
        const res = await request(app)
            .delete(`/todos/${createdTodoId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

    // Unathorized get attempt
    it('should fail to get todos without authentication', async () => {
        const res = await request(app)
            .get('/todos');

        expect(res.statusCode).toBe(401);
        expect(res.body.status).toBe('fail');
    });

    // Invalid token attempt
    it('should fail to get todos with invalid token', async () => {
        const res = await request(app)
            .get('/todos')
            .set('Authorization', `Bearer invalidtoken`);

        expect(res.statusCode).toBe(403);
        expect(res.body.status).toBe('fail');
    });
});
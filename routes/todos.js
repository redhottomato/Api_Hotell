const express = require('express');
const router = express.Router();
const { Op } = require('sequelize'); // Destructured, shorter name
const { Todo, Category, Status } = require('../models');
const isAuth = require('../middleware/middleware');


// Swagger tags definition
/**
 * @swagger
 * tags:
 *   name: 3. Todos
 *   description: Todo CRUD operations
 */

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: Get all todos for the authenticated user
 *     tags: [3. Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for todo name
 *     responses:
 *       200:
 *         description: List of todos
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /todos:
 *   post:
 *     summary: Create a new todo
 *     description: >
 *       Create a todo for the logged-in user.  
 *       Make sure to **create a Category first** under `POST category` and use its **id** here as `categoryId`.  
 *       Example: If you created a "Work" category and it has id 1, use that as `categoryId`.  
 *       You can also omit `categoryId` if you want the todo to be uncategorized.
 *     tags: [3. Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Buy groceries
 *               description:
 *                 type: string
 *                 example: Get milk, eggs, and bread
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               statusId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Todo created successfully
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /todos/{id}:
 *   put:
 *     summary: Update a todo
 *     description: >
 *       Update an existing todo.  
 *       You can change its category or status using valid IDs.  
 *       Use `GET category` and `GET todos` to find valid IDs.
 *     tags: [3. Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               statusId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Todo updated
 *       404:
 *         description: Todo not found
 */

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     summary: Soft-delete a todo (set status to Deleted)
 *     description: >
 *      Changes the todo’s status to “Deleted” instead of permanently removing it.  
 *      This keeps a record of the todo for reference or recovery.
 *     tags: [3. Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Todo marked as deleted
 *       404:
 *         description: Todo not found
 */


/* Getting all active todos, must be logged in, excluded "deleted" status */
router.get('/', isAuth, async (req, res) => {
	try {

		// Filter by category
		const categoryFilter = req.query.category ? { CategoryId: req.query.category } : {};

		// Sorting
		const sortField = req.query.sortBy || 'id'; // Default sort by id
		const sortOrder = req.query.order === 'desc' ? 'DESC' : 'ASC'; // Default ascending

		// Pagination
		const limit = parseInt(req.query.limit, 10) || 10;
		const page = parseInt(req.query.page, 10) || 1;
		const offset = (page - 1) * limit;

		const search = req.query.search
			? {
				[Op.or]: [
					{ name: { [Op.like]: `%${req.query.search}%` } },
					{ description: { [Op.like]: `%${req.query.search}%` } },
				],
			}
			: {};

		const { count, rows: todos } = await Todo.findAndCountAll({
			where: { 
				UserId: req.user.id, 
				...categoryFilter,
				...search,
			},
			include: [
				{ model: Category, attributes: ['id', 'name'] },
				{
					model: Status,
					attributes: ['id', 'name'],
					where: { name: { [Op.ne]: 'Deleted' } }, // Exclude "deleted" status
				},
			],
			order: [[sortField, sortOrder]],
			limit,
			offset,
		});

		return res.jsend.success({
			pagination: {
				totalItems: count,
				totalPages: Math.ceil(count / limit),
				currentPage: page,
				itemsPerPage: limit,
			},
			todos,
		});

	} catch (error) {
		console.error('Error fetching todos:', error);
		return res.status(500).jsend.error('Internal server error.');
	}
});

// Get all todos, including deleted
router.get('/all', isAuth, async (req, res) => {
	try {
		const todos = await Todo.findAll({
			where: { UserId: req.user.id },
			include: [
				{ model: Category, attributes: ['id', 'name'] },
				{ model: Status, attributes: ['id', 'name'] },
			],
		});

		return res.jsend.success({ todos });

	} catch (error) {
		console.error('Error fetching all todos:', error);
		return res.status(500).jsend.error('Internal server error.');
	}	
});

// Return all the todos with the deleted status
router.get('/deleted', isAuth, async (req, res) => {
	try {
		const deletedStatus = await Status.findOne({ where: { name: 'Deleted' } });
		if (!deletedStatus) {
			return res.status(404).jsend.fail('Deleted status not found.');
		}

		const todos = await Todo.findAll({
			where: {
				UserId: req.user.id,
				StatusId: deletedStatus.id,
			},
			include: [
				{ model: Category, attributes: ['id', 'name'] },
				{ model: Status, attributes: ['id', 'name'] },
			],
		});

		return res.jsend.success({ todos });

	} catch (error) {
		console.error('Error fetching deleted todos:', error);
		return res.status(500).jsend.error('Internal server error.');
	}
});

// Create a new todo for the logged in user
router.post('/', isAuth, async (req, res) => {
	try {
		const { name, description, categoryId } = req.body;

		if (!name) {
		return res.status(400).jsend.fail('Name is required.');
		}

		const status = await Status.findOne({ where: { name: 'Not Started' } });
		if (!status) {
		return res.status(404).jsend.fail('Default status not found.');
		}

		// Validate category only if provided
		if (categoryId) {
		const category = await Category.findOne({
			where: { id: categoryId, UserId: req.user.id },
		});
		if (!category) {
			return res.status(400).jsend.fail('Invalid category.');
		}
		}

		const todo = await Todo.create({
		name,
		description,
		UserId: req.user.id,
		CategoryId: categoryId || null,
		StatusId: status.id,
		});

		return res.status(201).jsend.success({ result: todo });
	} catch (error) {
		console.error('Error creating todo:', error);
		return res.status(500).jsend.error('Internal server error.');
	}
});



// Return all the statuses from the database
router.get('/statuses', async (req, res) => {
	try {
		const statuses = await Status.findAll({ attributes: ['id', 'name'] });
		res.jsend.success({ statuses });
	} catch (error) {
		console.error('Error fetching statuses:', error);
		res.status(500).jsend.error('Internal server error.');
	}
});

// Change/update a specific todo for logged in user
router.put('/:id', isAuth, async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, categoryId, statusId } = req.body;

		const todo = await Todo.findOne({ where: { id, UserId: req.user.id } });
		if (!todo) {
			return res.status(404).jsend.fail('Todo not found.');
		}

		await todo.update({ 
			name, 
			description, 
			CategoryId: categoryId, 
			StatusId: statusId
		});

		return res.jsend.success({ result: todo });

	} catch (error) {
		console.error('Error updating todo:', error);
		res.status(500).jsend.error('Internal server error.');
	}
});

// (Soft)Delete a specific todo if for the logged in user
router.delete('/:id', isAuth, async (req, res) => {
	try {
		const { id } = req.params;

		// Find the todo
		const todo = await Todo.findOne({ where: { id, UserId: req.user.id } });
			if (!todo) {
				return res.status(404).jsend.fail('Todo not found.');
			}
		
		// Find deleted status
		const deletedStatus = await Status.findOne({ where: { name: 'Deleted' } });
			if (!deletedStatus) {
				return res.status(500).jsend.error('Deleted status not found.');
			}

		// Update the todo's status to Deleted
		todo.StatusId = deletedStatus.id;
		await todo.save();

		// Confirm status update persisted
		const updated = await Todo.findByPk(todo.id, {
			include: [{ model: Status, attributes: ['name'] }],
		});
		
		return res.jsend.success({
			result: {
				id: updated.id,
				status: updated.Status?.name || 'Deleted',
			},
		});

	} catch (error) {
		console.error('Error deleting todo:', error);
		return res.status(500).jsend.error('Internal server error.');
	}
});


module.exports = router;


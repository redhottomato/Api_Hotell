const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Category, Todo, Status } = require("../models");
const authenticate = require("../middleware/middleware");

router.use(authenticate);

// Swagger tags definition

/**
 * @swagger
 * tags:
 *   name: 2. Category
 *   description: Manage todo categories
 */

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Get all categories for the logged-in user
 *     tags: [2. Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Create a new category
 *     description: >
 *       Create a category for organizing your todos.
 *       Make sure to enter a created category `id` when creating or updating todos.
 *     tags: [2. Category]
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
 *                 example: Work
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /category/{id}:
 *   put:
 *     summary: Update a category by ID
 *     tags: [2. Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: add Category ID
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
 *                 example: Homework
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
 */

/**
 * @swagger
 * /category/{id}:
 *   delete:
 *     summary: Delete a category (only if not linked to any todos)
 *     description: >
 *       Deletes a category only if it has no active todos linked to it.  
 *       Todos marked as "Deleted" do not block removal.
 *     tags: [2. Category]
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
 *         description: Category deleted
 *       400:
 *         description: Category linked to todos
 *       404:
 *         description: Category not found
 */



// List all categories for the authenticated user
router.get("/", async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { UserId: req.user.id },
        });

        return res.jsend.success({ result: categories });

    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).jsend.error("Failed to fetch categories.");
    }
});

// Create a new category
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).jsend.fail("Category name is required.");
        }

    // Check for existing category with the same name for the user
    const existing = await Category.findOne({
        where: { name, UserId: req.user.id },
    });

    if (existing) {
        return res.status(400).jsend.fail("Category with this name already exists.");
    }

        const category = await Category.create({
            name,
            UserId: req.user.id,
        });
        
        return res.status(201).jsend.success({ result: category });
        
    } catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).jsend.error("Failed to create category.");
    }
});

router.put("/:id", async (req, res) => {
    try {
        const category = await Category.findOne({
            where: { id: req.params.id, UserId: req.user.id },
        });

        if (!category) {
            return res.status(404).jsend.fail("Category not found.");
        }

        category.name = req.body.name || category.name;
        await category.save();

        return res.jsend.success({ result: category });

    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).jsend.error("Failed to update category.");
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findOne({
        where: { id, UserId: req.user.id },
        });
        if (!category) {
        return res.status(404).jsend.fail("Category not found.");
        }

        const deletedStatus = await Status.findOne({ where: { name: "Deleted" } });
        if (!deletedStatus) {
        return res.status(500).jsend.error("Deleted status not found.");
        }

        const todosUsingCategory = await Todo.count({
        where: {
            CategoryId: id,
            UserId: req.user.id,
            [Op.or]: [
            { StatusId: null },
            { StatusId: { [Op.ne]: deletedStatus.id } },
            ],
        },
        });

        if (todosUsingCategory > 0) {
        return res
            .status(400)
            .jsend.fail("Cannot delete category with active todos.");
        }

        await category.destroy();
        return res.jsend.success({ result: { id: category.id } });
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).jsend.error("Failed to delete category.");
    }
});




module.exports = router;
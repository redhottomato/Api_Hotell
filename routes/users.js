const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');


// Swagger tags definition

/**
 * @swagger
 * tags:
 *   name: 1. Users
 *   description: User signup and authentication
 */

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [1. Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alice
 *               email:
 *                 type: string
 *                 example: alice@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Validation or duplicate email error
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Authenticate user and return JWT
 *     tags: [1. Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: alice@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Successful login with JWT token
 *       401:
 *         description: Invalid credentials
 */


// POST /users/signup - Register a new user

router.post('/signup', async (req, res) => {
	try {
		const { name, email, password } = req.body;
		
		// First, validate input
		if (!name || !email || !password) {
			return res.status(400).jsend.fail('Name, email, and password are required.');
		}

		// Then, check if user already exists
		const existingUser = await User.findOne({ where: { email } });
		if (existingUser) {
			return res.status(409).jsend.fail('User already exists.');
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// If not, create a new user
		const newUser = await User.create({
			name,
			email,
			encryptedPassword: hashedPassword,
			salt: '', // Salt can be empty if using bcrypt
		});

		return res.status(201).jsend.success({
			message: 'User registered successfully.', 
			user: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
			},
		});
	} catch (error) {
		console.error('Error trying to signup:', error);
		return res.status(500).jsend.error('Internal server error.');
	}
});


// POST /users/login - Authenticate a user

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res.status(400).jsend.fail('Email and password are required.');
		}
		
		// Find user by email
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return res.status(401).jsend.fail('Invalid email or password.');
		}

		// Check Password - remember setting up bcrypt and isAuth middleware correctly
		const isMatch = await bcrypt.compare(password, user.encryptedPassword);
		if (!isMatch) {
			return res.status(401).jsend.fail('Invalid email or password.');
		}

		// Generate JWT Token
		const token = jwt.sign(
			{ id: user.id, email: user.email },
			process.env.TOKEN_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES || '1h' }
		);

		return res.status(200).jsend.success({
			message: 'Login successful.',
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.error('Error trying to login:', error);
		return res.status(500).jsend.error('Internal server error.');
	}
});

router.get('/fail', (req, res) => {
	return res.status(401).jsend.fail('Unauthorized access.');
});

module.exports = router;

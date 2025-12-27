require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jsend = require('jsend');
const db = require('./models');
const usersRouter = require('./routes/users');
const todosRouter = require('./routes/todos');
const categoryRouter = require('./routes/category');
const seedStatuses = require('./config/seedStatuses');
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");


// Sync database and seed statuses

if(process.env.NODE_ENV !== 'test') {
	db.sequelize
		.sync({ alter: true }) // or { force: true } for a clean rebuild (drops all tables)
		.then(async () => {
			console.log('All models synced with the database.');
			await seedStatuses(); // Now safe to seed statuses
		})
		.catch((err) => {
			console.error('Error syncing models:', err);
		});
	}
const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(jsend.middleware);

// Routes
app.get('/', (req, res) => {
	res.json({ message: 'Welcome to the Todo' });
});

app.use('/users', usersRouter);
app.use('/todos', todosRouter);
app.use('/category', categoryRouter);

// Swagger API documentation route
app.use("/doc",	swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: 'Not Found' });
});

module.exports = app;

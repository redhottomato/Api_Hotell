const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

// Pick the correct database name based on environment
const database = isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME;

const sequelize = new Sequelize(
    database,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: isTest ? false : console.log, // ✅ disable SQL logs in test
    }
    );

    async function testConnection() {
    try {
        await sequelize.authenticate();
        if (!isTest) {
        console.log('Connection has been established successfully.');
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

module.exports = sequelize;

const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

// Pick the correct database name based on environment
const database = isTest ? process.env.DB_NAME_TEST : process.env.DATABASE_NAME;

const sequelize = new Sequelize(
    database,
    process.env.ADMIN_USERNAME,
    process.env.ADMIN_PASSWORD,
    {
        host: process.env.HOST,
        dialect: process.env.DIALECT || 'mysql',
        port: Number(process.env.PORT || 3306),
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

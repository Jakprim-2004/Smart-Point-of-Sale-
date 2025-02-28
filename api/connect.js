const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'Smart POS',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '6540200349',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false,
        port: parseInt(process.env.DB_PORT || '5432')
    }
);

// Test the connection
sequelize.authenticate()
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Unable to connect to the database:', err));

module.exports = sequelize;




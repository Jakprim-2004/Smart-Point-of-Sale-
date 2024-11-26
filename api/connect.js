const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('yourDatabase', 'postgres', 'Yourpassword', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
    port: 5432
});

module.exports = sequelize;


// /config/database.js

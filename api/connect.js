const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('DDPOs', 'postgres', '6540200349', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
    port: 5432
});

module.exports = sequelize;


// /config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

<<<<<<< HEAD
const sequelize = new Sequelize(
    process.env.DB_NAME || 'DDPOs',
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
=======
const sequelize = new Sequelize('yourDatabase', 'postgres', 'Yourpassword', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
    port: 5432
});
>>>>>>> cec76331a6df2525abe51434a7eccc49b3a27224

module.exports = sequelize;


// /config/database.js

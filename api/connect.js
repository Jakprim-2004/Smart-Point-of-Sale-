const { Sequelize } = require('sequelize');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Create a connection using Neon serverless
const sql = neon(process.env.DATABASE_URL);

// Create Sequelize instance with Neon
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully with Neon.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

// Export both Sequelize instance and raw SQL function
module.exports = sequelize;
module.exports.sql = sql;

// Test connection when module is loaded
testConnection();
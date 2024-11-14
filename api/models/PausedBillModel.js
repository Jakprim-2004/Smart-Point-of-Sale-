const conn = require("../connect");
const { DataTypes } = require("sequelize");


const PausedBillModel = conn.define('PausedBill', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.BIGINT,
    
  },
  items: {
    type: DataTypes.TEXT,
   
  },
  status: {
    type: DataTypes.STRING,
   
  },
  
});

PausedBillModel.sync({alter: true});

module.exports = PausedBillModel;
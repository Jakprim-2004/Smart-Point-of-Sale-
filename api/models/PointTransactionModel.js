const conn = require('../connect');
const { DataTypes } = require('sequelize');

const PointTransactionModel = conn.define('PointTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    points: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    transactionType: {
        type: DataTypes.ENUM('REDEEM_REWARD', 'DISCOUNT'),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transactionDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

PointTransactionModel.sync({alter: true});

module.exports = PointTransactionModel;

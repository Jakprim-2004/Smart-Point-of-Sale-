const conn = require('../connect');
const { DataTypes } = require('sequelize');

const MemberModel = conn.define('member', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    packageId: {
        type: DataTypes.BIGINT
    },
    email: {
        type: DataTypes.STRING(255)
    },
    name: {
        type: DataTypes.STRING(255)
    },
    firstName: {
        type: DataTypes.STRING(255)
    },
    lastName: {
        type: DataTypes.STRING(255)
    },
    phone: {
        type: DataTypes.STRING(255)
    },
    pass: {
        type: DataTypes.STRING(255)
    },
    address: {
        type: DataTypes.TEXT
    },
    province: {
        type: DataTypes.STRING(255)
    },
    district: {
        type: DataTypes.STRING(255)
    },
    subDistrict: {
        type: DataTypes.STRING(255)
    },
    postalCode: {
        type: DataTypes.STRING(10)
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active'
    }
})

MemberModel.sync({alter: true});
module.exports = MemberModel;
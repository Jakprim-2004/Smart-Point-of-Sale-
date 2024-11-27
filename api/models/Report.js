const conn = require('../connect');
const { DataTypes } = require('sequelize');

const Report = conn.define('reportuse', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    contactName: {  // เปลี่ยนจาก phone_name เป็น contactName
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    phoneNumber: {  // เพิ่มฟิลด์เบอร์โทรศัพท์
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
            notEmpty: true,
            is: /^[0-9]{9,10}$/  // ตรวจสอบรูปแบบเบอร์โทรศัพท์
        }
    },
    subject: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending'
    },
    response: {
        type: DataTypes.TEXT
    }
});

Report.sync({ alter: true });
module.exports = Report;


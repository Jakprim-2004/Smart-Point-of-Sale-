const conn = require("../connect");
const { DataTypes } = require("sequelize");

const BillSaleModel = conn.define("BillSale", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    billNo: {
        type: DataTypes.STRING
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2)
    },
    userId: {
        type: DataTypes.BIGINT
    },
    customerId: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    pointsEarned: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    // ตรวจสอบให้แน่ใจว่าใช้ชื่อตารางตรงกับที่ BillSaleDetailModel อ้างถึง
    tableName: 'billSale',
    // เพิ่ม freezeTableName เพื่อป้องกันการแปลงชื่อตาราง
    freezeTableName: true
});

// ลบการเรียก sync ออกจากไฟล์นี้ เพื่อให้จัดการในไฟล์ server.js หรือ setup-db-th.js เท่านั้น
// BillSaleModel.sync({ alter: true });

module.exports = BillSaleModel;
const conn = require("../connect");
const { DataTypes } = require("sequelize");

const CustomerModel = conn.define("Customer", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    // ใช้ชื่อตารางที่ถูกต้องตามที่ถูกอ้างถึง
    tableName: 'Customers',
    freezeTableName: true
});

CustomerModel.prototype.calculatePoints = function(purchaseAmount) {
    // ทุก 100 บาท = 1 แต้ม
    return Math.floor(purchaseAmount / 100);
};

CustomerModel.prototype.updateMembershipTier = function() {
    if (this.points >= 1000) this.membershipTier = 'PLATINUM';
    else if (this.points >= 500) this.membershipTier = 'GOLD';
    else if (this.points >= 100) this.membershipTier = 'SILVER';
    else if (this.points >= 10) this.membershipTier = 'Bronze';
    else this.membershipTier = 'NORMAL';
};

// ลบฟังก์ชันนี้ออกเพื่อป้องกันการซิงค์ซ้ำซ้อน
/*
async function initModel() {
    try {
        await CustomerModel.sync({ alter: true });
        console.log("CustomerModel synchronized successfully");
    } catch (error) {
        console.error("CustomerModel sync error:", error);
    }
}

initModel();
*/

module.exports = CustomerModel;

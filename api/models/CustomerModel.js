const conn = require("../connect");
const { DataTypes } = require("sequelize");

const CustomerModel = conn.define("Customer", {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
    },
    address: {
        type: DataTypes.STRING,
    },
    userId: {
        type: DataTypes.BIGINT,
    },
    
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    totalSpent: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
    },
    
    membershipTier: {
        type: DataTypes.ENUM('NORMAL','Bronze', 'SILVER', 'GOLD', 'PLATINUM'),
        defaultValue: 'NORMAL',
        allowNull: false
    },
    pointsExpireDate: {
        type: DataTypes.DATE
    }
});

// คำนวณแต้มอัตโนมัติ
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

async function initModel() {
    try {
        await CustomerModel.sync({ alter: true });
        console.log("CustomerModel synchronized successfully");
    } catch (error) {
        console.error("CustomerModel sync error:", error);
    }
}

initModel();

module.exports = CustomerModel;

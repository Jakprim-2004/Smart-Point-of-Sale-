const conn = require('../connect');
const { DataTypes } = require('sequelize');

const PackageModel = conn.define('package', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255)
    },
    bill_amount: {
        type: DataTypes.STRING(255)
    },
    price: {
        type: DataTypes.BIGINT
    }
})

// ใช้ alter: true เพื่อให้อัปเดตโครงสร้างตารางโดยไม่ลบข้อมูลเดิม
PackageModel.sync({alter: true})
.then(async () => {
    // ตรวจสอบว่ามีข้อมูล Free Package อยู่แล้วหรือไม่
    const freePackage = await PackageModel.findOne({
        where: { 
            name: 'Free',
            price: 0
        }
    });
    
    // ถ้ายังไม่มี ให้สร้างข้อมูลใหม่
    if (!freePackage) {
        await PackageModel.create({
            name: 'Free',
            bill_amount: 'Unlimit',
            price: 0
        });
        console.log('Created initial Free package data');
    }
})
.catch(err => {
    console.error('Error syncing Package model:', err);
});

module.exports = PackageModel;
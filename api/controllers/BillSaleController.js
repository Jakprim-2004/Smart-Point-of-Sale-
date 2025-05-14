const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const service = require("./Service");
const BillSaleModel = require("../models/BillSaleModel");
const BillSaleDetailModel = require("../models/BillSaleDetailModel");
const CustomerModel = require("../models/CustomerModel"); 
const PointTransactionModel = require('../models/PointTransactionModel'); 

// ฟังก์ชันสำหรับดึงวันที่และเวลาปัจจุบันตามโซนเวลาไทย
const getThaiDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
};

// API สำหรับเปิดบิลขายใหม่
app.get('/billSale/openBill', service.isLogin, async (req, res) => {
    try {
        // เตรียมข้อมูลสำหรับสร้างบิลใหม่
        const payload = {
            userId: service.getMemberId(req), // ดึงรหัสผู้ใช้จาก request
            status: 'open', // ตั้งสถานะบิลเป็นเปิด
            createdAt: getThaiDateTime() // เก็บวันที่และเวลาตามโซนไทย
        };

        // ตรวจสอบว่ามีบิลที่เปิดอยู่ของผู้ใช้หรือไม่
        let result = await BillSaleModel.findOne({
            where: {
                userId: payload.userId,
                status: 'open'
            }
        });

        // ถ้าไม่มีบิลที่เปิดอยู่ ให้สร้างบิลใหม่
        if (result == null) {
            result = await BillSaleModel.create(payload);
        }

        // ส่งผลลัพธ์สำเร็จพร้อมข้อมูลบิล
        res.send({ message: 'success', result: result });
    } catch (e) {
        // ส่งข้อความข้อผิดพลาดเมื่อเกิดปัญหา
        res.statusCode = 500;
        res.send({ message: e.message });
    }
});

// API สำหรับเพิ่มสินค้าลงในบิลขาย
app.post('/billSale/sale', service.isLogin, async (req, res) => {
    try {
        const userId = service.getMemberId(req);
        
        // เตรียมข้อมูลสำหรับเพิ่มสินค้า
        const payload = {
            userId: service.getMemberId(req),
            status: 'open'
        };

        // ดึงข้อมูลบิลปัจจุบัน
        const currentBill = await BillSaleModel.findOne({
            where: payload
        });

        // เตรียมข้อมูลรายการสินค้า
        const item = {
            price: req.body.price,
            productId: req.body.id,
            billSaleId: currentBill.id,
            userId: payload.userId,
            qty: req.body.qty // จำนวนสินค้า
        }

        // ตรวจสอบว่ามีสินค้านี้ในบิลแล้วหรือไม่
        const billSaleDetail = await BillSaleDetailModel.findOne({
            where: {
                productId: item.productId,
                billSaleId: item.billSaleId
            }
        });

        // ถ้าไม่มีสินค้าในบิล ให้เพิ่มรายการใหม่
        if (billSaleDetail == null) {
            await BillSaleDetailModel.create(item);
        } else {
            // ถ้ามีสินค้าแล้ว ให้เพิ่มจำนวน
            item.qty = parseInt(billSaleDetail.qty) + parseInt(item.qty);
            await BillSaleDetailModel.update(item, {
                where: {
                    id: billSaleDetail.id
                }
            })
        }

        res.send({ message: 'success' });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
});



// API สำหรับดึงข้อมูลบิลปัจจุบัน
app.get('/billSale/currentBillInfo', service.isLogin, async (req, res) => {
    try {
        const BillSaleDetailModel = require('../models/BillSaleDetailModel');
        const ProductModel = require('../models/ProductModel');

        // กำหนดความสัมพันธ์ระหว่างโมเดล
        BillSaleModel.hasMany(BillSaleDetailModel);
        BillSaleDetailModel.belongsTo(ProductModel);

        // ดึงข้อมูลบิลปัจจุบันพร้อมรายละเอียดสินค้า
        const results = await BillSaleModel.findOne({
            where: {
                status: 'open',
                userId: service.getMemberId(req)
            },
            include: {
                model: BillSaleDetailModel,
                order: [['id', 'DESC']],
                include: {
                    model: ProductModel,
                    attributes: ['name']
                }
            }
        })

        res.send({ results: results });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.messag });
    }
});

// API สำหรับลบรายการสินค้าในบิล
app.delete('/billSale/deleteItem/:id', service.isLogin, async (req, res) => {
    try {
        // ลบรายการสินค้าตาม ID
        await BillSaleDetailModel.destroy({
            where: {
                id: req.params.id
            }
        });
        res.send({ message: 'success' });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: 'success' });
    }
});

// API สำหรับล้างตะกร้าสินค้าทั้งหมด
app.delete('/billSale/clearCart/:id', service.isLogin, async (req, res) => {
    try {
        // ตรวจสอบว่ามีบิลนี้อยู่จริงหรือไม่
        const bill = await BillSaleModel.findOne({
            where: {
                id: req.params.id,
                status: 'open',
                userId: service.getMemberId(req)
            }
        });

        if (!bill) {
            return res.status(404).send({
                message: 'ไม่พบบิลที่ต้องการล้างตะกร้า'
            });
        }

        // ลบรายการสินค้าทั้งหมดในบิล
        await BillSaleDetailModel.destroy({
            where: {
                billSaleId: req.params.id
            }
        });

        res.send({ message: 'success' });
    } catch (e) {
        res.status(500).send({ 
            message: 'เกิดข้อผิดพลาด',
            error: e.message 
        });
    }
});

// API สำหรับอัปเดตจำนวนสินค้าในบิล
app.post('/billSale/updateQty', service.isLogin, async (req, res) => {
    try {
        // อัปเดตจำนวนสินค้า
        await BillSaleDetailModel.update({
            qty: req.body.qty
        }, {
            where: {
                id: req.body.id
            }
        })

        res.send({ message: 'success' });
    } catch (e) {
        res.statusCode = 500;
        res.send({ mesage: e.mesage });
    }
});

// API สำหรับจบการขาย
app.post('/billSale/endSale', service.isLogin, async (req, res) => {
    try {
        const { method, amount, vatAmount, billSaleDetails, customerId, description } = req.body;
        const currentTime = getThaiDateTime();
        const vatRate = 0.07; // VAT 7%

        // อัปเดตข้อมูลบิล
        const updatedBill = await BillSaleModel.update({
            status: 'pay',
            paymentMethod: method,
            payDate: currentTime,
            totalAmount: amount,
            vatAmount: vatAmount,
            customerId: customerId,
            createdAt: currentTime,
            updatedAt: currentTime,
            description: description
        }, {
            where: {
                status: 'open',
                userId: service.getMemberId(req)
            }
        });

        // อัปเดตรายละเอียดบิล
        for (const detail of billSaleDetails) {
            const subtotal = detail.qty * detail.price;
            const totalWithVat = subtotal * (1 + vatRate);

            await BillSaleDetailModel.update({
                customerId: customerId || null,
                pointsEarned: customerId ? Math.floor(totalWithVat / 100) : 0,
                totalprice: totalWithVat,
                updatedAt: currentTime
            }, {
                where: { id: detail.id }
            });
        }

        // อัปเดตแต้มลูกค้า
        if (customerId) {
            const customer = await CustomerModel.findByPk(customerId);
            if (customer) {
                const pointsEarned = customer.calculatePoints(amount);
                customer.points += pointsEarned;
                customer.totalSpent = parseFloat(customer.totalSpent || 0) + parseFloat(amount);
                customer.lastPurchaseDate = new Date();
                customer.updateMembershipTier();
                await customer.save();
            }
        }

        // อัปเดตรายละเอียดบิลพร้อมคำนวณ VAT
        for (const detail of billSaleDetails) {
            const subtotal = detail.qty * detail.price;
            const itemVat = subtotal * vatRate;
            const totalWithVat = subtotal + itemVat;

            await BillSaleDetailModel.update({
                customerId: customerId || null,
                pointsEarned: customerId ? Math.floor(totalWithVat / 100) : 0,
                totalprice: totalWithVat,
                vatAmount: itemVat,
                updatedAt: currentTime
            }, {
                where: { id: detail.id }
            });
        }

        // บันทึกการใช้แต้มลดราคา (ถ้ามี)
        if (req.body.pointTransaction) {
            await PointTransactionModel.create(req.body.pointTransaction);
        }

        res.json({ message: 'success', result: updatedBill });
    } catch (error) {
        console.error('Error in endSale:', error);
        res.status(500).json({ 
            message: 'error', 
            error: error.message 
        });
    }
});

// API สำหรับดึงบิลล่าสุด
app.get('/billSale/lastBill', service.isLogin, async (req, res) => {
    try {
        const BillSaleDetailModel = require('../models/BillSaleDetailModel');
        const ProductModel = require('../models/ProductModel');

        // กำหนดความสัมพันธ์ระหว่างโมเดล
        BillSaleModel.hasMany(BillSaleDetailModel);
        BillSaleDetailModel.belongsTo(ProductModel);

        // ดึงข้อมูลบิลล่าสุด
        const result = await BillSaleModel.findAll({
            where: {
                status: 'pay',
                userId: service.getMemberId(req)
            },
            order: [['id', 'DESC']],
            limit: 1,
            include: {
                model: BillSaleDetailModel,
                attributes: ['qty', 'price'],
                include: {
                    model: ProductModel,
                    attributes: ['barcode', 'name']
                }
            }
        })

        res.send({ message: 'success', result: result });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
});

// API สำหรับดึงรายการบิลทั้งหมด
app.get('/billSale/list', service.isLogin, async (req, res) => {
    const BillSaleDetailModel = require('../models/BillSaleDetailModel');
    const ProductModel = require('../models/ProductModel');

    // กำหนดความสัมพันธ์ระหว่างโมเดล
    BillSaleModel.hasMany(BillSaleDetailModel);
    BillSaleDetailModel.belongsTo(ProductModel);

    try {
        // ดึงรายการบิลทั้งหมด
        const results = await BillSaleModel.findAll({
            attributes: ['id', 'createdAt', 'paymentMethod', 'status', 'userId','totalAmount', 'description'],
            order: [['id', 'DESC']],
            where: {
                status: 'pay',
                userId: service.getMemberId(req)
            },
            include: {
                model: BillSaleDetailModel,
                include: {
                    model: ProductModel
                }
            }
        });
       
        res.send({ message: 'success', results: results });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
});

// API สำหรับดึงรายการบิลตามปีและเดือน
app.get('/billSale/listByYearAndMonth/:year/:month', service.isLogin, async (req, res) => {
    try {
        let arr = [];
        let y = req.params.year;
        let m = req.params.month;
        let daysInMonth = new Date(y, m, 0).getDate();

        const { Sequelize } = require('sequelize');
        const Op = Sequelize.Op;
        const BillSaleDetailModel = require('../models/BillSaleDetailModel');
        const ProductModel = require('../models/ProductModel');

        // กำหนดความสัมพันธ์ระหว่างโมเดล
        BillSaleModel.hasMany(BillSaleDetailModel);
        BillSaleDetailModel.belongsTo(ProductModel);

        // ดึงข้อมูลบิลตามวันในเดือน
        for (let i = 1; i <= daysInMonth; i++) {
            let startDate = new Date(y, m-1, i, 0, 0, 0);
            let endDate = new Date(y, m-1, i, 23, 59, 59);

            const results = await BillSaleModel.findAll({
                where: {
                    userId: service.getMemberId(req),
                    status: 'pay',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: {
                    model: BillSaleDetailModel,
                    include: {
                        model: ProductModel
                    }
                }
            });

            // คำนวณยอดขายรวมของแต่ละวัน
            let sum = 0;
            if (results.length > 0) {
                for (let result of results) {
                    for (let detail of result.billSaleDetails) {
                        sum += parseInt(detail.qty) * parseInt(detail.price);
                    }
                }
            }

            // เพิ่มข้อมูลยอดขายรายวัน
            arr.push({
                day: i,
                date: startDate,
                results: results,
                sum: sum
            });
        }

        res.send({ message: 'success', results: arr });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
})

module.exports = app;
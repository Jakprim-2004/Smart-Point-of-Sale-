const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const service = require("./Service");
const BillSaleModel = require("../models/BillSaleModel");
const BillSaleDetailModel = require("../models/BillSaleDetailModel");
const CustomerModel = require("../models/CustomerModel"); 
const PointTransactionModel = require('../models/PointTransactionModel'); 

const getThaiDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
};

// Add this helper function at the top 


// API สำหรับเปิดบิล
app.get('/billSale/openBill', service.isLogin, async (req, res) => {
    try {
        const payload = {
            userId: service.getMemberId(req),
            status: 'open',
            createdAt: getThaiDateTime() 
        };

        let result = await BillSaleModel.findOne({
            where: {
                userId: payload.userId,
                status: 'open'
            }
        });

        if (result == null) {
            result = await BillSaleModel.create(payload);
        }

        res.send({ message: 'success', result: result });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
});

// Modify the sale endpoint
app.post('/billSale/sale', service.isLogin, async (req, res) => {
    try {
        const userId = service.getMemberId(req);
        
        // Check bill limit
        const billLimit = await checkBillLimit(userId);
        if (billLimit.hasReachedLimit) {
            return res.status(403).send({ 
                message: 'ไม่สามารถขายได้ เนื่องจากถึงขีดจำกัดจำนวนบิลแล้ว',
                billInfo: billLimit
            });
        }

        const payload = {
            userId: service.getMemberId(req),
            status: 'open'
        };
        const currentBill = await BillSaleModel.findOne({
            where: payload
        });
        const item = {
            price: req.body.price,
            productId: req.body.id,
            billSaleId: currentBill.id,
            userId: payload.userId,
            qty: req.body.qty // เพิ่มจำนวนสินค้า
        }
        const billSaleDetail = await BillSaleDetailModel.findOne({
            where: {
                productId: item.productId,
                billSaleId: item.billSaleId
            }
        });

        if (billSaleDetail == null) {
            await BillSaleDetailModel.create(item);
        } else {
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

// API สำหรับพักบิล
app.post('/billSale/pauseBill', service.isLogin, async (req, res) => {
    try {
        const { id, billSaleDetails } = req.body;

        if (!id || !billSaleDetails || billSaleDetails.length === 0) {
            return res.status(400).send({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // ดึงข้อมูลบิลจาก BillSaleModel
        const bill = await BillSaleModel.findOne({ where: { id } });

        if (!bill) {
            return res.status(404).send({ message: "ไม่พบข้อมูลบิล" });
        }

        // สร้างรายการใหม่ใน PausedBillModel
        await PausedBillModel.create({
            userId: bill.userId,
            items: JSON.stringify(billSaleDetails),
            status: 'paused'
        });

        // ลบรายการบิลจาก BillSaleModel
        await BillSaleModel.destroy({ where: { id } });

        res.send({ message: "success" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// API สำหรับดึงบิลที่มีสถานะ paused
app.get('/billSale/pausedBills', service.isLogin, async (req, res) => {
    try {
        const pausedBills = await BillSaleModel.findAll({
            where: {
                status: 'paused'
            }
        });

        res.send(pausedBills);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

app.post('/billSale/retrieveBill', service.isLogin, async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).send({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // อัปเดตสถานะบิลเป็น "open"
        await BillSaleModel.update(
            { status: 'open' },
            { where: { id } }
        );

        res.send({ message: "success" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});




// API สำหรับข้อมูลบิลปัจจุบัน
app.get('/billSale/currentBillInfo', service.isLogin, async (req, res) => {
    try {
        const BillSaleDetailModel = require('../models/BillSaleDetailModel');
        const ProductModel = require('../models/ProductModel');

        BillSaleModel.hasMany(BillSaleDetailModel);
        BillSaleDetailModel.belongsTo(ProductModel);

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

// API สำหรับล้างตะกร้า
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

        // Update bill with customerId
        const updatedBill = await BillSaleModel.update({
            status: 'pay',
            paymentMethod: method,
            payDate: currentTime,
            totalAmount: amount,
            vatAmount: vatAmount,
            customerId: customerId,
            createdAt: currentTime,
            updatedAt: currentTime,
            description: description // บันทึกข้อมูลการใช้แต้มลงในฐานข้อมูล
        }, {
            where: {
                status: 'open',
                userId: service.getMemberId(req)
            }
        });

        // อัพเดท billSaleDetail
        for (const detail of billSaleDetails) {
            const subtotal = detail.qty * detail.price;
            const totalWithVat = subtotal * (1 + vatRate); // คำนวณราคารวม VAT

            await BillSaleDetailModel.update({
                customerId: customerId || null,
                pointsEarned: customerId ? Math.floor(totalWithVat / 100) : 0,
                totalprice: totalWithVat, // บันทึกเฉพาะราคารวม VAT
                updatedAt: currentTime
            }, {
                where: { id: detail.id }
            });
        }

        // อัพเดทแต้มลูกค้าและ billSaleDetail
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

        // อัพเดท billSaleDetail พร้อมคำนวณ VAT
        for (const detail of billSaleDetails) {
            const subtotal = detail.qty * detail.price;
            const itemVat = subtotal * vatRate;
            const totalWithVat = subtotal + itemVat;

            await BillSaleDetailModel.update({
                customerId: customerId || null,
                pointsEarned: customerId ? Math.floor(totalWithVat / 100) : 0,
                totalprice: totalWithVat, // บันทึกราคารวม VAT
                vatAmount: itemVat, // บันทึก VAT แยกต่างหาก
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

// API สำหรับบิลล่าสุด
app.get('/billSale/lastBill', service.isLogin, async (req, res) => {
    try {
        const BillSaleDetailModel = require('../models/BillSaleDetailModel');
        const ProductModel = require('../models/ProductModel');

        BillSaleModel.hasMany(BillSaleDetailModel);
        BillSaleDetailModel.belongsTo(ProductModel);

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



// API สำหรับรายการบิลทั้งหมด
app.get('/billSale/list', service.isLogin, async (req, res) => {
    const BillSaleDetailModel = require('../models/BillSaleDetailModel');
    const ProductModel = require('../models/ProductModel');

    BillSaleModel.hasMany(BillSaleDetailModel);
    BillSaleDetailModel.belongsTo(ProductModel);

    try {
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

// API สำหรับรายการบิลตามปีและเดือน
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

        BillSaleModel.hasMany(BillSaleDetailModel);
        BillSaleDetailModel.belongsTo(ProductModel);

        // สร้าง array สำหรับทุกวันในเดือน
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

            let sum = 0;
            if (results.length > 0) {
                for (let result of results) {
                    for (let detail of result.billSaleDetails) {
                        sum += parseInt(detail.qty) * parseInt(detail.price);
                    }
                }
            }

            // เพิ่มข้อมูลทุกวัน แม้จะไม่มียอดขาย
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
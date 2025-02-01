const express = require('express');
const router = express.Router();
const sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
require("dotenv").config();
const service = require("./Service");
const CustomerModel = require("../models/CustomerModel");
const BillSaleModel = require("../models/BillSaleModel");
const BillSaleDetailModel = require("../models/BillSaleDetailModel");
const ProductModel = require("../models/ProductModel");

// ดึงข้อมูลลูกค้าทั้งหมด
router.get("/customers", async (req, res) => {
    try {
        const customers = await CustomerModel.findAll({
            order: [['id', 'DESC']]
        });
        res.json({ result: customers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ดึงข้อมูลลูกค้าตาม ID
router.get("/customer/:id", async (req, res) => {
    try {
        const customer = await CustomerModel.findByPk(req.params.id);
        res.json({ result: customer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// อัพเดทข้อมูลลูกค้า
router.put("/customer/:id", async (req, res) => {
    try {
        const customer = await CustomerModel.update(req.body, {
            where: { id: req.params.id }
        });
        res.json({ result: customer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// สร้างลูกค้าใหม่
router.post("/customer", service.isLogin, async (req, res) => {
    try {
        const userId = service.getAdminId(req); // ดึง userId จาก token
        if (!userId) {
            return res.status(400).json({ error: "กรุณาเข้าสู่ระบบใหม่" });
        }

        // ตรวจสอบเบอร์โทรซ้ำ
        const existingCustomer = await CustomerModel.findOne({
            where: { phone: req.body.phone }
        });

        if (existingCustomer) {
            return res.status(400).json({ error: "เบอร์โทรศัพท์นี้มีในระบบแล้ว" });
        }

        const customerData = {
            ...req.body,
            userId: userId,
            points: 0,
            membershipTier: 'NORMAL',
            pointsExpireDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        };

        const newCustomer = await CustomerModel.create(customerData);

        res.json({ 
            message: 'success',
            result: newCustomer
        });

    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: error.message });
    }
});

// เพิ่ม route สำหรับ login ลูกค้า
router.post("/login/customer", async (req, res) => {
    try {
        const { email, phone } = req.body;
        const whereClause = {};
        
        if (email) {
            whereClause.email = email;
        } else if (phone) {
            whereClause.phone = phone;
        } else {
            return res.status(400).json({ 
                success: false, 
                message: "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์" 
            });
        }

        const customer = await CustomerModel.findOne({
            where: whereClause
        });

        if (!customer) {
            return res.status(404).json({ 
                success: false, 
                message: "ไม่พบข้อมูลลูกค้า" 
            });
        }

        res.json({ 
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            result: customer
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง" 
        });
    }
});

// เพิ่ม route สำหรับดึงประวัติการซื้อของลูกค้า
router.get("/customer/:id/purchases", async (req, res) => {
    try {
        const bills = await BillSaleModel.findAll({
            where: { customerId: req.params.id },
            include: [
                {
                    model: BillSaleDetailModel,
                    as: 'details',
                    include: [{
                        model: ProductModel,
                        attributes: ['name', 'price']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });


        res.json({ 
            success: true,
            result: bills 
        });
    } catch (error) {
        console.error('Get purchase history error:', error);
        res.status(500).json({ 
            success: false, 
            message: "เกิดข้อผิดพลาดในการดึงข้อมูล" 
        });
    }
});

// เพิ่ม route สำหรับดึงรายละเอียดบิล
router.get("/bill/:id", async (req, res) => {
    try {
        const bill = await BillSaleModel.findOne({
            where: { id: req.params.id },
            include: [{
                model: BillSaleDetailModel,
                as: 'details',
                include: [{
                    model: ProductModel,
                    required: false, // แก้เป็น false เพื่อให้แสดงรายการแม้ไม่มีข้อมูล Product
                    attributes: ['id', 'name', 'price']
                }]
            }]
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบข้อมูลบิล"
            });
        }

        // ดึงข้อมูลสินค้าเพิ่มเติมสำหรับรายการที่ไม่มี Product
        const formattedBill = {
            ...bill.toJSON(),
            details: await Promise.all(bill.details.map(async detail => {
                let productName = 'ไม่พบชื่อสินค้า';
                
                if (!detail.Product && detail.productId) {
                    const product = await ProductModel.findByPk(detail.productId);
                    if (product) {
                        productName = product.name;
                    }
                } else if (detail.Product) {
                    productName = detail.Product.name;
                }

                return {
                    id: detail.id,
                    productId: detail.productId,
                    productName: productName,
                    price: detail.price || 0,
                    qty: detail.qty || 0,
                    subtotal: (detail.price || 0) * (detail.qty || 0)
                };
            }))
        };


        res.json({ 
            success: true,
            result: formattedBill
        });
    } catch (error) {
        console.error('Get bill detail error:', error);
        res.status(500).json({ 
            success: false, 
            message: "เกิดข้อผิดพลาดในการดึงข้อมูล" 
        });
    }
});

module.exports = router;
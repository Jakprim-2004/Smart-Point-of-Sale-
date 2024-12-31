const express = require('express');
const router = express.Router();
const sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
require("dotenv").config();
const service = require("./Service");
const CustomerModel = require("../models/CustomerModel");

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

module.exports = router;
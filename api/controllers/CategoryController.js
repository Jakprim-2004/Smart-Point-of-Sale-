const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const service = require("./Service");
const CategoryModel = require("../models/CategoryModel");

// API สำหรับดึงหมวดหมู่สินค้าทั้งหมด
app.get("/category/list", async (req, res) => {
  try {
    const userId = await service.getMemberId(req);
    const categories = await CategoryModel.findAll({
      where: { userId: userId },
      order: [['name', 'ASC']]
    });
    res.json({ message: "success", results: categories });
  } catch (error) {
    res.status(500).json({ message: "error", error: error.message });
  }
});

// API สำหรับดึงหมวดหมู่สินค้าตาม ID
app.get("/category/:id", async (req, res) => {
    try {
        const userId = await service.getMemberId(req);
        const category = await service.getCategoryById(req.params.id, userId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API สำหรับเพิ่มหมวดหมู่สินค้าใหม่
app.post("/category/insert", async (req, res) => {
    try {
        const userId = await service.getMemberId(req);
        const newCategory = await CategoryModel.create({ 
            ...req.body,
            userId: userId 
        });
        res.json({ message: "success", results: newCategory });
    } catch (error) {
        res.status(500).json({ message: "error", error: error});
    }
});

// API สำหรับอัปเดตข้อมูลหมวดหมู่สินค้า
app.post("/category/update/:id", async (req, res) => {
    try {
        const userId = await service.getMemberId(req);
        const category = await CategoryModel.findOne({
            where: { id: req.params.id, userId: userId }
        });
        
        if (!category) {
            return res.status(404).json({ message: "error", error: "Category not found" });
        }

        await category.update(req.body);
        res.json({ message: "success" });
    } catch (error) {
        res.status(500).json({ message: "error", error: error.message });
    }
});

// API สำหรับลบหมวดหมู่สินค้า
app.delete("/category/delete/:id", async (req, res) => {
    try {
        const userId = await service.getMemberId(req);
        const result = await CategoryModel.destroy({
            where: { id: req.params.id, userId: userId }
        });
        
        if (result === 0) {
            return res.status(404).json({ message: "error", error: "Category not found" });
        }
        
        res.json({ message: "success" });
    } catch (error) {
        res.status(500).json({ message: "error", error: error.message });
    }
});

module.exports = app;
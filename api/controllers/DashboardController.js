const express = require('express');
const router = express.Router();
const StockModel = require('../models/StockModel');
const BillSaleDetailModel = require('../models/BillSaleDetailModel');
const ProductModel = require('../models/ProductModel');
const BillSaleModel = require('../models/BillSaleModel');
const sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
require("dotenv").config();
const service = require("./Service");




router.post("/reportSumSalePerMonth", async (req, res) => {
  try {
    const { year, month, viewType } = req.body; 
    const userId = service.getMemberId(req); 
    let attributes, groupBy;

    if (viewType === "monthly") {
      attributes = [
        [sequelize.fn("EXTRACT", sequelize.literal("MONTH FROM \"billSaleDetail\".\"createdAt\"")), "month"],
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"price\" * \"billSaleDetail\".\"qty\"")), "sum"], 
        [sequelize.fn("SUM", sequelize.literal("(\"product\".\"price\" - \"product\".\"cost\") * \"billSaleDetail\".\"qty\"")), "profit"], 
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"cost\" * \"billSaleDetail\".\"qty\"")), "cost"] 
      ];
      groupBy = [sequelize.fn("EXTRACT", sequelize.literal("MONTH FROM \"billSaleDetail\".\"createdAt\""))];
    } else if (viewType === "weekly") {
      attributes = [
        [sequelize.fn("EXTRACT", sequelize.literal("WEEK FROM \"billSaleDetail\".\"createdAt\"")), "week"],
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"price\" * \"billSaleDetail\".\"qty\"")), "sum"], 
        [sequelize.fn("SUM", sequelize.literal("(\"product\".\"price\" - \"product\".\"cost\") * \"billSaleDetail\".\"qty\"")), "profit"], 
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"cost\" * \"billSaleDetail\".\"qty\"")), "cost"] 
      ];
      groupBy = [sequelize.fn("EXTRACT", sequelize.literal("WEEK FROM \"billSaleDetail\".\"createdAt\""))];
    } else if (viewType === "daily") {
      attributes = [
        [sequelize.fn("EXTRACT", sequelize.literal("DAY FROM \"billSaleDetail\".\"createdAt\"")), "day"],
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"price\" * \"billSaleDetail\".\"qty\"")), "sum"],
        [sequelize.fn("SUM", sequelize.literal("(\"product\".\"price\" - \"product\".\"cost\") * \"billSaleDetail\".\"qty\"")), "profit"], 
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"cost\" * \"billSaleDetail\".\"qty\"")), "cost"]
      ];
      groupBy = [sequelize.fn("EXTRACT", sequelize.literal("DAY FROM \"billSaleDetail\".\"createdAt\""))];
    }

    const whereConditions = [
      sequelize.where(sequelize.fn("EXTRACT", sequelize.literal("YEAR FROM \"billSaleDetail\".\"createdAt\"")), year),
      { userId: userId }
    ];

    if (viewType === "daily" || viewType === "weekly") {
      whereConditions.push(sequelize.where(sequelize.fn("EXTRACT", sequelize.literal("MONTH FROM \"billSaleDetail\".\"createdAt\"")), month));
    }

    const salesResults = await BillSaleDetailModel.findAll({
      attributes: attributes,
      where: {
        [sequelize.Op.and]: whereConditions
      },
      group: groupBy,
      include: [{ 
        model: ProductModel, 
        as: 'product',  
        attributes: [] 
      }] 
    });

    let totalSales = 0;
    let totalProfit = 0;
    let totalCost = 0;

    salesResults.forEach(item => {
      totalSales += parseFloat(item.dataValues.sum || 0);
      totalProfit += parseFloat(item.dataValues.profit || 0);
      totalCost += parseFloat(item.dataValues.cost || 0);
    });

    res.send({
      message: "success",
      results: salesResults,
      totalSales: totalSales,
      totalProfit: totalProfit,
      totalCost: totalCost
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/reportStock', async (req, res) => {
  try {
    const userId = service.getMemberId(req); 
    const stocks = await StockModel.findAll({
      attributes: ['productId', 'qty'],
      include: [{ 
        model: ProductModel, 
        as: 'product',  
        attributes: ['name'] 
      }],
      where: { userId: userId } 
    });

    const billSaleDetails = await BillSaleDetailModel.findAll({
      attributes: ['productId', [sequelize.fn('SUM', sequelize.col('qty')), 'totalQty']],
      group: ['productId'],
      where: { userId: userId } 
    });

    const stockMap = new Map();

    stocks.forEach(stock => {
      const productId = stock.productId;
      const currentStock = stockMap.get(productId) || {
        productId: productId,
        productName: stock.product.name,
        totalQty: 0 
      };

      currentStock.totalQty += parseInt(stock.qty, 10); 
      stockMap.set(productId, currentStock);
    });

    billSaleDetails.forEach(bill => {
      const productId = bill.productId;
      if (stockMap.has(productId)) {
        const currentStock = stockMap.get(productId);
        const soldQty = parseInt(bill.dataValues.totalQty, 10);
        currentStock.totalQty = Math.max(0, currentStock.totalQty - soldQty); 
      }
    });

    const totalStock = Array.from(stockMap.values());

    res.send({ message: 'success', results: totalStock });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/reportTopSellingProducts', async (req, res) => {
  try {
    const userId = service.getMemberId(req); 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const topSellingProducts = await BillSaleDetailModel.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('qty')), 'totalQty'],
        [sequelize.col('product.name'), 'productName'],
        [sequelize.fn('SUM', 
          sequelize.literal('qty * "product"."price"')
        ), 'totalAmount']
      ],
      group: ['productId', 'product.name', 'product.price'], 
      having: sequelize.literal('SUM(qty) > 0'), 
      order: [[sequelize.fn('SUM', 
        sequelize.literal('qty * "product"."price"')
      ), 'DESC']],
      limit: 5,
      include: [{ 
        model: ProductModel, 
        as: 'product',  
        attributes: [] 
      }],
      where: { 
        userId: userId,
        createdAt: {
          [sequelize.Op.gte]: today,
          [sequelize.Op.lt]: tomorrow
        }
      } 
    });

    const results = topSellingProducts.map(product => {
      const data = product.get({ plain: true });
      return {
        ...data,
        totalAmount: parseFloat(data.totalAmount) || 0,
        totalQty: parseInt(data.totalQty) || 0
      };
    });

    res.send({ message: 'success', results });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/reportTopSellingCategories', async (req, res) => {
  try {
    const userId = service.getMemberId(req); 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const topSellingCategories = await BillSaleDetailModel.findAll({
      attributes: [
        [sequelize.col('product.category'), 'category'],
        [sequelize.fn('SUM', sequelize.col('qty')), 'totalQty'],
        [sequelize.fn('SUM', 
          sequelize.literal('qty * "product"."price"')
        ), 'totalAmount']
      ],
      group: ['product.category', 'product.price'],  // เพิ่ม product.price ใน group by
      having: sequelize.literal('SUM(qty) > 0'),  // เพิ่มเงื่อนไขให้แสดงเฉพาะที่มีการขาย
      order: [[sequelize.fn('SUM', sequelize.literal('qty * "product"."price"')), 'DESC']], 
      limit: 5,
      include: [{ 
        model: ProductModel, 
        as: 'product',
        attributes: [] 
      }],
      where: { 
        userId: userId,
        createdAt: {
          [sequelize.Op.gte]: today,
          [sequelize.Op.lt]: tomorrow
        }
      } 
    });

    const results = topSellingCategories.map(category => {
      const data = category.get({ plain: true });
      return {
        ...data,
        totalAmount: parseFloat(data.totalAmount) || 0,
        totalQty: parseInt(data.totalQty) || 0
      };
    });

    // คำนวณ total amount รวมทั้งหมด
    const totalAmount = topSellingCategories.reduce((sum, category) => 
      sum + parseFloat(category.dataValues.totalAmount || 0), 0);

    // เพิ่มเปอร์เซ็นต์ให้แต่ละ category
    const categoriesWithPercentage = topSellingCategories.map(category => ({
      ...category.dataValues,
      percentage: totalAmount > 0 ? 
        ((parseFloat(category.dataValues.totalAmount || 0) / totalAmount) * 100).toFixed(2) : 0
    }));

    res.send({ 
      message: 'success', 
      results: categoriesWithPercentage 
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/reportTodaySales', async (req, res) => {
  try {
    const userId = service.getMemberId(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all sales for today
    const todaySales = await BillSaleModel.findAll({
      where: {
        userId: userId,
        createdAt: {
          [sequelize.Op.gte]: today,
          [sequelize.Op.lt]: tomorrow
        },
        status: 'completed'
      },
      include: [{
        model: BillSaleDetailModel,
        as: 'details',
        include: [{
          model: ProductModel,
          as: 'product'
        }]
      }]
    });

    // Calculate metrics
    const totalAmount = todaySales.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const billCount = todaySales.length;
    const averagePerBill = billCount > 0 ? totalAmount / billCount : 0;

    // Calculate hourly sales
    const hourlyData = Array(24).fill().map((_, hour) => ({
      hour,
      amount: 0
    }));

    todaySales.forEach(bill => {
      const hour = new Date(bill.createdAt).getHours();
      hourlyData[hour].amount += bill.totalAmount || 0;
    });

    
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.send({
      message: 'success',
      results: {
        date: today,
        totalAmount,
        billCount,
        averagePerBill,
        hourlyData,
        topProducts
      }
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// เพิ่ม API endpoint ใหม่
router.get('/todaySalesReport', async (req, res) => {
  try {
    const userId = service.getMemberId(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's sales with payment method filter
    const todaySales = await BillSaleModel.findAll({
      where: {
        userId: userId,
        createdAt: {
          [sequelize.Op.gte]: today,
          [sequelize.Op.lt]: tomorrow
        },
        paymentMethod: {
          [sequelize.Op.in]: ['Cash', 'PromptPay']
        }
      },
      include: [{
        model: BillSaleDetailModel,
        as: 'details',
        include: [{
          model: ProductModel,
          as: 'product'
        }]
      }]
    });

    // Get yesterday's sales with payment method filter
    const yesterdaySales = await BillSaleModel.findAll({
      where: {
        userId: userId,
        createdAt: {
          [sequelize.Op.gte]: yesterday,
          [sequelize.Op.lt]: today
        },
        paymentMethod: {
          [sequelize.Op.in]: ['Cash', 'PromptPay']
        }
      },
      include: [{
        model: BillSaleDetailModel,
        as: 'details',
        include: [{
          model: ProductModel,
          as: 'product'
        }]
      }]
    });

    // Calculate totals and growth
    // แก้ไขฟังก์ชัน calculateDailyTotals ให้คำนวณ qty * totalprice
    const calculateDailyTotals = (sales) => {
      let total = 0;
      sales.forEach(bill => {
        if (bill.details && bill.details.length > 0) {
          bill.details.forEach(detail => {
            total += parseFloat(detail.qty || 0) * parseFloat(detail.totalprice || 0);
          });
        }
      });
      return total;
    };

    const todayTotal = calculateDailyTotals(todaySales);
    const yesterdayTotal = calculateDailyTotals(yesterdaySales);
    const todayBillCount = todaySales.length;
    const yesterdayBillCount = yesterdaySales.length;
    const todayAveragePerBill = todayBillCount > 0 ? todayTotal / todayBillCount : 0;
    const yesterdayAveragePerBill = yesterdayBillCount > 0 ? yesterdayTotal / yesterdayBillCount : 0;

    // Calculate growth percentages
    const growthRate = yesterdayTotal ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
    const billCountGrowth = yesterdayBillCount ? ((todayBillCount - yesterdayBillCount) / yesterdayBillCount) * 100 : 0;
    const averageGrowth = yesterdayAveragePerBill ? ((todayAveragePerBill - yesterdayAveragePerBill) / yesterdayAveragePerBill) * 100 : 0;

    // Initialize hourly data array
    const hourlyData = Array(24).fill().map((_, hour) => ({
      hour,
      amount: 0
    }));

    // Calculate hourly totals
    todaySales.forEach(bill => {
      const hour = new Date(bill.createdAt).getHours();
      const billAmount = bill.details?.reduce((sum, detail) => {
        return sum + (parseFloat(detail.qty || 0) * parseFloat(detail.totalprice || 0));
      }, 0) || 0;
      hourlyData[hour].amount += billAmount;
    });

    const response = {
      message: 'success',
      results: {
        date: today,
        totalAmount: todayTotal,
        billCount: todayBillCount,
        yesterdayBillCount: yesterdayBillCount,
        billCountGrowth: parseFloat(billCountGrowth.toFixed(2)),
        averagePerBill: todayAveragePerBill,
        yesterdayAveragePerBill: yesterdayAveragePerBill,
        averageGrowth: parseFloat(averageGrowth.toFixed(2)),
        hourlyData: hourlyData, // Add the hourlyData here
        growthRate: parseFloat(growthRate.toFixed(2)),
        yesterdayTotal
      }
    };

    res.send(response);

  } catch (error) {
    res.status(500).send({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน',
      error: error.message 
    });
  }
});

router.get('/paymentMethodStats', async (req, res) => {
  try {
    const userId = service.getMemberId(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentStats = await BillSaleModel.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('billSale.id')), 'count'],
        [sequelize.fn('SUM', 
          sequelize.literal('"details"."qty" * "details->product"."price"')
        ), 'total']
      ],
      include: [{
        model: BillSaleDetailModel,
        as: 'details',
        attributes: [],
        required: true,
        include: [{
          model: ProductModel,
          as: 'product',
          attributes: [],
          required: true
        }]
      }],
      where: {
        userId: userId,
        createdAt: {
          [sequelize.Op.gte]: today,
          [sequelize.Op.lt]: tomorrow
        },
        paymentMethod: {
          [sequelize.Op.in]: ['Cash', 'PromptPay']  // Add this filter
        }
      },
      group: ['paymentMethod'],
      raw: true
    });

    res.send({ 
      message: 'success', 
      results: paymentStats.map(stat => ({
        ...stat,
        total: parseFloat(stat.total) || 0,
        label: '' // Add empty label for chart display
      }))
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
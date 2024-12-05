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

    if (viewType === "daily") {
      attributes = [
        [sequelize.fn("EXTRACT", sequelize.literal("DAY FROM \"billSaleDetail\".\"createdAt\"")), "day"],
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"price\" * \"billSaleDetail\".\"qty\"")), "sum"],
        [sequelize.fn("SUM", sequelize.literal("(\"product\".\"price\" - \"product\".\"cost\") * \"billSaleDetail\".\"qty\"")), "profit"],
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"cost\" * \"billSaleDetail\".\"qty\"")), "cost"]
      ];
      groupBy = [sequelize.fn("EXTRACT", sequelize.literal("DAY FROM \"billSaleDetail\".\"createdAt\""))];
    } else if (viewType === "monthly") {
      attributes = [
        [sequelize.fn("EXTRACT", sequelize.literal("MONTH FROM \"billSaleDetail\".\"createdAt\"")), "month"],
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"price\" * \"billSaleDetail\".\"qty\"")), "sum"],
        [sequelize.fn("SUM", sequelize.literal("(\"product\".\"price\" - \"product\".\"cost\") * \"billSaleDetail\".\"qty\"")), "profit"],
        [sequelize.fn("SUM", sequelize.literal("\"product\".\"cost\" * \"billSaleDetail\".\"qty\"")), "cost"]
      ];
      groupBy = [sequelize.fn("EXTRACT", sequelize.literal("MONTH FROM \"billSaleDetail\".\"createdAt\""))];
    }

    const whereConditions = [
      sequelize.where(sequelize.fn("EXTRACT", sequelize.literal("YEAR FROM \"billSaleDetail\".\"createdAt\"")), year),
      { userId: userId }
    ];

    if (viewType === "daily") {
      whereConditions.push(sequelize.where(sequelize.fn("EXTRACT", sequelize.literal("MONTH FROM \"billSaleDetail\".\"createdAt\"")), month));
    }

    const results = await BillSaleDetailModel.findAll({
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

    const totalSales = results.reduce((sum, item) => sum + parseFloat(item.dataValues.sum || 0), 0);
    const totalProfit = results.reduce((sum, item) => sum + parseFloat(item.dataValues.profit || 0), 0);
    const totalCost = results.reduce((sum, item) => sum + parseFloat(item.dataValues.cost || 0), 0);

    res.send({
      message: "success",
      results: results,
      totalSales,
      totalProfit,
      totalCost
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
          sequelize.literal('qty * totalprice') // Changed to use totalprice
        ), 'totalAmount']
      ],
      group: ['productId', 'product.name', 'product.price'], 
      having: sequelize.literal('SUM(qty) > 0'), 
      order: [[sequelize.fn('SUM', 
        sequelize.literal('qty * totalprice') // Changed to use totalprice
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
          sequelize.literal('qty * totalprice') // Changed to use totalprice
        ), 'totalAmount']
      ],
      group: ['product.category', 'product.price'],  // เพิ่ม product.price ใน group by
      having: sequelize.literal('SUM(qty) > 0'),  // เพิ่มเงื่อนไขให้แสดงเฉพาะที่มีการขาย
      order: [[sequelize.fn('SUM', sequelize.literal('qty * totalprice')), 'DESC']], // Changed to use totalprice
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
          sequelize.literal('"details"."qty" * "details"."totalprice"') // Changed to use totalprice
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

router.post('/reportSalesByDateRange', async (req, res) => {
  try {
    const userId = service.getMemberId(req);
    const { dateRange, customStartDate, customEndDate } = req.body;
    
    let startDate = new Date();
    let endDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Handle different date ranges with validation
    if (dateRange === 'custom') {
      if (!customStartDate || !customEndDate) {
        return res.send({
          message: 'success',
          results: []
        });
      }
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.send({
          message: 'success',
          results: []
        });
      }
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (dateRange) {
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1);
          endDate.setDate(endDate.getDate() - 1);
          break;
        case 'last7days':
          startDate.setDate(startDate.getDate() - 6);
          break;
        case 'last30days':
          startDate.setDate(startDate.getDate() - 29);
          break;
        case 'thisMonth':
          startDate.setDate(1);
          break;
        case 'lastMonth':
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setDate(1);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          break;
        case 'custom':
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    const results = await BillSaleDetailModel.findAll({
      attributes: [
        'productId',
        [sequelize.col('product.name'), 'productName'],
        [sequelize.fn('SUM', sequelize.col('qty')), 'quantity'],
        [sequelize.fn('SUM', sequelize.literal('qty * totalprice')), 'totalAmount'],
        [sequelize.col('product.cost'), 'costPerUnit'],
        [sequelize.col('product.price'), 'pricePerUnit'],
        [sequelize.fn('SUM', 
          sequelize.literal('(totalprice - product.cost) * qty')
        ), 'netProfit']
      ],
      include: [{
        model: ProductModel,
        as: 'product',
        attributes: []
      }],
      where: {
        userId,
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      group: [
        'productId',
        'product.name',
        'product.cost',
        'product.price'
      ],
      order: [['productId', 'ASC']],
      raw: true
    });

    res.send({
      message: 'success',
      results: results.map(item => ({
        ...item,
        quantity: parseInt(item.quantity) || 0,
        totalAmount: parseFloat(item.totalAmount) || 0,
        costPerUnit: parseFloat(item.costPerUnit) || 0,
        pricePerUnit: parseFloat(item.pricePerUnit) || 0,
        netProfit: parseFloat(item.netProfit) || 0
      }))
    });
    
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.post('/productDetails', async (req, res) => {
  try {
    const userId = service.getMemberId(req);
    const { startDate, endDate, dateRange } = req.body;
    
    // Create Date objects for UTC+7 (Bangkok timezone)
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Adjust for Bangkok timezone
    start.setHours(start.getHours() + 7);
    end.setHours(end.getHours() + 7);

    const results = await BillSaleDetailModel.findAll({
      attributes: [
        [sequelize.literal('DATE("billSaleDetail"."createdAt" AT TIME ZONE \'Asia/Bangkok\')'), 'saleDate'],
        [sequelize.fn('SUM', sequelize.literal('qty * totalprice')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.col('qty')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.literal('(totalprice - product.cost) * qty')), 'netProfit'],
        [sequelize.fn('MIN', sequelize.col('product.cost')), 'minCostPerUnit'],
        [sequelize.fn('MAX', sequelize.col('product.price')), 'maxPricePerUnit']
      ],
      include: [{
        model: ProductModel,
        as: 'product',
        attributes: [],
        required: true
      }],
      where: { 
        userId,
        createdAt: {
          [sequelize.Op.between]: [start, end]
        }
      },
      group: [
        sequelize.literal('DATE("billSaleDetail"."createdAt" AT TIME ZONE \'Asia/Bangkok\')'),
        'product.cost',
        'product.price'
      ],
      order: [
        [sequelize.literal('DATE("billSaleDetail"."createdAt" AT TIME ZONE \'Asia/Bangkok\')'), 'ASC']
      ],
      raw: true
    });

    // Group results by date
    const groupedResults = results.reduce((acc, curr) => {
      const date = curr.saleDate;
      if (!acc[date]) {
        acc[date] = {
          saleDate: curr.saleDate,
          totalAmount: 0,
          totalQuantity: 0,
          netProfit: 0,
          minCostPerUnit: curr.minCostPerUnit,
          maxPricePerUnit: curr.maxPricePerUnit
        };
      }
      acc[date].totalAmount += parseFloat(curr.totalAmount || 0);
      acc[date].totalQuantity += parseInt(curr.totalQuantity || 0);
      acc[date].netProfit += parseFloat(curr.netProfit || 0);
      acc[date].minCostPerUnit = Math.min(acc[date].minCostPerUnit, curr.minCostPerUnit);
      acc[date].maxPricePerUnit = Math.max(acc[date].maxPricePerUnit, curr.maxPricePerUnit);
      return acc;
    }, {});

    res.send({
      message: 'success',
      results: Object.values(groupedResults)
    });

  } catch (error) {
    console.error('Error in productDetails:', error);
    res.status(500).send({ message: error.message });
  }
});

// แก้ไข GET endpoint เช่นเดียวกัน
router.get('/productDetails', async (req, res) => {
  try {
    const userId = service.getMemberId(req);
    
    // Get today's date by default
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = await BillSaleDetailModel.findAll({
      attributes: [
        'productId',
        [sequelize.col('product.name'), 'productName'],
        [sequelize.fn('SUM', sequelize.col('qty')), 'quantity'],
        [sequelize.fn('SUM', sequelize.literal('qty * totalprice')), 'totalAmount'],
        [sequelize.col('product.cost'), 'costPerUnit'],
        [sequelize.col('product.price'), 'pricePerUnit'],
        [sequelize.fn('SUM', 
          sequelize.literal('(totalprice - product.cost) * qty')
        ), 'netProfit'],
        [sequelize.literal('DATE("billSaleDetail"."createdAt")'), 'saleDate']
      ],
      include: [{
        model: ProductModel,
        as: 'product',
        attributes: []
      }],
      where: { 
        userId,
        createdAt: {
          [sequelize.Op.gte]: today,
          [sequelize.Op.lt]: tomorrow
        }
      },
      group: [
        'productId', 
        'product.name', 
        'product.cost', 
        'product.price',
        sequelize.literal('DATE("billSaleDetail"."createdAt")')
      ],
      order: [
        [sequelize.literal('DATE("billSaleDetail"."createdAt")'), 'ASC'],
        ['productId', 'ASC']
      ],
      raw: true
    });

    res.send({
      message: 'success',
      results: results.map(item => ({
        ...item,
        quantity: parseInt(item.quantity) || 0,
        totalAmount: parseFloat(item.totalAmount) || 0,
        costPerUnit: parseFloat(item.costPerUnit) || 0,
        pricePerUnit: parseFloat(item.pricePerUnit) || 0,
        netProfit: parseFloat(item.netProfit) || 0
      }))
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.post('/reportTopSalesDays', async (req, res) => {
  try {
    const userId = service.getMemberId(req);
    const { startDate, endDate } = req.body;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setHours(7, 0, 0, 0);
    end.setHours(30, 59, 59, 999);

    const results = await BillSaleDetailModel.findAll({
      attributes: [
        [sequelize.literal('DATE("billSaleDetail"."createdAt" AT TIME ZONE \'Asia/Bangkok\')'), 'date'],
        [sequelize.fn('SUM', 
          sequelize.literal('(totalprice - product.cost) * qty')
        ), 'netProfit']
      ],
      include: [{
        model: ProductModel,
        as: 'product',
        attributes: [],
        required: true
      }],
      where: {
        userId,
        createdAt: {
          [sequelize.Op.between]: [start, end]
        }
      },
      group: [sequelize.literal('DATE("billSaleDetail"."createdAt" AT TIME ZONE \'Asia/Bangkok\')')],
      having: sequelize.literal('SUM((totalprice - product.cost) * qty) > 0'),
      order: [[sequelize.fn('SUM', 
        sequelize.literal('(totalprice - product.cost) * qty')
      ), 'DESC']],
      limit: 5,
      raw: true
    });

    // ส่งเฉพาะผลลัพธ์ 5 อันดับแรก ไม่ต้องสร้าง datesInRange
    res.send({
      message: 'success',
      results: results.map(item => ({
        date: item.date,
        netProfit: parseFloat(item.netProfit) || 0
      }))
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.post('/stock/combinedReport', async (req, res) => {
  try {
    const userId = service.getMemberId(req);
    const { startDate, endDate } = req.body;
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get sales data with product information
    const results = await BillSaleDetailModel.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('qty')), 'soldQty'],
        [sequelize.fn('SUM', sequelize.literal('qty * totalprice')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.literal('(totalprice - product.cost) * qty')), 'netProfit'],
      ],
      include: [{
        model: ProductModel,
        as: 'product',
        attributes: ['name', 'cost', 'price']
      }],
      where: {
        userId,
        createdAt: {
          [sequelize.Op.between]: [start, end]
        }
      },
      group: ['productId', 'product.name', 'product.cost', 'product.price'],
      having: sequelize.literal('SUM(qty) > 0'), // Only get items with sales
      raw: true
    });

    res.send({
      message: 'success',
      results: results.map(item => ({
        productId: item.productId,
        name: item['product.name'] || '',
        soldQty: parseInt(item.soldQty) || 0,
        cost: parseFloat(item['product.cost']) || 0,
        price: parseFloat(item['product.price']) || 0,
        totalAmount: parseFloat(item.totalAmount) || 0,
        netProfit: parseFloat(item.netProfit) || 0
      }))
    });

  } catch (error) {
    console.error('Error in combined stock report:', error);
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
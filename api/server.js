const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads")); // หมายเหตุ: การจัดการไฟล์บน Vercel อาจต้องใช้บริการอย่าง Vercel Blob

// Controllers (Routes)
app.use(require("./controllers/MemberController"));
app.use(require("./controllers/ProductController"));
app.use(require("./controllers/ProductImageController"));
app.use(require("./controllers/BillSaleController"));
app.use(require("./controllers/StockController"));
app.use(require("./controllers/DashboardController"));
app.use(require('./controllers/CustomerControllers'));
app.use(require('./controllers/RewardController'));
app.use(require('./controllers/CategoryController'));

// Export ตัวแอปเพื่อให้ Vercel นำไปใช้งาน
module.exports = app;
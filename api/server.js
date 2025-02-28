// นำเข้าโมดูลสำหรับตั้งค่าการแสดงผลภาษาไทย

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const events = require('events'); 
const bcrypt = require('bcrypt');
const conn = require('./connect');

app.use(cors());

events.EventEmitter.defaultMaxListeners = 20;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

app.use(require("./controllers/PackageController"));
app.use(require("./controllers/MemberController"));
app.use(require("./controllers/ProductController"));
app.use(require("./controllers/ProductImageController"));
app.use(require("./controllers/UserController"));
app.use(require("./controllers/BillSaleController"));
app.use(require("./controllers/StockController"));
app.use( require("./controllers/DashboardController"));
app.use( require('./controllers/CustomerControllers'));
app.use( require('./controllers/RewardController'));
app.use( require('./controllers/CategoryController'));

const init = async () => {
  try {
    console.log('เริ่มต้นการเชื่อมต่อฐานข้อมูล...');
    
    // นำเข้าโมเดลทั้งหมด
    const BillSaleModel = require('./models/BillSaleModel');
    const BillSaleDetailModel = require('./models/BillSaleDetailModel');
    const RewardModel = require('./models/RewardModel');
    const CustomerModel = require('./models/CustomerModel');
    const PointTransactionModel = require('./models/PointTransactionModel');
    const ProductModel = require('./models/ProductModel');
    
    // นำเข้าความสัมพันธ์ระหว่างโมเดล
    require('./models/associations');
    
    console.log('กำลังซิงค์ตารางฐานข้อมูลตามลำดับ...');
    
    try {
      // ซิงค์ตามลำดับ - ตารางหลักก่อน
      await CustomerModel.sync({ alter: true });
      console.log('ซิงค์ CustomerModel สำเร็จ');
      
      await ProductModel.sync({ alter: true });
      console.log('ซิงค์ ProductModel สำเร็จ');
      
      await BillSaleModel.sync({ alter: true });
      console.log('ซิงค์ BillSaleModel สำเร็จ');
      
      // จากนั้นตารางที่พึ่งพาตารางอื่น
      await PointTransactionModel.sync({ alter: true });
      console.log('ซิงค์ PointTransactionModel สำเร็จ');
      
      await RewardModel.sync({ alter: true });
      console.log('ซิงค์ RewardModel สำเร็จ');
      
      await BillSaleDetailModel.sync({ alter: true });
      console.log('ซิงค์ BillSaleDetailModel สำเร็จ');
      
      console.log('ซิงค์ทุกตารางเสร็จสมบูรณ์');
    } catch (syncError) {
      console.error('เกิดข้อผิดพลาดในการซิงค์ตาราง:', syncError);
      throw syncError;
    }

    app.listen(port, () => {
      // ใช้สัญลักษณ์เส้นคั่นให้ชัดเจนขึ้น
      console.log('===================================');
      console.log(`✓ แอพเริ่มทำงานที่พอร์ต ${port} สำเร็จ`);
      console.log('===================================');
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเริ่มต้นฐานข้อมูล:', error);
    process.exit(1);
  }
};

init();
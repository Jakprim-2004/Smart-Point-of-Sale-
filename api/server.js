 

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
    console.log('Starting database connection...');
    
    // นำเข้าโมเดลทั้งหมด
    const BillSaleModel = require('./models/BillSaleModel');
    const BillSaleDetailModel = require('./models/BillSaleDetailModel');
    const RewardModel = require('./models/RewardModel');
    const CustomerModel = require('./models/CustomerModel');
    const PointTransactionModel = require('./models/PointTransactionModel');
    const ProductModel = require('./models/ProductModel');
    
    // นำเข้าความสัมพันธ์ระหว่างโมเดล
    require('./models/associations');
    
    console.log('Syncing database tables in sequence...');
    
    try {
      // ซิงค์ตามลำดับ - ตารางหลักก่อน
      await CustomerModel.sync({ alter: true });
      console.log('SyncCustomerModel Complete');
      
      await ProductModel.sync({ alter: true });
      console.log('Sync ProductModel Complete');
      
      await BillSaleModel.sync({ alter: true });
      console.log('Sync BillSaleModel Complete');
      
      // จากนั้นตารางที่พึ่งพาตารางอื่น
      await PointTransactionModel.sync({ alter: true });
      console.log('Sync PointTransactionModel Complete');
      
      await RewardModel.sync({ alter: true });
      console.log('Sync RewardModel Complete');
      
      await BillSaleDetailModel.sync({ alter: true });
      console.log('Sync BillSaleDetailModel Complete');
      
      console.log('Sync all tables completed successfully');
    } catch (syncError) {
      console.error('Error syncing tables:', syncError);
      throw syncError;
    }

    app.listen(port, () => {
      // ใช้สัญลักษณ์เส้นคั่นให้ชัดเจนขึ้น
      console.log('===================================');
      console.log(`✓ App running successfully on port ${port}`);
      console.log('===================================');
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

init();
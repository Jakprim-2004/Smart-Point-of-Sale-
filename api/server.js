const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const events = require('events'); 
const bcrypt = require('bcrypt');

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
app.use(require("./controllers/BankController"));
app.use(require("./controllers/AdminController"));
app.use(require("./controllers/ChangePackageController"));
app.use( require("./controllers/DashboardController"));
app.use( require('./controllers/ReportController'));
app.use( require('./controllers/CustomerControllers'));
app.use( require('./controllers/RewardController'));


const init = async () => {
  try {
    // Import all models that need to be synced
    const BillSaleModel = require('./models/BillSaleModel');
    const BillSaleDetailModel = require('./models/BillSaleDetailModel');
    const RewardModel = require('./models/RewardModel');
    
    
    // Require associations after models are loaded
    require('./models/associations');

    // Sync models in correct order
    await RewardModel.sync({ alter: true });
    
    await BillSaleModel.sync({ alter: true });
    await BillSaleDetailModel.sync({ alter: true });

    app.listen(port, () => {
      console.log(`Example app listening on port `, port);
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

init();
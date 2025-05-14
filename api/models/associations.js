const ProductModel = require('./ProductModel');
const StockModel = require('./StockModel');
const BillSaleDetailModel = require('./BillSaleDetailModel'); 
const BillSaleModel = require('./BillSaleModel');
const UserModel = require('./UserModel');
const CustomerModel = require('./CustomerModel');
const PointTransactionModel = require('./PointTransactionModel');

// การเชื่อมโยงระหว่าง Product และ Stock
ProductModel.hasMany(StockModel, { foreignKey: 'productId' });
StockModel.belongsTo(ProductModel, { foreignKey: 'productId' });

// การเชื่อมโยงระหว่าง Product และ BillSaleDetail
ProductModel.hasMany(BillSaleDetailModel, { 
    foreignKey: 'productId',
    sourceKey: 'id'
});
BillSaleDetailModel.belongsTo(ProductModel, { 
    foreignKey: 'productId',
    targetKey: 'id'
});

// Add BillSale and BillSaleDetail associations 
BillSaleModel.hasMany(BillSaleDetailModel, { 
  foreignKey: 'billSaleId',
  as: 'details'
});
BillSaleDetailModel.belongsTo(BillSaleModel, { 
  foreignKey: 'billSaleId',
  as: 'billSale'
});

// Add User and Member association
const MemberModel = require('./MemberModel');
UserModel.belongsTo(MemberModel, { 
    foreignKey: 'userId',
    targetKey: 'id', 
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
MemberModel.hasMany(UserModel, { 
    foreignKey: 'userId',
    sourceKey: 'id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

// Add Customer and BillSale associations
BillSaleModel.belongsTo(CustomerModel, { foreignKey: 'customerId' });
CustomerModel.hasMany(BillSaleModel, { foreignKey: 'customerId' });

// Add Customer and PointTransaction associations
CustomerModel.hasMany(PointTransactionModel, { foreignKey: 'customerId' });
PointTransactionModel.belongsTo(CustomerModel, { foreignKey: 'customerId' });


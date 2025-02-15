const express = require('express')
const app = express()
const PackageModel = require('../models/PackageModel');
const MemberModel = require('../models/MemberModel');
const Service = require('./Service');


app.get('/package/list', async (req, res) => {
    try {
        const results = await PackageModel.findAll({
            order: ['price']
        });
        res.send({ results: results });
    } catch (e) {
        res.send({ message: e.message });
    }
});

app.post('/package/memberRegister', async (req, res) => {
    try {
        const result = await MemberModel.create(req.body);
        
        res.send({ message: 'success', result: result });
    } catch (e) {
        res.send({ message: e.message });
    }
})

app.get('/package/countBill', Service.isLogin, async (req, res) => {
    try {
        const { Sequelize } = require('sequelize');
        const Op = Sequelize.Op;
        const BillSaleModel = require('../models/BillSaleModel');
        const myDate = new Date();
        const m = myDate.getMonth() + 1;

        const results = await BillSaleModel.findAll({
            where: {
                userId: Service.getMemberId(req),
                [Op.and]: [
                    Sequelize.fn('EXTRACT(MONTH from "createdAt") = ', m),
                ],
            }
        });

        res.send({ totalBill: results.length });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
})



module.exports = app;
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const service = require("./Service");

// Get all reports
router.get('/reportUse', async (req, res) => {
    try {
        const reports = await Report.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).send(reports);
    } catch (e) {
        res.status(500).send({message: e.message});
    }
});

// Create new report
router.post('/reportUse', service.isLogin, async (req, res) => {
    try {
        const payload = {
            contactName: req.body.firstName,
            phoneNumber: req.body.phoneNumber,
            subject: req.body.subject,
            message: req.body.message,
            status: 'pending'
        };

        const report = await Report.create(payload);
        res.send({ message: "success", result: report });
    } catch (error) {
        res.status(500).send({ 
            message: error.message,
            errors: error.errors?.map(e => e.message)
        });
    }
});

// Update report status
router.put('/reportUse/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;
        
        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).send({message: 'Report not found'});
        }

        await report.update({
            status,
            response,
            resolvedAt: status === 'completed' ? new Date() : null
        });

        res.status(200).send({message: 'success', report});
    } catch (e) {
        res.status(500).send({message: e.message});
    }
});

// Delete report
router.delete('/reportUse/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findByPk(id);
        
        if (!report) {
            return res.status(404).send({message: 'Report not found'});
        }

        await report.destroy();
        res.status(200).send({message: 'success'});
    } catch (e) {
        res.status(500).send({message: e.message});
    }
});

// Get report statistics
router.get('/reportUse/stats', async (req, res) => {
    try {
        const stats = await Report.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        });
        res.status(200).send(stats);
    } catch (e) {
        res.status(500).send({message: e.message});
    }
});

module.exports = router;

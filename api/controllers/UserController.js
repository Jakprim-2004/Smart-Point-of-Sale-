const express = require('express')
const app = express();
const Service = require('./Service')
const UserModel = require('../models/UserModel')
const MemberModel = require('../models/MemberModel'); // Add this import
const jwt = require('jsonwebtoken'); // Add this import

app.get('/user/list', Service.isLogin, Service.ownerOnly, async (req, res) => {
    try {
        const results = await UserModel.findAll({
            where: {
                userId: Service.getMemberId(req)
            },
            attributes: ['id', 'level', 'name', 'usr'],
            order: [['id', 'DESC']]
        });
        res.send({ message: 'success', results: results });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
})
app.post('/user/insert', Service.isLogin, Service.ownerOnly, async (req, res) => {
    try {
        let payload = req.body;
        payload.userId = Service.getMemberId(req);

        await UserModel.create(payload);
        res.send({ message: 'success' });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
})
app.delete('/user/delete/:id', Service.isLogin, Service.ownerOnly, async (req, res) => {
    try {
        await UserModel.destroy({
            where: {
                id: req.params.id
            }
        });
        res.send({ message: 'success' });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
})
app.post('/user/edit', Service.isLogin, Service.ownerOnly, async (req, res) => {
    try {
        let payload = req.body;
        payload.userId = Service.getMemberId(req);

        await UserModel.update(payload, {
            where: {
                id: req.body.id
            }
        })
        res.send({ message: 'success' });
    } catch (e) {
        res.statusCode = 500;
        res.send({ message: e.message });
    }
})

// New employee signin endpoint with better error handling
app.post('/user/signin', async (req, res) => {
    try {
        // First find user with credentials
        const user = await UserModel.findOne({
            where: {
                usr: req.body.usr,
                pwd: req.body.pwd
            },
            include: {
                model: MemberModel,
                required: false // Optional join to check association
            }
        });

        // Debug logging
        console.log('Found user:', JSON.stringify(user, null, 2));

        // Check user exists
        if (!user) {
            res.status(401).send({ message: 'Invalid username or password' });
            return;
        }

        // Verify store association
        const member = await MemberModel.findByPk(user.userId);
        if (!member) {
            res.status(401).send({ message: 'User not properly associated with a store' });
            return;
        }

        // Define allowed actions based on role
        const allowedActions = {
            'owner': ['all'],
            'employee': ['sale', 'stock', 'reportIssues']
        };

        // Create JWT token with employee info
        let token = jwt.sign({ 
            id: user.userId, // Store owner's ID
            employeeId: user.id, // Employee's ID
            level: user.level, // Employee's role
            allowedActions: allowedActions[user.level] || []
        }, process.env.secret);
        
        // Send success response with user info
        res.send({ 
            token: token, 
            message: 'success',
            userInfo: {
                name: user.name,
                level: user.level,
                store: member.firstName || member.name,
                allowedActions: allowedActions[user.level] || []
            }
        });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).send({ message: e.message });
    }
});

module.exports = app;

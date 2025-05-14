const express = require("express");
const MemberModel = require("../models/MemberModel");
const { Op } = require("sequelize");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const service = require("./Service");
const { encryptPassword, comparePassword } = require('../utils/encryption');

app.post("/member/check-duplicate", async (req, res) => {
  try {
    const { email, phone } = req.body;
    let whereClause = {};
    
    if (email) {
      whereClause.email = email;
    }
    if (phone) {
      whereClause.phone = phone;
    }

    const existingMember = await MemberModel.findOne({
      where: whereClause
    });

    res.send({
      isDuplicate: !!existingMember,
      message: existingMember ? 
        `${email ? 'อีเมล' : 'เบอร์โทรศัพท์'}นี้มีผู้ใช้งานแล้ว` : 
        'สามารถใช้งานได้'
    });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

app.post("/member/signin", async (req, res) => {
  try {
    const searchCriteria = {};
    if (req.body.email) {
      searchCriteria.email = req.body.email;
    }
    if (req.body.phone) {
      searchCriteria.phone = req.body.phone;
    }

    const member = await MemberModel.findOne({
      where: {
        [Op.or]: [searchCriteria]
      }
    });

    if (member) {
      
      const validPassword = await comparePassword(req.body.password, member.pass);
      if (validPassword) {
        let token = jwt.sign({ id: member.id }, process.env.secret);
        res.send({ token: token, message: "success" });
      } else {
        res.statusCode = 401;
        res.send({ message: "รหัสผ่านไม่ถูกต้อง" });
      }
    } else {
      res.statusCode = 401;
      res.send({ message: "ไม่พบบัญชีผู้ใช้" });
    }
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

app.post("/member/register", async (req, res) => {
  try {
    const encryptedPassword = await encryptPassword(req.body.password);
    
    const payload = {
      packageId: req.body.packageId,
      email: req.body.email,
      phone: req.body.phone,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      pass: encryptedPassword, // Store encrypted password
    };

    const member = await MemberModel.create(payload);
    res.send({ message: "success", result: member });
  } catch (e) {
    res.statusCode = 500; 
    res.send({ message: e.message });
  }
});

app.get("/member/info", service.isLogin, async (req, res, next) => {
  try {
    MemberModel.belongsTo(PackageModel);

    const payLoad = jwt.decode(service.getToken(req));
    const member = await MemberModel.findByPk(payLoad.id, {
      attributes: [
        "id",
        "email",
        "firstName",
        "lastName",
        "phone",
      ],
      include: [
        {
          model: PackageModel,
          attributes: ["name", "bill_amount"],
        },
      ],
    });

    res.send({ result: member, message: "success" });
  } catch (e) {
    res.statusCode = 500;
    return res.send({ message: e.message });
  }
});

app.get("/member/list", service.isLogin, async (req, res) => {
  try {
    MemberModel.belongsTo(PackageModel, { foreignKey: 'packageId' });

    const results = await MemberModel.findAll({
      order: [["id", "DESC"]],
      attributes: [
        "id", 
        "firstName", 
        "lastName", 
        "email",
        "phone", 
        "createdAt"
      ],
      include: {
        model: PackageModel,
        attributes: ["id", "name", "bill_amount", "price"],
      },
    });

    res.send({ 
      message: "success", 
      results: results.map(member => ({
        ...member.toJSON(),
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim()
      }))
    });
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

module.exports = app;

const express = require("express");
const MemberModel = require("../models/MemberModel");
const { Op } = require("sequelize");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const service = require("./Service");
const PackageModel = require("../models/PackageModel");

app.post("/member/signin", async (req, res) => {
  try {
    // ตรวจสอบว่ามีการส่ง email หรือ phone มา
    const searchCriteria = {};
    if (req.body.email) {
      searchCriteria.email = req.body.email;
    }
    if (req.body.phone) {
      searchCriteria.phone = req.body.phone;
    }

    const member = await MemberModel.findOne({
      where: {
        [Op.and]: [
          { [Op.or]: [searchCriteria] },
          { pass: req.body.pass }
        ]
      }
    });

    if (member) {
      let token = jwt.sign({ id: member.id }, process.env.secret);
      res.send({ token: token, message: "success" });
    } else {
      res.statusCode = 401;
      res.send({ message: "not found" });
    }
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

app.post("/member/register", async (req, res) => {
  try {
    const payload = {
      packageId: req.body.packageId,
      email: req.body.email,
      phone: req.body.phone, 
      name: req.body.name,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      pass: req.body.password,
      address: req.body.address.fullAddress,
      province: req.body.address.province,
      district: req.body.address.district,
      subDistrict: req.body.address.subDistrict,
      postalCode: req.body.address.postalCode,
      status: req.body.status
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
      attributes: ["id", "name", "phone","firstName"],
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

app.put("/member/changeProfile", service.isLogin, async (req, res) => {
  try {
    const memberId = service.getMemberId(req);
    const payload = {
      name: req.body.memberName,
    };
    const result = await MemberModel.update(payload, {
      where: {
        id: memberId,
      },
    });

    res.send({ message: "success", result: result });
  } catch (e) {
    res.statusCode = 500;
    return res.send({ message: e.message });
  }
});

app.get("/member/list", service.isLogin, async (req, res) => {
  try {
    const PackageModel = require("../models/PackageModel");
    MemberModel.belongsTo(PackageModel);

    const results = await MemberModel.findAll({
      order: [["id", "DESC"]],
      attributes: ["id", "name", "phone", "createdAt"],
      include: {
        model: PackageModel,
      },
    });

    res.send({ message: "success", results: results });
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

module.exports = app;

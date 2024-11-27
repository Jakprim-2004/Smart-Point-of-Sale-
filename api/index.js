
const express = require("express");
const Report = require("../models/Report");
const service = require("./Service");
const app = express();

app.post("/reportUse", service.isLogin, async (req, res) => {
  try {
    const payload = {
      contactName: req.body.firstName,
      phoneNumber: req.body.phoneNumber,
      subject: req.body.subject,
      message: req.body.message,
    };

    const report = await Report.create(payload);
    res.send({ message: "success", result: report });
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

app.get("/reportUse/list", service.isLogin, async (req, res) => {
  try {
    const reports = await Report.findAll({
      order: [["id", "DESC"]],
    });
    res.send({ message: "success", results: reports });
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

app.put("/reportUse/update/:id", service.isLogin, async (req, res) => {
  try {
    const reportId = req.params.id;
    const payload = {
      status: req.body.status,
      response: req.body.response,
    };

    const result = await Report.update(payload, {
      where: {
        id: reportId,
      },
    });

    res.send({ message: "success", result: result });
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

module.exports = app;
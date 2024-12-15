const express = require("express");
const app = express();
const Service = require("./Service");
const UserModel = require("../models/UserModel");
const MemberModel = require("../models/MemberModel");
const PackageModel = require("../models/PackageModel");
const jwt = require("jsonwebtoken");

// ดึงรายการผู้ใช้ทั้งหมด (เฉพาะเจ้าของร้านเท่านั้น)
app.get("/user/list", Service.isLogin, Service.ownerOnly, async (req, res) => {
  try {
    const results = await UserModel.findAll({
      where: {
        userId: Service.getMemberId(req),
      },
      attributes: ["id", "level", "name", "usr"],
      order: [["id", "DESC"]],
    });
    res.send({ message: "success", results: results });
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

// เพิ่มผู้ใช้ใหม่ (เฉพาะเจ้าของร้านเท่านั้น)
app.post(
  "/user/insert",
  Service.isLogin,
  Service.ownerOnly,
  async (req, res) => {
    try {
      let payload = req.body;
      payload.userId = Service.getMemberId(req);

      await UserModel.create(payload);
      res.send({ message: "success" });
    } catch (e) {
      res.statusCode = 500;
      res.send({ message: e.message });
    }
  }
);

// ลบผู้ใช้ตาม ID (เฉพาะเจ้าของร้านเท่านั้น)
app.delete(
  "/user/delete/:id",
  Service.isLogin,
  Service.ownerOnly,
  async (req, res) => {
    try {
      await UserModel.destroy({
        where: {
          id: req.params.id,
        },
      });
      res.send({ message: "success" });
    } catch (e) {
      res.statusCode = 500;
      res.send({ message: e.message });
    }
  }
);

// แก้ไขข้อมูลผู้ใช้ (เฉพาะเจ้าของร้านเท่านั้น)
app.post("/user/edit", Service.isLogin, Service.ownerOnly, async (req, res) => {
  try {
    let payload = req.body;
    payload.userId = Service.getMemberId(req);

    await UserModel.update(payload, {
      where: {
        id: req.body.id,
      },
    });
    res.send({ message: "success" });
  } catch (e) {
    res.statusCode = 500;
    res.send({ message: e.message });
  }
});

// เข้าสู่ระบบสำหรับพนักงาน
app.post("/user/signin", async (req, res) => {
  try {
    const user = await UserModel.findOne({
      where: {
        usr: req.body.usr,
        pwd: req.body.pwd,
      },
      include: {
        model: MemberModel,
        required: false,
      },
    });

    if (!user) {
      res.status(401).send({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      return;
    }

    const member = await MemberModel.findByPk(user.userId);
    if (!member) {
      res
        .status(401)
        .send({ message: "ผู้ใช้ไม่ได้เชื่อมโยงกับร้านค้าอย่างถูกต้อง" });
      return;
    }

    // กำหนดสิทธิ์
    const allowedActions = {
      owner: ["all"],
      employee: ["sale", "stock", "reportIssues"],
    };

    // สร้าง token JWT พร้อมข้อมูลพนักงาน
    let token = jwt.sign(
      {
        id: user.userId,
        employeeId: user.id,
        level: user.level,
        allowedActions: allowedActions[user.level] || [],
      },
      process.env.secret
    );

    res.send({
      token: token,
      message: "success",
      userInfo: {
        name: user.name,
        level: user.level,
        store: member.firstName || member.name,
        allowedActions: allowedActions[user.level] || [],
      },
    });
  } catch (e) {
    console.error("ข้อผิดพลาดในการเข้าสู่ระบบ:", e);
    res.status(500).send({ message: e.message });
  }
});

// ดึงข้อมูลพนักงาน
app.get("/user/info", Service.isLogin, async (req, res) => {
  try {
    const employeeId = Service.getEmployeeId(req);

    // ความสัมพันธ์ MemberModel และ PackageModel
    MemberModel.belongsTo(PackageModel, { foreignKey: "packageId" });

    const user = await UserModel.findOne({
      where: { id: employeeId },
      include: [
        {
          model: MemberModel,
          include: [
            {
              model: PackageModel,
              attributes: ["name", "bill_amount"],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).send({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    res.send({
      message: "success",
      result: {
        name: user.name,
        package: user.member.package,
      },
    });
  } catch (e) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", e);
    res.status(500).send({ message: e.message });
  }
});

module.exports = app;

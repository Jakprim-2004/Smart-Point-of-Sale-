
const BillSaleModel = require('../models/BillSaleModel');

const pauseBill = async (req, res) => {
  try {
    const { id, billSaleDetails } = req.body;

    
    if (!id || !billSaleDetails || billSaleDetails.length === 0) {
      return res.status(400).send({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    // อัปเดตสถานะบิลเป็น "paused"
    await BillSaleModel.update(
      { status: 'paused', items: JSON.stringify(billSaleDetails) },
      { where: { id } }
    );

    res.send({ message: "success" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  pauseBill,
};
import { useEffect, useRef, useState } from "react";
import Template from "../components/Template";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import Modal from "../components/Modal";
import * as dayjs from "dayjs";
import PrintJS from "print-js";
import Barcode from "../components/Barcode";
import { QRCodeSVG } from "qrcode.react";
import generatePayload from "promptpay-qr";
import "../styles/Sale.css";


function Sale() {
  const [products, setProducts] = useState([]);
  const [, setBillSale] = useState({});
  const [currentBill, setCurrentBill] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [item, setItem] = useState({});
  const [inputMoney, setInputMoney] = useState(0);
  const [lastBill, setLastBill] = useState({});
  const [billToday, setBillToday] = useState([]);
  const [selectedBill, setSelectedBill] = useState({});
  const [memberInfo, setMemberInfo] = useState({});
  const [sumTotal, setSumTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter] = useState("ทั้งหมด");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [heldBills, setHeldBills] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const promptPayNumber = "0656922937"; // หมายเลขพร้อมเพย์
  const [totalBill, setTotalBill] = useState(0);
  const [billAmount, setBillAmount] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false);
  const [showEndSaleModal, setShowEndSaleModal] = useState(false);
  const [showBillTodayModal, setShowBillTodayModal] = useState(false);
  const [showBillDetailModal, setShowBillDetailModal] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [discountFromPoints, setDiscountFromPoints] = useState(0);

  const saleRef = useRef();
  const searchInputRef = useRef();

  useEffect(() => {
    fetchData();
    openBill();
    fetchBillSaleDetail();
    fetchBillLimitInfo();
    loadCustomers();

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const fetchBillSaleDetail = async () => {
    try {
      await axios
        .get(config.api_path + "/billSale/currentBillInfo", config.headers())
        .then((res) => {
          if (res.data.results !== null) {
            setCurrentBill(res.data.results);
            sumTotalPrice(res.data.results.billSaleDetails);
          }
        });
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const calculateVAT = (amount, vatRate) => {
    return amount * (vatRate / 100);
  };

  const sumTotalPrice = (billSaleDetails) => {
    let sum = 0;
    const vatRate = 7; // อัตรา VAT 7%

    for (let i = 0; i < billSaleDetails.length; i++) {
      const item = billSaleDetails[i];
      const qty = parseInt(item.qty);
      const price = parseInt(item.price);

      sum += qty * price;
    }

    const vatAmount = calculateVAT(sum, vatRate);
    const totalWithVAT = sum + vatAmount;

    setTotalPrice(totalWithVAT);
  };

  const openBill = async () => {
    try {
      const res = await axios.get(
        config.api_path + "/billSale/openBill",
        config.headers()
      );
      if (res.data.message === "success") {
        setBillSale(res.data.result);
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const handlePauseBill = async (bill) => {
    if (!bill.billSaleDetails || bill.billSaleDetails.length === 0) {
      Swal.fire({
        title: "ไม่สามารถพักบิลได้",
        text: "ไม่มีสินค้าในตะกร้า",
        icon: "warning",
      });
      return;
    }

    try {
      const res = await axios.post(
        config.api_path + "/billSale/pauseBill",
        { id: bill.id, billSaleDetails: bill.billSaleDetails },
        config.headers()
      );

      if (res.data.message === "success") {
        Swal.fire({
          title: "พักบิล",
          text: "พักบิลสำเร็จแล้ว",
          icon: "success",
          timer: 1000,
        });
        const updatedHeldBills = [...heldBills, bill];
        setHeldBills(updatedHeldBills);
        localStorage.setItem("heldBills", JSON.stringify(updatedHeldBills));
        setCurrentBill({});
        setTotalPrice(0);
        setInputMoney(0);
        setMemberInfo({});
        setLastBill({});
        setSumTotal(0);

        // เปิดบิลใหม่
        openBill();
        fetchBillSaleDetail();

        let btns = document.getElementsByClassName("btnClose");
        for (let i = 0; i < btns.length; i++) btns[i].click();

        if (saleRef.current) {
          saleRef.current.refreshCountBill();
        }
      }
    } catch (e) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchData = async () => {
    try {
      const productResponse = await axios.get(
        config.api_path + "/product/listForSale",
        config.headers()
      );
      if (productResponse.data.message === "success") {
        const products = productResponse.data.results;

        const stockResponse = await axios.get(
          config.api_path + "/reportStock",
          config.headers()
        );
        if (stockResponse.data.message === "success") {
          const stockData = stockResponse.data.results;

          const updatedProducts = products.map((product) => {
            const stockItem = stockData.find(
              (stock) => stock.productId === product.id
            );
            return {
              ...product,
              remainingQty: stockItem ? stockItem.totalQty : 0,
            };
          });

          setProducts(updatedProducts);
        }
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const handleDelete = (item) => {
    Swal.fire({
      title: "ยืนยันการลบ",
      text: "คุณต้องการลบรายการนี้ใช่หรือไม่",
      icon: "question",
      showCancelButton: true,
      showConfirmButton: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await axios
            .delete(
              config.api_path + "/billSale/deleteItem/" + item.id,
              config.headers()
            )
            .then((res) => {
              if (res.data.message === "success") {
                fetchBillSaleDetail();
                fetchData();
              }
            });
        } catch (e) {
          Swal.fire({
            title: "error",
            text: e.message,
            icon: "error",
          });
        }
      }
    });
  };

  const handleEndSale = () => {
    if (!currentBill.billSaleDetails || currentBill.billSaleDetails.length === 0) {
        Swal.fire({
            title: "ไม่สามารถจบการขายได้",
            text: "ไม่มีสินค้าในตะกร้า",
            icon: "warning",
        });
        return;
    }

    Swal.fire({
        title: "จบการขาย",
        text: "ยืนยันจบการขาย",
        icon: "question",
        showCancelButton: true,
        showConfirmButton: true,
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const vatRate = 7;
                const priceAfterDiscount = totalPrice - discountFromPoints;
                const vatAmount = calculateVAT(priceAfterDiscount, vatRate);
                const totalWithVAT = priceAfterDiscount + vatAmount;

                // สร้างข้อมูลการใช้แต้ม (ถ้ามี)
                const pointTransaction = pointsToRedeem > 0 ? {
                    customerId: selectedCustomer.id,
                    points: pointsToRedeem,
                    transactionType: 'DISCOUNT',
                    description: `ใช้แต้มส่วนลด ${pointsToRedeem} แต้ม สำหรับบิลเลขที่ #${currentBill.id} (ส่วนลด ${discountFromPoints} บาท)`
                } : null;

                const paymentData = {
                    method: paymentMethod,
                    amount: totalWithVAT,
                    vatAmount: vatAmount,
                    billSaleDetails: currentBill.billSaleDetails,
                    customerId: selectedCustomer?.id || null,
                    pointTransaction: pointTransaction, // เพิ่มข้อมูล point transaction
                    discountFromPoints: discountFromPoints // เพิ่มข้อมูลส่วนลด
                };

                const res = await axios.post(
                    config.api_path + "/billSale/endSale",
                    paymentData,
                    config.headers()
                );

                if (res.data.message === "success") {
                    Swal.fire({
                        title: "จบการขาย",
                        text: "จบการขายสำเร็จแล้ว",
                        icon: "success",
                        timer: 1000,
                    });

                    // รีเซ็ตค่าต่างๆ
                    setCurrentBill({});
                    setTotalPrice(0);
                    setInputMoney(0);
                    setMemberInfo({});
                    setLastBill({});
                    setSumTotal(0);
                    setSelectedCustomer(null);

                    // เรียก API เพื่อรีเฟรชข้อมูล
                    await Promise.all([
                        openBill(),
                        fetchBillSaleDetail(),
                        fetchData()
                    ]);

                    // ปิด Modal
                    const modalEndSale = document.getElementById('modalEndSale');
                    if (modalEndSale) {
                        const modalBackdrop = document.querySelector('.modal-backdrop');
                        if (modalBackdrop) {
                            modalBackdrop.parentNode.removeChild(modalBackdrop);
                        }
                        modalEndSale.style.display = 'none';
                        document.body.classList.remove('modal-open');
                    }
                }
            } catch (error) {
                console.error('End sale error:', error);
                Swal.fire({
                    title: "เกิดข้อผิดพลาด",
                    text: error.response?.data?.error || error.message,
                    icon: "error",
                });
            }
        }
    });
};

  const handleBillToday = async () => {
    try {
      await axios
        .get(config.api_path + "/billSale/billToday", config.headers())
        .then((res) => {
          if (res.data.message === "success") {
            setBillToday(res.data.results);
          }
        })
        .catch((err) => {
          throw err.response.data;
        });
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const handlePrint = async () => {
    try {
      const [memberRes, billRes] = await Promise.all([
        axios.get(config.api_path + "/member/info", config.headers()),
        axios.get(config.api_path + "/billSale/lastBill", config.headers()),
      ]);

      if (memberRes.data.message === "success") {
        setMemberInfo(memberRes.data.result);
      }

      if (
        billRes.data.message === "success" &&
        billRes.data.result.length > 0
      ) {
        const currentBill = billRes.data.result[0];
        setLastBill(currentBill);

        // คำนวณยอดรวม
        let sum = currentBill.billSaleDetails.reduce((acc, item) => {
          return acc + parseInt(item.qty) * parseInt(item.price);
        }, 0);

        const vatAmount = calculateVAT(sum, 7);
        const totalWithVAT = sum + vatAmount;
        setSumTotal(totalWithVAT);

        await new Promise((resolve) => setTimeout(resolve, 100));

        // พิมพ์บิล
        const slip = document.getElementById("slip");
        if (slip) {
          slip.style.display = "block";
          await PrintJS({
            printable: "slip",
            type: "html",
            targetStyles: ["*"],
            documentTitle: "Receipt",
            maxWidth: 300,
            onLoadingEnd: () => {
              slip.style.display = "none";
            },
          });
        }
      } else {
        throw new Error("ไม่พบข้อมูลบิลล่าสุด");
      }
    } catch (error) {
      console.error("Print error:", error);
      Swal.fire({
        title: "พิมพ์บิลไม่สำเร็จ",
        text: error.message,
        icon: "error",
      });
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredProducts = products.filter(
    (product) =>
      (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (categoryFilter === "ทั้งหมด" || product.category === categoryFilter)
  );

  const handleProductClick = (product) => {
    if (totalBill >= billAmount) {
      Swal.fire({
        title: "ไม่สามารถขายได้",
        text: "คุณได้ใช้จำนวนบิลครบตามแพ็คเกจแล้ว กรุณาอัพเกรดแพ็คเกจ",
        icon: "warning",
      });
      return;
    }

    if (product.remainingQty <= 0) {
      Swal.fire({
        title: "สินค้าหมด",
        text: "สินค้าในสต๊อกหมด",
        icon: "warning",
      });
      return;
    }

    setItem({ ...product, qty: 1 });
    // เปลี่ยนจากการใช้ ID button เป็นการควบคุม Modal โดยตรง
    setShowQtyModal(true);
  };

  const handleAddToBill = async () => {
    const qty = parseInt(item.qty, 10);
    if (isNaN(qty) || qty <= 0 || qty > item.remainingQty) {
      Swal.fire({
        title: "จำนวนไม่ถูกต้อง",
        text: "กรุณากรอกจำนวนที่ถูกต้อง",
        icon: "warning",
      });
      return;
    }

    try {
      await axios
        .post(
          config.api_path + "/billSale/sale",
          { ...item, qty },
          config.headers()
        )
        .then((res) => {
          if (res.data.message === "success") {
            fetchData();

            item.remainingQty -= qty;
            fetchBillSaleDetail();
            let btns = document.getElementsByClassName("btnClose");
            for (let i = 0; i < btns.length; i++) btns[i].click();

            // เปิดบิลหลังจากเพิ่มสินค้าลงในบิลสำเร็จ
            openBill();
          }
        });
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const handleRetrieveBill = async (bill) => {
    try {
      const res = await axios.post(
        config.api_path + "/billSale/retrieveBill",
        { id: bill.id },
        config.headers()
      );

      if (res.data.message === "success") {
        setCurrentBill(bill);
        sumTotalPrice(bill.billSaleDetails);
        setHeldBills(heldBills.filter((b) => b.id !== bill.id));

        Swal.fire({
          title: "เรียกคืนบิล",
          text: "เรียกคืนบิลสำเร็จแล้ว",
          icon: "success",
          timer: 1000,
        });
      }
    } catch (e) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: e.message,
        icon: "error",
      });
    }
  };

  const generateQRCode = () => {
    const amount = parseFloat(totalPrice);
    const payload = generatePayload(promptPayNumber, { amount });
    return payload;
  };

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setPaymentMethod(method);
    setShowQR(method === "PromptPay");
  };

  const fetchBillLimitInfo = async () => {
    try {
      const res = await axios.get(
        config.api_path + "/member/info",
        config.headers()
      );
      if (res.data.message === "success") {
        setBillAmount(res.data.result.package.bill_amount);

        const billsRes = await axios.get(
          config.api_path + "/package/countBill",
          config.headers()
        );
        if (billsRes.data.totalBill !== undefined) {
          setTotalBill(billsRes.data.totalBill);
        }
      }
    } catch (error) {
      console.error("Error fetching bill limit info:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await axios.get(
        config.api_path + "/customers", 
        config.headers()
      );
      if (response.data.result) {
        // แปลงข้อมูล id เป็น number
        const formattedCustomers = response.data.result.map(customer => ({
          ...customer,
          id: Number(customer.id)
        }));
        setCustomers(formattedCustomers);
        console.log("Loaded customers:", formattedCustomers);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const handlePointsRedemption = (points) => {
    const maxPoints = selectedCustomer ? selectedCustomer.points : 0;
    const maxPointsByPrice = Math.floor(totalPrice / 10); // จำนวนแต้มสูงสุดที่ใช้ได้ตามราคาสินค้า
    const maxAllowedPoints = Math.min(maxPoints, maxPointsByPrice);
    
    const validPoints = Math.min(Math.max(0, points), maxAllowedPoints);
    
    if (points > maxAllowedPoints) {
      Swal.fire({
        title: "ไม่สามารถใช้แต้มได้",
        text: `สามารถใช้แต้มได้สูงสุด ${maxAllowedPoints} แต้ม ตามราคาสินค้า`,
        icon: "warning"
      });
    }
    
    setPointsToRedeem(validPoints);
    setDiscountFromPoints(validPoints * 10);
  };

  return (
    <>
      <Template ref={saleRef}>
        <div className="card shadow-lg border-0 rounded-lg">
          <div className="card-header bg-gradient-dark text-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5
                className="mb-0 font-weight-bold"
                style={{ fontSize: "1.5rem" }}
              >
                ขายสินค้า
              </h5>
              <div className="button-group">
                <button
                  onClick={() => handlePauseBill(currentBill)}
                  className="btn btn-success me-2"
                  style={{ fontSize: "1rem", padding: "10px 15px" }}
                  title="พักบิล"
                >
                  <i className="fa fa-shopping-basket me-2"></i>พักบิล
                </button>
                {/** ปุ่มสำหรับดูบิลที่พักไว้ */}
                <button
                  onClick={() => setShowHeldBillsModal(true)}
                  className="btn btn-warning me-2"
                  style={{ fontSize: "1rem", padding: "10px 15px" }}
                  title="ดูบิลที่พักไว้"
                >
                  <i className="fa fa-clipboard-list me-2"></i>บิลที่พักไว้
                </button>
                {/** ปุ่มสำหรับจบการขาย */}
                <button
                  onClick={() => setShowEndSaleModal(true)}
                  className="btn btn-success me-2"
                  style={{ fontSize: "1rem", padding: "10px 15px" }}
                  title="จบการขาย"
                >
                  <i className="fa fa-check me-2"></i>จบการขาย
                </button>

                
                

                {/** ปุ่มสำหรับพิมพ์บิลล่าสุด */}
                <button
                  onClick={handlePrint}
                  className="btn btn-primary"
                  style={{ fontSize: "1rem", padding: "10px 15px" }}
                  title="พิมพ์บิลล่าสุด"
                >
                  <i className="fa fa-print me-2"></i>พิมพ์บิลล่าสุด
                </button>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="row g-4">
              <div className="col-lg-9 col-md-8">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <input
                    type="text"
                    className="form-control form-control-lg search-input"
                    placeholder="🔍 ค้นหาสินค้า..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    ref={searchInputRef}
                  />
                </div>

                <div className="row g-4">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((item) => (
                      <div className="col-sm-6 col-md-4 col-lg-3" key={item.id}>
                        <div
                          className="card h-100 product-card"
                          onClick={() => handleProductClick(item)}
                        >
                          <div className="position-relative">
                            <img
                              src={`${config.api_path}/uploads/${item.productImages[0].imageName}`}
                              className="product-image"
                              alt={item.name}
                            />
                            <div
                              className="stock-badge"
                              style={{
                                background:
                                  item.remainingQty > 0
                                    ? "rgba(52, 211, 153, 0.9)"
                                    : "rgba(239, 68, 68, 0.9)",
                                color: "#ffffff",
                              }}
                            >
                              {item.remainingQty}
                            </div>
                          </div>

                          <div className="product-info">
                            <h6 className="fw-bold mb-2">{item.name} </h6>
                            <span
                              className="h5 mb-0"
                              style={{ color: "#2563eb" }}
                            >
                              ฿{parseInt(item.price).toLocaleString("th-TH")}
                            </span>
                            <div className="text-center mb-3">
                              <Barcode
                                value={item.barcode}
                                width={1}
                                height={40}
                                fontSize={12}
                                background="transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted w-100">ไม่มีสินค้า</p>
                  )}
                </div>
              </div>

              <div className="col-lg-3 col-md-4">
                <div className="position-sticky" style={{ top: "1rem" }}>
                  <div className="cart-container">
                    <div className="cart-header">
                      <div className="cart-total">
                        {totalPrice.toLocaleString("th-TH")} ฿
                      </div>
                      <div className="cart-label">รวม VAT 7%</div>
                    </div>

                    <div
                      className="cart-items"
                      style={{
                        maxHeight: "65vh",
                        overflowY: "auto",
                        padding: "5px",
                      }}
                    >
                      {currentBill?.billSaleDetails?.length > 0 ? (
                        currentBill.billSaleDetails.map((item) => (
                          <div key={item.id} className="cart-item">
                            <div className="d-flex align-items-center mb-2">
                              <div className="flex-grow-1">
                                <h6
                                  className="mb-0"
                                  style={{
                                    color: "#1e40af",
                                    fontWeight: "600",
                                  }}
                                >
                                  {item.product.name}
                                </h6>
                                <small className="text-muted">
                                  {item.barcode}
                                </small>
                              </div>
                              <span className="quantity-badge">{item.qty}</span>
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.9rem" }}
                                >
                                  {parseInt(item.price).toLocaleString("th-TH")}{" "}
                                  ฿ × {item.qty}
                                </span>
                              </div>
                              <div className="d-flex align-items-center">
                                <span
                                  className="me-3"
                                  style={{
                                    color: "#059669",
                                    fontWeight: "600",
                                    fontSize: "1.1rem",
                                  }}
                                >
                                  {(item.qty * item.price).toLocaleString(
                                    "th-TH"
                                  )}{" "}
                                  ฿
                                </span>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="delete-button"
                                  title="ลบรายการ"
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>
                            </div>

                            <div
                              className="progress mt-2"
                              style={{ height: "4px" }}
                            >
                              <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{
                                  width: `${
                                    (item.qty / item.product.remainingQty) * 100
                                  }%`,
                                  borderRadius: "2px",
                                }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5">
                          <i
                            className="fa fa-shopping-cart mb-3"
                            style={{
                              fontSize: "3rem",
                              color: "#cbd5e1",
                            }}
                          ></i>
                          <p className="text-muted mb-0">ไม่มีสินค้าในตะกร้า</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Template>

      <Modal
        show={showHeldBillsModal}
        onHide={() => setShowHeldBillsModal(false)}
        title="บิลที่พักไว้"
      >
        <div className="modal-body">
          {heldBills.length === 0 ? (
            <p className="text-center text-muted">ไม่มีบิลที่พักไว้</p>
          ) : (
            <ul className="list-group">
              {heldBills.map((bill, index) => (
                <li
                  key={index}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>บิล #{bill.id}</span>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRetrieveBill(bill)}
                  >
                    เรียกคืน
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <Modal
        show={showBillTodayModal}
        onHide={() => setShowBillTodayModal(false)}
        title="บิลวันนี้"
        modalSize="modal-lg"
      >
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th width="140px"></th>
              <th>เลขบิล</th>
              <th>วัน เวลาที่ขาย</th>
            </tr>
          </thead>
          <tbody>
            {billToday.length > 0
              ? billToday.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      <button
                        onClick={() => {
                          setSelectedBill(item);
                          setShowBillDetailModal(true);
                        }}
                        className="btn btn-primary"
                      >
                        <i className="fa fa-eye me-2"></i>
                        ดูรายการ
                      </button>
                    </td>
                    <td>{item.id}</td>
                    <td>{dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </Modal>

      <Modal 
        show={showQtyModal}
        onHide={() => setShowQtyModal(false)}
        title="ปรับจำนวน"
      >
        <div>
          <label>จำนวน</label>
          <input
            value={item.qty || ""}
            onChange={(e) => {
              const newQty = e.target.value;
              if (newQty === "") {
                setItem({ ...item, qty: "" });
              } else {
                const qtyNumber = parseInt(newQty, 10);
                if (isNaN(qtyNumber) || qtyNumber <= 0) {
                  setItem({ ...item, qty: 1 });
                } else if (qtyNumber > item.remainingQty) {
                  Swal.fire({
                    title: "จำนวนสินค้าเกิน",
                    text: "จำนวนสินค้าที่กรอกเกินจำนวนคงเหลือ",
                    icon: "warning",
                  });
                  setItem({ ...item, qty: item.remainingQty });
                } else {
                  setItem({ ...item, qty: qtyNumber });
                }
              }
            }}
            className="form-control"
          />

          <div className="mt-3">
            <button 
              onClick={() => {
                handleAddToBill();
                setShowQtyModal(false);
              }} 
              className="btn btn-primary"
            >
              <i className="fa fa-check me-2"></i>เพิ่มลงบิล
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        show={showEndSaleModal}
        onHide={() => setShowEndSaleModal(false)}
        title="จบการขาย"
      >
        <div>
          <div className="mb-3">
            <label className="form-label">เลือกลูกค้าเพื่อสะสมแต้ม (ไม่บังคับ)</label>
            <div className="input-group">
              <select 
                className="form-control"
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customerId = e.target.value;
                  if (customerId) {
                    const customer = customers.find(c => c.id === Number(customerId));
                    setSelectedCustomer(customer || null);
                    // รีเซ็ตค่าแต้มที่ใช้เมื่อเปลี่ยนลูกค้า
                    setPointsToRedeem(0);
                    setDiscountFromPoints(0);
                  } else {
                    setSelectedCustomer(null);
                    setPointsToRedeem(0);
                    setDiscountFromPoints(0);
                  }
                }}
              >
                <option value="">-- ไม่เลือก --</option>
                {customers && customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <button 
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setPointsToRedeem(0);
                    setDiscountFromPoints(0);
                  }}
                >
                  <i className="fa fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {selectedCustomer && (
            <>
              <div className="alert alert-muted mb-3">
                <h6 className="mb-1">ข้อมูลลูกค้า</h6>
                <div><strong>ชื่อ:</strong> {selectedCustomer.name}</div>
                <div><strong>เบอร์โทร:</strong> {selectedCustomer.phone}</div>
                <div><strong>แต้มสะสม:</strong> {selectedCustomer.points || 0} แต้ม</div>
               
                <div className="mt-2 text-success">
                  <i className="fas fa-plus-circle me-1"></i>
                  จะได้รับแต้มเพิ่ม {Math.floor(totalPrice / 100)} แต้ม จากยอดซื้อครั้งนี้
                </div>
              </div>

              {selectedCustomer.points > 0 && (
                <div className="mb-3">
                  <label className="form-label">ใช้แต้มสะสม (1 แต้ม = 10 บาท)</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      value={pointsToRedeem}
                      onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                      max={Math.min(selectedCustomer.points, Math.floor(totalPrice / 10))}
                      min="0"
                    />
                    <span className="input-group-text">แต้ม</span>
                  </div>
                  {discountFromPoints > 0 && (
                    <div className="text-success mt-1">
                      <small>ส่วนลดจากแต้มสะสม: {discountFromPoints.toLocaleString()} บาท</small>
                    </div>
                  )}
                  <small className="text-muted">
                    (สามารถใช้แต้มได้สูงสุด {Math.min(selectedCustomer.points, Math.floor(totalPrice / 10))} แต้ม)
                  </small>
                </div>
              )}
            </>
          )}

          <div>
            <label>ยอดรวมราคาสินค้า</label>
          </div>
          <div>
            <input
              value={(totalPrice - discountFromPoints).toLocaleString("th-TH")}
              disabled
              className="form-control text-end"
            />
            {discountFromPoints > 0 && (
              <div className="text-muted small mt-1">
                  <span>ราคาเต็ม: {totalPrice.toLocaleString("th-TH")} บาท</span>
                  <br/>
                  <span className="text-success">ส่วนลดจากแต้ม: -{discountFromPoints.toLocaleString()} บาท</span>
              </div>
            )}
          </div>

          {paymentMethod === "PromptPay" ? (
            <div className="text-center mt-4">
              <QRCodeSVG value={generateQRCode()} size={256} level="L" />
              <p className="mt-2">สแกนเพื่อชำระเงิน</p>
              <button onClick={handleEndSale} className="btn btn-success mt-2">
                ยืนยันการชำระเงิน
              </button>
            </div>
          ) : (
            <>
              <div className="mt-3">
                <label>รับเงิน</label>
                <input
                  value={inputMoney}
                  onChange={(e) => setInputMoney(e.target.value)}
                  className="form-control text-end"
                />
              </div>
              <div className="mt-3">
                <label>เงินทอน</label>
                <input
                  value={(inputMoney - (totalPrice - discountFromPoints)).toLocaleString("th-TH")}
                  className="form-control text-end"
                  disabled
                />
              </div>
              <div className="text-center mt-3">
                <button
                  onClick={(e) => setInputMoney(totalPrice)}
                  className="btn btn-primary me-2"
                >
                  <i className="fa fa-check me-2"></i>
                  จ่ายพอดี
                </button>
                <button
                  onClick={handleEndSale}
                  className="btn btn-success"
                  disabled={inputMoney <= 0}
                >
                  <i className="fa fa-check me-2"></i>
                  จบการขาย
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        show={showBillDetailModal}
        onHide={() => setShowBillDetailModal(false)}
        title="รายละเอียดในบิล"
        modalSize="modal-lg"
      >
        <div className="p-4" style={{ fontFamily: "'Kanit', sans-serif" }}>
          <div className="bg-light p-3 rounded mb-4 shadow-sm">
            <table className="table table-hover table-striped">
              <thead>
                <tr>
                  <th>รายการ</th>
                  <th>จำนวน</th>
                  <th className="text-end">ราคา</th>
                
                </tr>
              </thead>
              <tbody>
              {selectedBill?.billSaleDetails?.map((item, index) => {
                  const priceWithVat = item.price * 1.07; // คำนวณราคารวม VAT
                  return (
                    <tr key={index}>
                      <td>{item.product.name}</td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-end">
                        {(item.qty * priceWithVat).toLocaleString("th-TH")} บาท
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <div
        id="slip"
        style={{
          display: "none",
          width: "400px",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          lineHeight: "1.5",
        }}
      >
        <div style={{ padding: "10px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "bold" }}>
              {memberInfo?.name || ""}
            </h4>
          </div>

          {/* Bill Info */}
          <div
            style={{
              marginBottom: "10px",
              borderBottom: "1px dashed #000",
              paddingBottom: "10px",
            }}
          >
            <p style={{ margin: "0" }}>
              วันที่: {dayjs(lastBill?.createdAt).format("DD/MM/YYYY HH:mm")}
            </p>
            <p style={{ margin: "0" }}>เลขที่บิล: {lastBill?.id || "-"}</p>
          </div>

          {/* Items Table */}
          <table
            style={{
              width: "100%",
              marginBottom: "10px",
              borderBottom: "1px dashed #000",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: "12px",
                    paddingBottom: "5px",
                  }}
                >
                  รายการ
                </th>
                <th style={{ textAlign: "center", fontSize: "12px" }}>จำนวน</th>
                <th style={{ textAlign: "right", fontSize: "12px" }}>ราคา</th>
                <th style={{ textAlign: "right", fontSize: "12px" }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {lastBill?.billSaleDetails?.map((item, index) => (
                <tr key={index}>
                  <td style={{ textAlign: "left", paddingTop: "3px" }}>
                    {item.product.name || "D"}
                  </td>
                  <td style={{ textAlign: "center" }}>{item.qty || 1}</td>
                  <td style={{ textAlign: "right" }}>
                    {parseFloat(item.price).toLocaleString("th-TH")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(item.qty * item.price).toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div
            style={{
              fontSize: "12px",
              borderBottom: "1px dashed #000",
              paddingBottom: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ flex: "1", textAlign: "left", minWidth: "80px" }}>
                รวมทั้งสิ้น:
              </span>
              <span style={{ flex: "1", textAlign: "right", minWidth: "80px" }}>
              {selectedBill?.totalAmount?.toFixed(2) || sumTotal.toFixed(2)} บาท 
              </span>
            </div>
            {discountFromPoints > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ flex: "1", textAlign: "left", minWidth: "80px" }}>
                        ส่วนลดจากแต้ม:
                    </span>
                    <span style={{ flex: "1", textAlign: "right", minWidth: "80px", color: "green" }}>
                        -{discountFromPoints.toFixed(2)} บาท
                    </span>
                </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ flex: "1", textAlign: "left", minWidth: "80px" }}>
                VAT 7%:
              </span>
              <span style={{ flex: "1", textAlign: "right", minWidth: "80px" }}>
                {(sumTotal * 0.07).toFixed(2)} บาท
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                fontWeight: "bold",
                borderTop: "1px dashed #000",
                paddingTop: "5px",
                marginTop: "5px",
              }}
            >
              <span style={{ flex: "1", textAlign: "left", minWidth: "80px" }}>
                สุทธิ:
              </span>
              <span style={{ flex: "1", textAlign: "right", minWidth: "80px" }}>
                {(sumTotal - discountFromPoints).toFixed(2)} บาท
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{ textAlign: "center", marginTop: "10px", fontSize: "12px" }}
          >
            <p style={{ margin: "0" }}>*** ขอบคุณที่ใช้บริการ ***</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sale;

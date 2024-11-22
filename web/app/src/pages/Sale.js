import { useEffect, useRef, useState } from "react";
import Template from "../components/Template";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import Modal from "../components/Modal";
import * as dayjs from "dayjs";
import PrintJS from "print-js";
import Barcode from "../components/Barcode";
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';

const styles = {
  productCard: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '5px 5px 15px #d1d1d1, -5px -5px 15px #ffffff',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '8px 8px 20px #d1d1d1, -8px -8px 20px #ffffff'
    }
  },
  totalDisplay: {
    background: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
    color: '#ffffff',
    padding: '25px',
    borderRadius: '25px',
    textAlign: 'right',
    fontWeight: '600',
    fontSize: '2.5rem',
    marginBottom: '25px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1))',
      zIndex: 1
    }
  },
  searchInput: {
    padding: '18px 25px',
    borderRadius: '50px',
    border: 'none',
    fontSize: '1.1rem',
    backgroundColor: '#f8fafc',
    boxShadow: 'inset 2px 2px 5px #d1d1d1, inset -2px -2px 5px #ffffff',
    width: '100%',
    maxWidth: '500px',
    transition: 'all 0.3s ease',
    '&:focus': {
      boxShadow: 'inset 4px 4px 8px #d1d1d1, inset -4px -4px 8px #ffffff',
      outline: 'none'
    }
  },
  productImage: {
    height: '140px', 
    width: '100%',
    objectFit: 'contain', 
    objectPosition: 'center',
    borderRadius: '20px 20px 0 0',
    transition: 'transform 0.3s ease',
    padding: '10px', 
    background: '#ffffff' 
  },
  productInfo: {
    padding: '20px',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(10px)'
  },
  stockBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    padding: '8px 15px',
    borderRadius: '25px',
    fontSize: '0.85rem',
    fontWeight: '600',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  cartContainer: {
    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
    borderRadius: '25px',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  },
  cartHeader: {
    background: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
    padding: '25px',
    borderRadius: '20px',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  cartTotal: {
    color: '#ffffff',
    fontSize: '2.5rem',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: '5px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
  },
  cartLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.9rem',
    textAlign: 'right',
  },
  cartItem: {
    background: '#ffffff',
    borderRadius: '15px',
    padding: '15px',
    marginBottom: '15px',
    transition: 'all 0.3s ease',
    border: '1px solid #eef2f7',
    position: 'relative',
    '&:hover': {
      transform: 'translateX(5px)',
      boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
    }
  },
  deleteButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: '#fee2e2',
    color: '#dc2626',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: '#dc2626',
      color: '#ffffff',
      transform: 'rotate(90deg)',
    }
  },
  quantityBadge: {
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#ffffff',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '600',
  }
};

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
  const [categoryFilter, ] = useState("ทั้งหมด");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [heldBills, setHeldBills] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const promptPayNumber = "0000000000"; // Replace with your actual PromptPay number

  const saleRef = useRef();
  const searchInputRef = useRef();

  useEffect(() => {
    fetchData();
    openBill();
    fetchBillSaleDetail();

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
    if (
      !currentBill.billSaleDetails ||
      currentBill.billSaleDetails.length === 0
    ) {
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
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const vatRate = 7; // อัตรา VAT 7%
          const vatAmount = calculateVAT(totalPrice, vatRate);
          const totalWithVAT = totalPrice + vatAmount;

          // คำนวณ totalprice สำหรับแต่ละรายการสินค้า
          const billSaleDetailsWithVAT = currentBill.billSaleDetails.map(
            (item) => {
              const priceWithVAT = parseInt(item.price) * (1 + vatRate / 100);
              return {
                ...item,
                totalprice: priceWithVAT,
              };
            }
          );

          const paymentData = {
            method: paymentMethod,
            amount: totalWithVAT,
            vatAmount: vatAmount,
            billSaleDetails: billSaleDetailsWithVAT,
          };

          
          const currentBillStatus = currentBill.status; 
          if (currentBillStatus === "paused" || currentBillStatus === "open") {
            await axios
              .post(
                config.api_path + "/billSale/endSale",
                paymentData,
                config.headers()
              )
              .then((res) => {
                if (res.data.message === "success") {
                  Swal.fire({
                    title: "จบการขาย",
                    text: "จบการขายสำเร็จแล้ว",
                    icon: "success",
                    timer: 1000,
                  });
                  // รีเซ็ตค่าที่เกี่ยวข้อง
                  setCurrentBill({});
                  setTotalPrice(0);
                  setInputMoney(0);
                  setMemberInfo({});
                  setLastBill({});
                  setSumTotal(0);

                  // รีเฟรชข้อมูลบิล
                  openBill();
                  fetchBillSaleDetail();

                  let btns = document.getElementsByClassName("btnClose");
                  for (let i = 0; i < btns.length; i++) btns[i].click();

                  if (saleRef.current) {
                    saleRef.current.refreshCountBill();
                  }
                }
              })
              .catch((err) => {
                throw err.response.data;
              });
          } else {
            Swal.fire({
              title: "ไม่สามารถจบการขายได้",
              text: "สถานะบิลไม่ถูกต้อง",
              icon: "warning",
            });
          }
        } catch (e) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด",
            text: e.message,
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
        axios.get(config.api_path + "/billSale/lastBill", config.headers())
      ]);

      if (memberRes.data.message === "success") {
        setMemberInfo(memberRes.data.result);
      }

      if (billRes.data.message === "success" && billRes.data.result.length > 0) {
        const currentBill = billRes.data.result[0];
        setLastBill(currentBill);
        
        // คำนวณยอดรวม
        let sum = currentBill.billSaleDetails.reduce((acc, item) => {
          return acc + (parseInt(item.qty) * parseInt(item.price));
        }, 0);

        const vatAmount = calculateVAT(sum, 7);
        const totalWithVAT = sum + vatAmount;
        setSumTotal(totalWithVAT);

        // รอให้ state อัพเดทและ DOM เรนเดอร์
        await new Promise(resolve => setTimeout(resolve, 100));

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
            }
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
        icon: "error"
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
    if (product.remainingQty <= 0) {
      Swal.fire({
        title: "สินค้าหมด",
        text: "สินค้าในสต๊อกหมด",
        icon: "warning",
      });
      return;
    }

    setItem({ ...product, qty: 1 });
    document.getElementById("modalQtyButton").click();
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
                {/** ปุ่มสำหรับพักบิล */}
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
                  data-toggle="modal"
                  data-target="#heldBillsModal"
                  className="btn btn-warning me-2"
                  style={{ fontSize: "1rem", padding: "10px 15px" }}
                  title="ดูบิลที่พักไว้"
                >
                  <i className="fa fa-clipboard-list me-2"></i>บิลที่พักไว้
                </button>
                {/** ปุ่มสำหรับจบการขาย */}
                <button
                  data-toggle="modal"
                  data-target="#modalEndSale"
                  className="btn btn-success me-2"
                  style={{ fontSize: "1rem", padding: "10px 15px" }}
                  title="จบการขาย"
                >
                  <i className="fa fa-check me-2"></i>จบการขาย
                </button>

                <button
                  onClick={handleBillToday}
                  data-toggle="modal"
                  data-target="#modalBillToday"
                  className="btn btn-info me-2"
                  style={{ fontSize: "1rem", padding: "10px 15px" }}
                  title="ดูบิลวันนี้"
                >
                  <i className="fa fa-file me-2"></i>บิลวันนี้
                </button>
                {/** ปุ่มสำหรับดูบิลล่าสุด */}
                
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
                    className="form-control form-control-lg"
                    placeholder="🔍 ค้นหาสินค้า..."
                    style={styles.searchInput}
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
                          className="card h-100" 
                          style={styles.productCard}
                          onClick={() => handleProductClick(item)}
                        >
                          <div className="position-relative">
                            <img
                              src={`${config.api_path}/uploads/${item.productImages[0].imageName}`}
                              style={styles.productImage}
                              alt={item.name}
                            />
                            <div 
                              style={{
                                ...styles.stockBadge,
                                background: item.remainingQty > 0 
                                  ? 'rgba(52, 211, 153, 0.9)' 
                                  : 'rgba(239, 68, 68, 0.9)',
                                color: '#ffffff'
                              }}
                            >
                              คงเหลือ: {item.remainingQty}
                            </div>
                          </div>
                          
                          <div style={styles.productInfo}>
                            <h6 className="fw-bold mb-2">{item.name } </h6><span className="h5 mb-0" style={{color: '#2563eb'}}>
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
                <div className="position-sticky" style={{top: '1rem'}}>
                  <div style={styles.cartContainer}>
                    <div style={styles.cartHeader}>
                      <div style={styles.cartTotal}>
                        {totalPrice.toLocaleString("th-TH")} ฿
                      </div>
                      <div style={styles.cartLabel}>
                        รวม VAT 7%
                      </div>
                    </div>

                    <div className="cart-items" style={{
                      maxHeight: '65vh',
                      overflowY: 'auto',
                      padding: '5px'
                    }}>
                      {currentBill?.billSaleDetails?.length > 0 ? (
                        currentBill.billSaleDetails.map((item) => (
                          <div key={item.id} style={styles.cartItem}>
                            <div className="d-flex align-items-center mb-2">
                              <div className="flex-grow-1">
                                <h6 className="mb-0" style={{color: '#1e40af', fontWeight: '600'}}>
                                  {item.product.name} 
                                </h6>
                                <small className="text-muted">
                                  {item.barcode}
                                </small>
                              </div>
                              <span style={styles.quantityBadge}>
                                {item.qty}
                              </span>
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <span className="text-muted" style={{fontSize: '0.9rem'}}>
                                  {parseInt(item.price).toLocaleString("th-TH")} ฿ × {item.qty}
                                </span>
                              </div>
                              <div className="d-flex align-items-center">
                                <span className="me-3" style={{
                                  color: '#059669',
                                  fontWeight: '600',
                                  fontSize: '1.1rem'
                                }}>
                                  {(item.qty * item.price).toLocaleString("th-TH")} ฿
                                </span>
                                <button
                                  onClick={() => handleDelete(item)}
                                  style={styles.deleteButton}
                                  title="ลบรายการ"
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>
                            </div>
                            
                            <div className="progress mt-2" style={{height: '4px'}}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{
                                  width: `${(item.qty / item.product.remainingQty) * 100}%`,
                                  borderRadius: '2px'
                                }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5">
                          <i className="fa fa-shopping-cart mb-3" style={{
                            fontSize: '3rem',
                            color: '#cbd5e1'
                          }}></i>
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
        className="modal fade"
        id="heldBillsModal"
        tabIndex="-1"
        aria-labelledby="heldBillsModalLabel"
        aria-hidden="true"
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

      <Modal id="modalBillToday" title="บิลวันนี้" modalSize="modal-lg">
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
                  <tr>
                    <td className="text-center">
                      <button
                        onClick={(e) => setSelectedBill(item)}
                        data-toggle="modal"
                        data-target="#modalBillSaleDetail"
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
              : ""}
          </tbody>
        </table>
      </Modal>

      <Modal id="modalQty" title="ปรับจำนวน">
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
            <button onClick={handleAddToBill} className="btn btn-primary">
              <i className="fa fa-check me-2"></i>เพิ่มลงบิล
            </button>
          </div>
        </div>
      </Modal>

      <button
        id="modalQtyButton"
        data-toggle="modal"
        data-target="#modalQty"
        style={{ display: "none" }}
      ></button>

      <Modal id="modalEndSale" title="จบการขาย">
        <div>
          <div>
            <label>ยอดเงินทั้งหมด</label>
          </div>
          <div>
            <input
              value={totalPrice.toLocaleString("th-TH")}
              disabled
              className="form-control text-end"
            />
          </div>
          <div className="mt-3">
            <label>ช่องทางการชำระเงิน</label>
          </div>
          <div>
            <select
              value={paymentMethod}
              onChange={handlePaymentMethodChange}
              className="form-control"
            >
              <option value="Cash">Cash(เงินสด)</option>
              <option value="PromptPay">PromptPay(พร้อมเพย์)</option>
            </select>
          </div>

          {paymentMethod === "PromptPay" ? (
            <div className="text-center mt-4">
              <QRCodeSVG 
                value={generateQRCode()}
                size={256}
                level="L"
              />
              <p className="mt-2">สแกนเพื่อชำระเงิน</p>
              <button
                onClick={handleEndSale}
                className="btn btn-success mt-2"
              >
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
                  value={(inputMoney - totalPrice).toLocaleString("th-TH")}
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
  id="modalBillSaleDetail"
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
            <th>ราคา</th>
            <th>ยอดรวม</th>
          </tr>
        </thead>
        <tbody>
          {selectedBill?.billSaleDetails?.length > 0 ? (
            selectedBill.billSaleDetails.map((item, index) => (
              <tr key={index}>
                <td>{item.product.name}</td>
                <td className="text-start">{item.qty}</td>
                <td className="text-start">
                  {item.price.toLocaleString("th-TH")} บาท
                </td>
                <td className="text-start">
                  {(item.qty * item.price).toLocaleString("th-TH")} บาท
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center text-muted">
                ไม่มีรายการสินค้า
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</Modal>

     
      <div id="slip" style={{ display: "none", width: '400px', fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.5' }}>
  <div style={{ padding: '10px' }}>
    
    {/* Header */}
    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
      <h4 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{memberInfo?.name || ''}</h4>
     
    </div>

    {/* Bill Info */}
    <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
      <p style={{ margin: '0' }}>วันที่: {dayjs(lastBill?.createdAt).format('DD/MM/YYYY HH:mm')}</p>
      <p style={{ margin: '0' }}>เลขที่บิล: {lastBill?.id || '-'}</p>
    </div>

    {/* Items Table */}
    <table style={{ width: '100%', marginBottom: '10px', borderBottom: '1px dashed #000' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', fontSize: '12px', paddingBottom: '5px' }}>รายการ</th>
          <th style={{ textAlign: 'center', fontSize: '12px' }}>จำนวน</th>
          <th style={{ textAlign: 'right', fontSize: '12px' }}>ราคา</th>
          <th style={{ textAlign: 'right', fontSize: '12px' }}>รวม</th>
        </tr>
      </thead>
      <tbody>
        {lastBill?.billSaleDetails?.map((item, index) => (
          <tr key={index}>
            <td style={{ textAlign: 'left', paddingTop: '3px' }}>{item.product.name || 'D'}</td>
            <td style={{ textAlign: 'center' }}>{item.qty || 1}</td>
            <td style={{ textAlign: 'right' }}>{parseFloat(item.price).toLocaleString('th-TH')}</td>
            <td style={{ textAlign: 'right' }}>{(item.qty * item.price).toLocaleString('th-TH')}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Summary */}
    <div style={{ fontSize: '12px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ flex: '1', textAlign: 'left', minWidth: '80px' }}>รวมทั้งสิ้น:</span>
    <span style={{ flex: '1', textAlign: 'right', minWidth: '80px' }}>{(sumTotal ).toFixed(2)} บาท</span>
  </div>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ flex: '1', textAlign: 'left', minWidth: '80px' }}>VAT 7%:</span>
    <span style={{ flex: '1', textAlign: 'right', minWidth: '80px' }}>{(sumTotal * 0.07).toFixed(2)} บาท</span>
  </div>
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: '5px', marginTop: '5px' }}>
    <span style={{ flex: '1', textAlign: 'left', minWidth: '80px' }}>สุทธิ:</span>
    <span style={{ flex: '1', textAlign: 'right', minWidth: '80px' }}>{sumTotal.toFixed(2)} บาท</span>
  </div>
</div>
    

    {/* Footer */}
    <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>
      <p style={{ margin: '0' }}>*** ขอบคุณที่ใช้บริการ ***</p>
    </div>
  </div>
</div>

      <style>
        {`
          @keyframes glow {
            from {
              box-shadow: 0 0 10px rgba(112, 254, 63, 0.2),
                          0 0 20px rgba(112, 254, 63, 0.1);
            }
            to {
              box-shadow: 0 0 20px rgba(112, 254, 63, 0.4),
                          0 0 30px rgba(112, 254, 63, 0.2);
            }
          }

          .cart-items::-webkit-scrollbar {
            width: 8px;
          }

          .cart-items::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          .cart-items::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }

          .cart-items::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

          .card {
            border: none;
            transition: all 0.3s ease;
          }
          
          .btn {
            transition: all 0.3s ease;
          }
          
          .btn:hover {
            transform: translateY(-2px);
          }
          
          .cart-items {
            border-radius: 20px;
            background: linear-gradient(145deg, #ffffff, #f3f4f6);
            padding: 20px;
          }
          
          .cart-items::-webkit-scrollbar {
            width: 8px;
            border-radius: 4px;
          }
          
          .cart-items::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          .cart-items::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #3b82f6, #2563eb);
            border-radius: 4px;
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
          
          .product-card:hover img {
            transform: scale(1.05);
          }
          
          .cart-items {
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 #f1f5f9;
          }
          
          .cart-items::-webkit-scrollbar {
            width: 6px;
          }
          
          .cart-items::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          
          .cart-items::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 3px;
          }
          
          .cart-items::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .cart-item {
            animation: slideIn 0.3s ease;
          }
        `}
      </style>
    </>
  );
}

export default Sale;

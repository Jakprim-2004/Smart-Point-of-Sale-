import Template from "../components/Template";
import Swal from "sweetalert2";
import config from "../config";
import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import Barcode from "../components/Barcode";
import Select from 'react-select';


// การประกาศตัวแปร state สำหรับเก็บข้อมูลสินค้า
function Product() {
  const [product, setProduct] = useState({});
  const [products, setProducts] = useState([]);
  const [productImage, setProductImage] = useState({});
  const [productImages, setProductImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductImageModal, setShowProductImageModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  // เรียกข้อมูลเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  // แก้ไขฟังก์ชันดึงข้อมูลสินค้า
  const fetchData = async () => {
    try {
      const res = await axios.get(
        config.api_path + "/product/list",
        config.headers()
      );
      if (res.data.message === "success") {
        // เพิ่มการเช็คว่ามีรูปภาพหรือไม่
        const productsWithImageStatus = await Promise.all(
          res.data.results.map(async (product) => {
            const imageRes = await axios.get(
              config.api_path + "/productImage/list/" + product.id,
              config.headers()
            );
            return {
              ...product,
              hasImage: imageRes.data.results.length > 0,
            };
          })
        );
        setProducts(productsWithImageStatus);
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        config.api_path + "/category/list",
        config.headers()
      );
      if (res.data.message === "success") {
        setCategories(res.data.results);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const clearForm = () => {
    setProduct({
      name: "",
      detail: "",
      price: "",
      cost: "",
      barcode: "",
      category: "",
      originalBarcode: "", 
    });
    setShowProductModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!product.barcode) {
      Swal.fire({
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกบาร์โค้ด",
        icon: "warning",
      });
      return;
    }
    
    // ตรวจสอบความยาวบาร์โค้ด
    if (product.barcode.length !== 13) {
      Swal.fire({
        title: "บาร์โค้ดไม่ถูกต้อง",
        text: "บาร์โค้ดต้องมีความยาว 13 หลัก",
        icon: "warning",
      });
      return;
    }
    
    // ตรวจสอบความซ้ำซ้อนของบาร์โค้ด (กรณีมีการแก้ไขบาร์โค้ด)
    if (product.barcode !== product.originalBarcode) {
      try {
        const res = await axios.get(
          config.api_path + "/product/checkBarcode/" + product.barcode,
          config.headers()
        );
        
        if (res.data.exists) {
          Swal.fire({
            title: "บาร์โค้ดซ้ำ",
            text: "บาร์โค้ดนี้มีอยู่ในระบบแล้ว กรุณาใช้บาร์โค้ดอื่น",
            icon: "warning",
          });
          return;
        }
      } catch (error) {
        console.error("Error checking barcode:", error);
        
      }
    }

    if (!product.name) {
      Swal.fire({
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกชื่อสินค้า",
        icon: "warning",
      });
      return;
    }

    if (!product.cost) {
      Swal.fire({
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกราคาทุน",
        icon: "warning",
      });
      return;
    }

    if (!product.price) {
      Swal.fire({
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกราคาจำหน่าย",
        icon: "warning",
      });
      return;
    }

    if (!product.category) {
      Swal.fire({
        title: "กรุณากรอกข้อมูล",
        text: "กรุณาเลือกประเภทสินค้า",
        icon: "warning",
      });
      return;
    }

    // ดำเนินการบันทึกข้อมูล
    let url = config.api_path + "/product/insert";

    if (product.id !== undefined) {
      url = config.api_path + "/product/update";
    }

    try {
      const res = await axios.post(url, product, config.headers());
      if (res.data.message === "success") {
        Swal.fire({
          title: "บันทึกข้อมูล",
          text: "บันทึกข้อมูลสินค้าแล้ว",
          icon: "success",
          timer: 2000,
        });
        fetchData();
        handleClose();
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  // ฟังก์ชันล้างข้อมูลโมดัลและรูปภาพตัวอย่าง
  const cleanupModalAndPreview = () => {
    setImagePreview(null);
    setProductImage({});
  };

  // อัปเดตฟังก์ชันปิดโมดัลให้มีการล้างข้อมูล
  const handleClose = () => {
    cleanupModalAndPreview();
    setShowProductModal(false);
    setShowProductImageModal(false);
  };

  // ฟังก์ชันจัดการปิดโมดัลแต่ละประเภท
  const handleProductModalClose = () => {
    setShowProductModal(false);
    cleanupModalAndPreview();
  };

  const handleImageModalClose = () => {
    setShowProductImageModal(false);
    cleanupModalAndPreview();
  };

  const handleDelete = (item) => {
    Swal.fire({
      title: "ลบข้อมูล",
      text: "ยืนยันการลบข้อมูลออกจากระบบ",
      icon: "question",
      showCancelButton: true,
      showConfirmButton: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const res = await axios.delete(
            config.api_path + "/product/delete/" + item.id,
            config.headers()
          );
          if (res.data.message === "success") {
            fetchData();
            Swal.fire({
              title: "ลบข้อมูล",
              text: "ลบข้อมูลแล้ว",
              icon: "success",
              timer: 2000,
            });
          }
        } catch (e) {
          Swal.fire({
            title: "Error",
            text: e.message,
            icon: "error",
          });
        }
      }
    });
  };

  const handleChangeFile = (files) => {
    if (files && files[0]) {
      setProductImage(files[0]);
      // สร้าง URL สำหรับแสดงตัวอย่างรูปภาพ
      const previewUrl = URL.createObjectURL(files[0]);
      setImagePreview(previewUrl);
    }
  };

  // ล้าง URL ของรูปภาพตัวอย่างเมื่อคอมโพเนนต์ถูกยกเลิกหรือเมื่อเลือกภาพใหม่
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // อัปเดตฟังก์ชันอัพโหลดให้มีการจัดการทรัพยากรที่เหมาะสม
  const handleUpload = () => {
    if (!productImage || !productImage.name) {
      Swal.fire({
        title: "Error",
        text: "กรุณาเลือกไฟล์รูปภาพก่อนอัพโหลด",
        icon: "error",
      });
      return;
    }

    Swal.fire({
      title: "ยืนยันการอัพโหลดภาพสินค้า",
      text: "โปรดทำการยืนยัน เพื่ออัพโหลดภาพสินค้านี้",
      icon: "question",
      showCancelButton: true,
      showConfirmButton: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const formData = new FormData();
          formData.append("productImage", productImage);
          formData.append("productImageName", productImage.name);
          formData.append("productId", product.id);

          const res = await axios.post(
            config.api_path + "/productImage/insert",
            formData,
            {
              headers: {
                ...config.headers().headers,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (res.data.message === "success") {
            await fetchDataProductImage({ id: product.id });
            cleanupModalAndPreview();
            Swal.fire({
              title: "upload ภาพสินค้า",
              text: "upload ภาพสินค้าเรียบร้อยแล้ว",
              icon: "success",
              timer: 2000,
            });
          }
        } catch (e) {
          Swal.fire({
            title: "Error",
            text: e.response?.data?.message || e.message,
            icon: "error",
          });
        }
      }
    });
  };

  const fetchDataProductImage = async (item) => {
    try {
      const res = await axios.get(
        config.api_path + "/productImage/list/" + item.id,
        config.headers()
      );
      if (res.data.message === "success") {
        setProductImages(res.data.results);
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const handleChooseProduct = (item) => {
    setProduct({
      ...item,
      originalBarcode: item.barcode // เก็บค่าบาร์โค้ดเดิมไว้
    });
    fetchDataProductImage(item);
  };

  const handleChooseMainImage = (item) => {
    Swal.fire({
      title: "เลือกภาพหลัก",
      text: "ยืนยันเลือกภาพนี้ เป็นภาพหลักของสินค้า",
      icon: "question",
      showCancelButton: true,
      showConfirmButton: true,
    }).then(async (res) => {
      try {
        const url =
          config.api_path +
          "/productImage/chooseMainImage/" +
          item.id +
          "/" +
          item.productId;
        const res = await axios.get(url, config.headers());
        if (res.data.message === "success") {
          fetchDataProductImage({ id: item.productId });
          Swal.fire({
            title: "เลือกภาพหลัก",
            text: "บันทึกการเลือกภาพหลักของสินค้าแล้ว",
            icon: "success",
            timer: 2000,
          });
        }
      } catch (e) {
        Swal.fire({
          title: "Error",
          text: e.message,
          icon: "error",
        });
      }
    });
  };

  const handleDeleteProductImage = (item) => {
    Swal.fire({
      title: "ลบภาพสินค้า",
      text: "ยืนยันการลบภาพสินค้าออกจากระบบ",
      icon: "question",
      showCancelButton: true,
      showConfirmButton: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const res = await axios.delete(
            config.api_path + "/productImage/delete/" + item.id,
            config.headers()
          );
          if (res.data.message === "success") {
            fetchDataProductImage({ id: item.productId });
            Swal.fire({
              title: "ลบภาพสินค้า",
              text: "ลบภาพสินค้าออกจากระบบแล้ว",
              icon: "success",
              timer: 2000,
            });
          }
        } catch (e) {
          Swal.fire({
            title: "Error",
            text: e.message,
            icon: "error",
          });
        }
      }
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // เพิ่มฟังก์ชันตรวจสอบบาร์โค้ด
  const handleBarcodeChange = async (e) => {
    const value = e.target.value;
    // อนุญาตให้กรอกได้เฉพาะตัวเลขและความยาวไม่เกิน 13 หลัก
    if (/^\d{0,13}$/.test(value)) {
      setProduct({ ...product, barcode: value });
      
      // ตรวจสอบความซ้ำซ้อนเมื่อกรอกครบ 13 หลัก
      if (value.length === 13 && value !== product.originalBarcode) {
        try {
          const res = await axios.get(
            config.api_path + "/product/checkBarcode/" + value,
            config.headers()
          );
          
          if (res.data.exists) {
            Swal.fire({
              title: "บาร์โค้ดซ้ำ",
              text: "บาร์โค้ดนี้มีอยู่ในระบบแล้ว กรุณาใช้บาร์โค้ดอื่น",
              icon: "warning",
            });
          }
        } catch (error) {
          console.error("Error checking barcode:", error);
        }
      }
    }
  };

  // เพิ่มฟังก์ชันสร้างบาร์โค้ดอัตโนมัติ
  const generateBarcode = () => {
    // สร้างเลข 13 หลักโดยสุ่ม (12 หลักแรก + check digit)
    const generateRandomDigits = () => {
      let digits = "";
      for (let i = 0; i < 12; i++) {
        digits += Math.floor(Math.random() * 10);
      }
      
      // คำนวณ check digit (ตามมาตรฐาน EAN-13)
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      
      return digits + checkDigit;
    };
    
    // ตรวจสอบความซ้ำซ้อนของบาร์โค้ดที่สร้าง
    const checkAndSetBarcode = async () => {
      const newBarcode = generateRandomDigits();
      
      try {
        const res = await axios.get(
          config.api_path + "/product/checkBarcode/" + newBarcode,
          config.headers()
        );
        
        if (res.data.exists) {
          // ถ้าซ้ำ ให้สร้างใหม่
          checkAndSetBarcode();
        } else {
          // ถ้าไม่ซ้ำ ให้กำหนดค่า
          setProduct({ ...product, barcode: newBarcode });
          Swal.fire({
            title: "สร้างบาร์โค้ดสำเร็จ",
            text: "ระบบได้สร้างบาร์โค้ดใหม่ให้คุณแล้ว",
            icon: "success",
            timer: 1500
          });
        }
      } catch (error) {
        console.error("Error checking barcode:", error);
        // หากเกิดข้อผิดพลาดในการตรวจสอบ ให้ใช้บาร์โค้ดนั้นไปก่อน
        setProduct({ ...product, barcode: newBarcode });
      }
    };
    
    checkAndSetBarcode();
  };

  const handlePrintBarcode = (barcodeValue) => {
    // เปิดหน้าต่างใหม่สำหรับพิมพ์บาร์โค้ด
    const printWindow = window.open("", "_blank", "width=600,height=400");

    printWindow.document.write(`
      <html>
      <head>
        <title>Print Barcode</title>
        <style>
          body { text-align: center; margin-top: 50px; font-family: Arial, sans-serif; }
          .barcode-container { display: inline-block; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        <div class="barcode-container">
          <svg id="barcode"></svg>
        </div>
        <script>
          window.onload = function() {
            JsBarcode("#barcode", "${barcodeValue}", {
              width: 2, 
              height: 57, 
              displayValue: true
            });
            setTimeout(() => window.print(), 500);
          }
        </script>
      </body>
      </html>
    `);

    printWindow.document.write(
      `<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>`
    );
    printWindow.document.write("<script>renderBarcode();</script>");
    printWindow.document.close();
  };

  const handleCategoryManagement = () => {
    navigate("/category");
  };

  return (
    <>
      <Template>
        <div className="card shadow-sm border-0">
          <div className="card-header bg-primary text-white py-3">
            <h4 className="card-title mb-0 font-weight-bold">สินค้า</h4>
          </div>
          <div className="card-body bg-light">
            <div className="row mb-4">
              <div className="col-md-10">
                <div className="d-flex">
                  <button
                    onClick={clearForm}
                    className="btn btn-primary shadow-sm d-flex align-items-center hover-scale mr-2"
                    style={{ transition: "transform 0.2s" }}
                  >
                    <i className="fa fa-plus mr-2"></i> เพิ่มรายการ
                  </button>
                  <button
                    onClick={handleCategoryManagement}
                    className="btn btn-secondary shadow-sm d-flex align-items-center hover-scale"
                    style={{ transition: "transform 0.2s" }}
                  >
                    <i className="fa fa-tags mr-2"></i> จัดการหมวดหมู่
                  </button>
                </div>
              </div>
              <div className="col-md-2">
                <input
                  type="text"
                  className="form-control shadow-sm border-0"
                  placeholder="🔍 ค้นหาสินค้า"
                  onChange={handleSearch}
                  style={{ borderRadius: "20px", padding: "10px 15px" }}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table
                className="table table-hover table-bordered shadow-sm bg-white"
                style={{ borderRadius: "8px", overflow: "hidden" }}
              >
                <thead className="thead-light">
                  <tr style={{ background: "#f8f9fa" }}>
                    <th className="py-3">Barcode</th>
                    <th className="py-3">ชื่อสินค้า</th>
                    <th className="py-3 text-center">รูปภาพ</th>
                    <th className="py-3 text-right">ราคาทุน</th>
                    <th className="py-3 text-right">ราคาจำหน่าย</th>
                    <th className="py-3 text-right">วันหมดอายุ</th>
                    <th className="py-3">ประเภทสินค้า</th>
                    <th className="py-3" width="200px">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.length > 0 ? (
                    products
                      .filter(
                        (item) =>
                          item.name.includes(searchTerm) ||
                          item.barcode.includes(searchTerm) ||
                          item.category.includes(searchTerm)
                      )
                      .map((item) => (
                        <tr key={item.id} className="align-middle">
                          <td className="py-2">
                            <Barcode
                              value={item.barcode}
                              width={1}
                              height={40}
                            />
                          </td>
                          <td className="py-2 font-weight-bold">{item.name}</td>
                          <td className="py-2 text-center">
                            {item.hasImage ? (
                              <span className="badge badge-success">
                                <i className="fa fa-check-circle mr-1"></i>{" "}
                                มีรูปภาพ
                              </span>
                            ) : (
                              <span className="badge badge-warning">
                                <i className="fa fa-exclamation-circle mr-1"></i>{" "}
                                ไม่มีรูปภาพ
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            {parseInt(item.cost).toLocaleString("th-TH")} ฿
                          </td>
                          <td className="py-2 text-right">
                            {parseInt(item.price).toLocaleString("th-TH")} ฿
                          </td>
                          <td className="py-2 text-right">
                            {item.expirationdate?.substring(0, 10)}
                          </td>
                          <td className="py-2">
                            <span className="badge badge-info px-3 py-2">
                              {item.category}
                            </span>
                          </td>
                          <td className="text-center py-2">
                            <div className="btn-group">
                              <button
                                onClick={() => {
                                  handleChooseProduct(item);
                                  setShowProductImageModal(true);
                                }}
                                className="btn btn-primary btn-sm mr-1"
                                title="จัดการรูปภาพ"
                              >
                                <i className="fa fa-image"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setProduct({
                                    ...item,
                                    originalBarcode: item.barcode // เก็บค่าบาร์โค้ดเดิมไว้
                                  });
                                  setShowProductModal(true);
                                }}
                                className="btn btn-info btn-sm mr-1"
                                title="แก้ไข"
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="btn btn-danger btn-sm mr-1"
                                title="ลบ"
                              >
                                <i className="fa fa-times"></i>
                              </button>
                              <button
                                onClick={() => handlePrintBarcode(item.barcode)}
                                className="btn btn-secondary btn-sm"
                                title="พิมพ์บาร์โค้ด"
                              >
                                <i className="fa fa-print"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        <i className="fa fa-box-open mb-2 fa-2x"></i>
                        <p>ไม่พบสินค้า</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* เพิ่ม CSS แบบกำหนดเอง */}
        <style jsx>{`
          .hover-scale:hover {
            transform: scale(1.02);
          }
          .table {
            margin-bottom: 0;
          }
          .btn-group .btn {
            transition: all 0.2s;
          }
          .btn-group .btn:hover {
            transform: translateY(-2px);
          }
          .badge {
            font-weight: normal;
          }
        `}</style>

        {/* โมดัลรูปภาพสินค้า */}
        <Modal
          show={showProductImageModal}
          onHide={handleImageModalClose}
          title="ภาพสินค้า"
          modalSize="modal-lg"
        >
          <div className="row">
            <div className="col-4">
              <div>Barcode</div>
              <input
                value={product.barcode}
                disabled
                className="form-control shadow-sm"
              />
            </div>
            <div className="col-8">
              <div>ชื่อสินค้า</div>
              <input
                value={product.name}
                disabled
                className="form-control shadow-sm"
              />
            </div>
            <div className="col-12 mt-3">
              <div className="form-group">
                <label>เลือกภาพสินค้า</label>
                <div className="custom-file">
                  <input
                    type="file"
                    className="custom-file-input"
                    id="productImageInput"
                    accept="image/*"
                    onChange={(e) => handleChangeFile(e.target.files)}
                  />
                  <label
                    className="custom-file-label"
                    htmlFor="productImageInput"
                  >
                    {productImage.name || "เลือกไฟล์รูปภาพ..."}
                  </label>
                </div>
              </div>

              {imagePreview && (
                <div className="mt-3">
                  <label>ตัวอย่างรูปภาพ</label>
                  <div className="image-preview-container border rounded p-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="img-fluid"
                      style={{ maxHeight: "200px", objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3">
              {productImage.name !== undefined && (
                <button
                  onClick={handleUpload}
                  className="btn btn-primary shadow-sm"
                  disabled={!imagePreview}
                >
                  <i className="fa fa-cloud-upload mr-2"></i> อัพโหลดรูปภาพ
                </button>
              )}
            </div>

            <div className="mt-3">ภาพสินค้า</div>
            <div className="row mt-2">
              {productImages.length > 0 ? (
                productImages.map((item) => (
                  <div className="col-3" key={item.id}>
                    <div className="card shadow-sm border-0">
                      <img
                        className="card-img-top"
                        src={config.api_path + "/uploads/" + item.imageName}
                        width="100%"
                        alt=""
                      />
                      <div className="card-body text-center">
                        {item.isMain ? (
                          <button className="btn btn-info btn-sm mr-2 shadow-sm">
                            ภาพหลัก
                          </button>
                        ) : (
                          <button
                            onClick={() => handleChooseMainImage(item)}
                            className="btn btn-outline-secondary btn-sm mr-2 shadow-sm"
                          >
                            ภาพหลัก
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProductImage(item)}
                          className="btn btn-danger btn-sm shadow-sm"
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center text-muted">
                  ไม่มีภาพสินค้า
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* โมดัลข้อมูลสินค้า */}
        <Modal
          show={showProductModal}
          onHide={handleProductModalClose}
          title="ฟอร์มสินค้า"
        >
          <form onSubmit={handleSave}>
            <div className="row">
              <div className="form-group col-md-12">
                <label>
                  ชื่อสินค้า <span className="text-danger">*</span>
                </label>
                <input
                  value={product.name || ""}
                  onChange={(e) =>
                    setProduct({ ...product, name: e.target.value })
                  }
                  type="text"
                  className="form-control shadow-sm"
                  required
                />
              </div>
              <div className="form-group col-md-6">
                <label>
                  บาร์โค้ด <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    value={product.barcode || ""}
                    onChange={handleBarcodeChange}
                    type="text"
                    className="form-control shadow-sm"
                    required
                    maxLength="13"
                    pattern="\d{13}"
                    title="กรุณากรอกบาร์โค้ด 13 หลัก"
                    placeholder="กรอกบาร์โค้ด 13 หลัก"
                  />
                  <div className="input-group-append">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={generateBarcode}
                      title="สร้างบาร์โค้ดอัตโนมัติ">
                      <i className="fa fa-refresh"></i>
                    </button>
                  </div>
                </div>
                <small className="text-muted">
                  บาร์โค้ดต้องเป็นตัวเลข 13 หลัก ({(product.barcode || "").length}/13)
                </small>
              </div>
              <div className="form-group col-md-6">
                <label>
                  ราคาทุน <span className="text-danger">*</span>
                </label>
                <input
                  value={product.cost || ""}
                  onChange={(e) =>
                    setProduct({ ...product, cost: e.target.value })
                  }
                  type="number"
                  className="form-control shadow-sm"
                  required
                  min="0"
                />
              </div>
              <div className="form-group col-md-6">
                <label>
                  ราคาจำหน่าย <span className="text-danger">*</span>
                </label>
                <input
                  value={product.price || ""}
                  onChange={(e) =>
                    setProduct({ ...product, price: e.target.value })
                  }
                  type="number"
                  className="form-control shadow-sm"
                  required
                  min="0"
                />
              </div>
              <div className="form-group col-md-6">
                <label>วันหมดอายุ</label>
                <input
                  value={
                    product.expirationdate
                      ? product.expirationdate.substring(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    setProduct({ ...product, expirationdate: e.target.value })
                  }
                  type="date"
                  className="form-control shadow-sm"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="form-group col-md-12">
                <label>
                  ประเภทสินค้า <span className="text-danger">*</span>
                </label>
                <div className="d-flex">
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Select
                      value={product.category ? { value: product.category, label: product.category } : null}
                      onChange={(selectedOption) =>
                        setProduct({ ...product, category: selectedOption.value })
                      }
                      options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
                      placeholder="เลือกประเภทสินค้า"
                      className="basic-single"
                      classNamePrefix="select"
                      isClearable={false}
                      isSearchable={true}
                      styles={{
                        control: (baseStyles) => ({
                          ...baseStyles,
                          minHeight: "38px",
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          borderRight: 0
                        }),
                        container: (baseStyles) => ({
                          ...baseStyles,
                          width: "100%"
                        })
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCategoryManagement}
                    title="จัดการหมวดหมู่"
                    style={{
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderLeft: '1px solid #ced4da'
                    }}
                  >
                    <i className="fa fa-cog"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-muted mb-3">
              <small>
                หมายเหตุ: ช่องที่มีเครื่องหมาย{" "}
                <span className="text-danger">*</span> จำเป็นต้องกรอก
              </small>
            </div>

            <button type="submit" className="btn btn-success shadow-sm">
              <i className="fa fa-save mr-2"></i>บันทึกข้อมูล
            </button>
          </form>
        </Modal>
      </Template>
    </>
  );
}

export default Product;

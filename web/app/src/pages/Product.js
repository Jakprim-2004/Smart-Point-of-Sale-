import Template from "../components/Template";
import Swal from "sweetalert2";
import config from "../config";
import axios from "axios";
import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import Barcode from "../components/Barcode";



function Product() {
  const [product, setProduct] = useState({});
  const [products, setProducts] = useState([]);
  const [productImage, setProductImage] = useState({});
  const [productImages, setProductImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(config.api_path + "/product/list", config.headers());
      if (res.data.message === "success") {
        setProducts(res.data.results);
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
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
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
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

  const handleClose = () => {
    const btns = document.getElementsByClassName("btnClose");
    for (let i = 0; i < btns.length; i++) {
      btns[i].click();
    }
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
          const res = await axios.delete(config.api_path + "/product/delete/" + item.id, config.headers());
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
    setProductImage(files[0]);
  };

  const handleUpload = () => {
    Swal.fire({
      title: "ยืนยันการอัพโหลดภาพสินค้า",
      text: "โปรดทำการยืนยัน เพื่ออัพโหลดภาพสินค้านี้",
      icon: "question",
      showCancelButton: true,
      showConfirmButton: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const _config = {
            headers: {
              Authorization: "Bearer " + localStorage.getItem(config.token_name),
              "Content-Type": "multipart/form-data",
            },
          };
          const formData = new FormData();
          formData.append("productImage", productImage);
          formData.append("proudctImageName", productImage.name);
          formData.append("productId", product.id);

          const res = await axios.post(config.api_path + "/productImage/insert", formData, _config);
          if (res.data.message === "success") {
            Swal.fire({
              title: "upload ภาพสินค้า",
              text: "upload ภาพสินค้าเรียบร้อยแล้ว",
              icon: "success",
              timer: 2000,
            });
            fetchDataProductImage({ id: product.id });
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

  const fetchDataProductImage = async (item) => {
    try {
      const res = await axios.get(config.api_path + "/productImage/list/" + item.id, config.headers());
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
    setProduct(item);
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
        const url = config.api_path + "/productImage/chooseMainImage/" + item.id + "/" + item.productId;
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
          const res = await axios.delete(config.api_path + "/productImage/delete/" + item.id, config.headers());
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


  const handlePrintBarcode = (barcodeValue) => {
    // 
    const printWindow = window.open("", "_blank", "width=600,height=400");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { text-align: center; margin-top: 50px; font-family: Arial, sans-serif; }
            .barcode-container { display: inline-block; }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <svg id="barcode"></svg>
          </div>
          <script>
            function renderBarcode() {
              JsBarcode("#barcode", "${barcodeValue}", {
                width: 2, 
                height: 57, 
                displayValue: true
              });
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    
   
    printWindow.document.write(`<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>`);
    printWindow.document.write("<script>renderBarcode();</script>");
    printWindow.document.close();
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
                <button
                  onClick={clearForm}
                  data-toggle="modal"
                  data-target="#modalProduct"
                  className="btn btn-primary shadow-sm d-flex align-items-center hover-scale"
                  style={{ transition: "transform 0.2s" }}
                >
                  <i className="fa fa-plus mr-2"></i> เพิ่มรายการ
                </button>
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
              <table className="table table-hover table-bordered shadow-sm bg-white" 
                     style={{ borderRadius: "8px", overflow: "hidden" }}>
                <thead className="thead-light">
                  <tr style={{ background: "#f8f9fa" }}>
                    <th className="py-3">Barcode</th>
                    <th className="py-3">ชื่อสินค้า</th>
                    <th className="py-3 text-right">ราคาทุน</th>
                    <th className="py-3 text-right">ราคาจำหน่าย</th>
                    <th className="py-3 text-right">วันหมดอายุ</th>
                    <th className="py-3">ประเภทสินค้า</th>
                    <th className="py-3" width="200px">จัดการ</th>
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
                          <td className="py-2"><Barcode value={item.barcode} width={1} height={40} /></td>
                          <td className="py-2 font-weight-bold">{item.name}</td>
                          <td className="py-2 text-right">{parseInt(item.cost).toLocaleString("th-TH")} ฿</td>
                          <td className="py-2 text-right">{parseInt(item.price).toLocaleString("th-TH")} ฿</td>
                          <td className="py-2 text-right">{parseInt(item.expirationdate).toLocaleString("th-TH")}</td>
                          <td className="py-2">
                            <span className="badge badge-info px-3 py-2">{item.category}</span>
                          </td>
                          <td className="text-center py-2">
                            <div className="btn-group">
                              <button
                                onClick={() => handleChooseProduct(item)}
                                data-toggle="modal"
                                data-target="#modalProductImage"
                                className="btn btn-primary btn-sm mr-1"
                                title="จัดการรูปภาพ"
                              >
                                <i className="fa fa-image"></i>
                              </button>
                              <button
                                onClick={() => setProduct(item)}
                                data-toggle="modal"
                                data-target="#modalProduct"
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

        {/* Add some custom CSS */}
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

        {/* Product Images Modal */}
        <Modal id="modalProductImage" title="ภาพสินค้า" modalSize="modal-lg">
          <div className="row">
            <div className="col-4">
              <div>Barcode</div>
              <input value={product.barcode} disabled className="form-control shadow-sm" />
            </div>
            <div className="col-8">
              <div>ชื่อสินค้า</div>
              <input value={product.name} disabled className="form-control shadow-sm" />
            </div>
            <div className="col-12 mt-3">
              <div>เลือกภาพสินค้า</div>
              <input
                onChange={(e) => handleChangeFile(e.target.files)}
                type="file"
                name="imageName"
                className="form-control shadow-sm"
              />
            </div>
          </div>

          <div className="mt-3">
            {productImage.name !== undefined && (
              <button onClick={handleUpload} className="btn btn-primary shadow-sm">
                <i className="fa fa-check mr-2"></i> Upload and Save
              </button>
            )}
          </div>

          <div className="mt-3">ภาพสินค้า</div>
          <div className="row mt-2">
            {productImages.length > 0
              ? productImages.map((item) => (
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
                        <button className="btn btn-info btn-sm mr-2 shadow-sm">ภาพหลัก</button>
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
              : <div className="col-12 text-center text-muted">ไม่มีภาพสินค้า</div>}
          </div>
        </Modal>

        {/* Product Details Modal */}
        <Modal title="ฟอร์มสินค้า" id="modalProduct">
          <form onSubmit={handleSave}>
            <div className="row">
              <div className="form-group col-md-6">
                <label>ชื่อสินค้า</label>
                <input
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  type="text"
                  className="form-control shadow-sm"
                />
              </div>
              <div className="form-group col-md-6">
                <label>ราคาทุน</label>
                <input
                  value={product.cost}
                  onChange={(e) => setProduct({ ...product, cost: e.target.value })}
                  type="number"
                  className="form-control shadow-sm"
                />
              </div>
              <div className="form-group col-md-6">
                <label>ราคาจำหน่าย</label>
                <input
                  value={product.price}
                  onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  type="number"
                  className="form-control shadow-sm"
                />
              </div>
              <div className="form-group col-md-6">
                <label>วันหมดอายุ</label>
                <input
                  value={product.expirationdate}
                  onChange={(e) => setProduct({ ...product, expirationdate: e.target.value })}
                  type="number"
                  className="form-control shadow-sm"
                />
              </div>
              <div className="form-group col-md-6">
                <label>Barcode</label>
                <input
                  value={product.barcode}
                  onChange={(e) => setProduct({ ...product, barcode: e.target.value })}
                  type="number"
                  className="form-control shadow-sm"
                />
              </div>
              <div className="form-group col-md-6">
                <label>ประเภทสินค้า</label>
                <select
                  className="form-control shadow-sm"
                  value={product.category}
                  onChange={(e) => setProduct({ ...product, category: e.target.value })}
                >
                  <option value="">เลือกประเภทสินค้า</option>
                  <option value="อาหารสดและเบเกอรี่">อาหารสดและเบเกอรี่</option>
                  <option value="ไข่ นม และผลิตภัณฑ์จากนม">ไข่ นม และผลิตภัณฑ์จากนม</option>
                  <option value="น้ำดื่ม เครื่องดื่ม และผงชงดื่ม">น้ำดื่ม เครื่องดื่ม และผงชงดื่ม</option>
                  <option value="ของแห้งและเครื่องปรุง">ของแห้งและเครื่องปรุง</option>
                  <option value="ขนมขบเคี้ยวและของหวาน">ขนมขบเคี้ยวและของหวาน</option>
                  <option value="ความงามและของใช้ส่วนตัว">ความงามและของใช้ส่วนตัว</option>
                  <option value="แม่และเด็ก">แม่และเด็ก</option>
                  <option value="ของใช้ในบ้าน">ของใช้ในบ้าน</option>
                  <option value="บ้านและไลฟ์สไตล์">บ้านและไลฟ์สไตล์</option>
                  <option value="เครื่องเขียนและอุปกรณ์สำนักงาน">เครื่องเขียนและอุปกรณ์สำนักงาน</option>
                  <option value="อาหารและอุปกรณ์สัตว์เลี้ยง">อาหารและอุปกรณ์สัตว์เลี้ยง</option>
                  <option value="เครื่องใช้ไฟฟ้า อุปกรณ์อิเล็กทรอนิกส์">เครื่องใช้ไฟฟ้า อุปกรณ์อิเล็กทรอนิกส์</option>
                  <option value="เสื้อผ้าและเครื่องประดับ">เสื้อผ้าและเครื่องประดับ</option>
                </select>
              </div>
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
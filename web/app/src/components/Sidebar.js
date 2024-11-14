import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

const Sidebar = forwardRef((props, sidebarRef) => {
  const [memberName, setMemberName] = useState();
  const [packageName, setPackageName] = useState();
  const [packages, setPackages] = useState([]);
  const [totalBill, setTotalBill] = useState(0);
  const [billAmount, setBillAmount] = useState(0);
  const [banks, setBanks] = useState([]);
  const [choosePackage, setChoosePackage] = useState({});
  const [isPackageSubscribed, setIsPackageSubscribed] = useState(false);
  const [dropdownStates, setDropdownStates] = useState({
    reports: false,
    documents: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchDataTotalBill();
  }, []);

  const fetchDataTotalBill = async () => {
    try {
      await axios
        .get(config.api_path + "/package/countBill", config.headers())
        .then((res) => {
          if (res.data.totalBill != undefined) {
            setTotalBill(res.data.totalBill);
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

  const handleTokenError = (error) => {
    if (error.response?.status === 401 || 
        error.response?.status === 403 || 
        error.response?.data?.error === 'TOKEN_NOT_FOUND') {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่',
        confirmButtonText: 'เข้าสู่ระบบ'
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      });
      return true;
    }
    return false;
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(
        config.api_path + "/member/info", 
        config.headers()
      );
      if (res.data.message === "success") {
        setMemberName(res.data.result.name);
        setPackageName(res.data.result.package.name);
        setBillAmount(res.data.result.package.bill_amount);
      }
    } catch (error) {
      if (!handleTokenError(error)) {
        Swal.fire({
          title: "error",
          text: error.message,
          icon: "error",
        });
      }
    }
  };

  const fetchPackages = async () => {
    try {
      await axios.get(config.api_path + "/package/list").then((res) => {
        if (res.data.results.length > 0) {
          setPackages(res.data.results);
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

  const renderButton = (item) => {
    if (packageName === item.name) {
      return (
        <button className="btn btn-primary btn-lg disabled" disabled>
          <i className="fa fa-check me-2"></i>
          เลือกแพคเกจ
        </button>
      );
    } else {
      return (
        <button
          data-toggle="modal"
          data-target="#modalBank"
          onClick={(e) => handleChoosePackage(item)}
          className="btn btn-primary btn-lg"
        >
          <i className="fa fa-check me-2"></i>
          เลือกแพคเกจ
        </button>
      );
    }
  };

  const handleChoosePackage = (item) => {
    setChoosePackage(item);
    fetchDataBank();
  };

  const fetchDataBank = async () => {
    if (banks.length == 0) {
      try {
        await axios
          .get(config.api_path + "/bank/list", config.headers())
          .then((res) => {
            if (res.data.message === "success") {
              setBanks(res.data.results);
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
    }
  };

  const computePercen = (totalBill, billAmount) => {
    if (billAmount > 0) {
      return (totalBill * 100) / billAmount;
    } else {
      return 0;
    }
  };

  const handleChangePackage = async () => {
    if (isPackageSubscribed) {
      Swal.fire({
        title: "ไม่สามารถสมัครได้",
        text: "คุณได้สมัครแพคเกจแล้ว",
        icon: "warning",
      });
      return;
    }

    try {
      axios
        .get(
          config.api_path + "/package/changePackage/" + choosePackage.id,
          config.headers()
        )
        .then((res) => {
          if (res.data.message === "success") {
            Swal.fire({
              title: "ส่งข้อมูล",
              text: "ส่งข้อมูลการขอเปลี่ยนแพคเกจของคุณแล้ว",
              icon: "success",
              timer: 2000,
            });

            setIsPackageSubscribed(true);

            const btns = document.getElementsByClassName("btnClose");
            for (let i = 0; i < btns.length; i++) btns[i].click();
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

  const handleDropdownClick = (dropdownId) => {
    setDropdownStates(prevStates => ({
      ...Object.keys(prevStates).reduce((acc, key) => ({
        ...acc,
        [key]: key === dropdownId ? !prevStates[key] : false
      }), {})
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDropdownStates(prevStates => 
      Object.keys(prevStates).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {})
    );
  };

  useImperativeHandle(sidebarRef, () => ({
    refreshCountBill() {
      fetchDataTotalBill();
    },
  }));

  const styles = {
    sidebar: {
      boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease',
      height: '100vh',
      background: 'linear-gradient(180deg, #2c3e50 0%, #3498db 100%)'
    },
    brandLink: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px',
      background: 'rgba(255,255,255,0.1)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s ease'
    },
    brandImage: {
      width: '35px',
      height: '35px',
      marginRight: '10px',
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.2)'
    },
    brandText: {
      color: '#fff',
      fontSize: '1.2rem',
      fontWeight: '500'
    },
    userPanel: {
      background: 'rgba(255,255,255,0.1)',
      padding: '20px',
      margin: '15px',
      borderRadius: '10px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    },
    upgradeButton: {
      background: 'linear-gradient(45deg, #f1c40f, #f39c12)',
      border: 'none',
      padding: '8px 15px',
      borderRadius: '5px',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      width: '100%'
    },
    billCard: {
      background: 'rgba(255,255,255,0.1)',
      margin: '15px',
      borderRadius: '10px',
      padding: '15px'
    },
    navContainer: {
      margin: '0',
      padding: '0 10px'
    },
    navItem: {
      margin: '2px 0',
      borderRadius: '8px',
      transition: 'all 0.3s ease'
    },
    navLink: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 15px',
      color: '#fff',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      '&:hover': {
        background: 'rgba(255,255,255,0.1)'
      }
    },
    navIcon: {
      width: '25px',
      textAlign: 'center',
      marginRight: '10px'
    },
    navText: {
      flex: 1
    },
    subMenu: {
      paddingLeft: '15px'
    }
  };

  return (
    <>
      <aside className="main-sidebar sidebar-dark-primary elevation-4" style={styles.sidebar}>
        <a href="#" className="brand-link" style={styles.brandLink}>
          <img
            src="dist/img/logo.webp"
            alt="AdminLTE Logo"
            style={styles.brandImage}
          />
          <span style={styles.brandText}>POS on Cloud</span>
        </a>

        <div className="sidebar">
          <div style={styles.userPanel}>
            <div className="text-white">
              <div className="h5 mb-2">{memberName}</div>
              <div className="text-white-50 mb-3">Package: {packageName}</div>
              <button
                onClick={fetchPackages}
                data-toggle="modal"
                data-target="#modalPackage"
                className="btn"
                style={styles.upgradeButton}
              >
                <i class="fa-solid fa-arrow-up-wide-short"></i>
                Upgrade Package
              </button>
            </div>
          </div>

          <div style={styles.billCard}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-white-50">จำนวนบิลที่ขายได้</div>
              <div>
                <span className="badge bg-success px-3 py-2">
                  {totalBill} / {billAmount.toLocaleString("th-TH")}
                </span>
              </div>
            </div>
          </div>

          {totalBill >= billAmount && (
            <div className="mx-3">
              <div className="alert alert-danger" 
                   style={{
                     background: 'rgba(220,53,69,0.2)',
                     border: '1px solid rgba(220,53,69,0.3)',
                     borderRadius: '8px'
                   }}>
                <i className="fas fa-exclamation-circle me-2"></i>
                ถึงขีดจำกัดการขายแล้ว
              </div>
            </div>
          )}

          <nav className="mt-3">
            <ul className="nav nav-pills nav-sidebar flex-column" style={styles.navContainer}>
            <li className="nav-item" style={styles.navItem}>
                <Link to="/sale" className="nav-link" style={styles.navLink}>
                  <span style={styles.navIcon}>
                  <i class="fa-solid fa-shop"></i>
                  </span>
                  <span style={styles.navText}>ขายสินค้า</span>
                </Link>
              </li>

              <li className={`nav-item ${dropdownStates.reports ? "menu-open" : ""}`} style={styles.navItem}>
                <a href="#" 
                   className="nav-link" 
                   style={styles.navLink}
                   onClick={() => handleDropdownClick('reports')}>
                  <span style={styles.navIcon}>
                    <i className="nav-icon fas fa-chart-pie"></i>
                  </span>
                  <span style={styles.navText}>
                    เอกสาร/รายงาน
                    <i className="right fas fa-angle-left ms-2"></i>
                  </span>
                </a>
                <ul className="nav nav-treeview" style={{
                  ...styles.subMenu,
                  display: dropdownStates.reports ? "block" : "none"
                }}>
                  <li className="nav-item">
                    <a href="#" 
                       className="nav-link" 
                       style={styles.navLink}
                       onClick={() => handleNavigation("/dashboard")}>
                      <span style={styles.navIcon}>
                        <i className="nav-icon fas fa-tachometer-alt"></i>
                      </span>
                      <span style={styles.navText}>แดชบอร์ด</span>
                    </a>
                  </li>
                  <li className="nav-item" >
                    <a href="#" className="nav-link" style={styles.navLink} onClick={() => handleNavigation("/dashboardreport")}>
                      <span style={styles.navIcon}>
                        <i className="fa-solid fa-file-contract"></i>
                      </span>
                      <span style={styles.navText}>รายงาน</span>
                    </a>
                  </li>
                  <li className="nav-item" style={styles.navItem}>
                <Link to="/sumSalePerDay" className="nav-link" style={styles.navLink}>
                  <span style={styles.navIcon}>
                    <i className="nav-icon fas fa-file-alt"></i>
                  </span>
                  <span style={styles.navText}>สรุปยอดขายรายวัน</span>
                </Link>
              </li>
              <li className="nav-item" style={styles.navItem}>
                <Link to="/billSales" className="nav-link" style={styles.navLink}>
                  <span style={styles.navIcon}>
                    <i className="nav-icon fas fa-list-alt"></i>
                  </span>
                  <span style={styles.navText}>รายงานบิลขาย</span>
                </Link>
              </li>

              <li className="nav-item" style={styles.navItem}>
                <Link to="/reportStock" className="nav-link" style={styles.navLink}>
                  <span style={styles.navIcon}>
                    <i className="nav-icon fas fa-file"></i>
                  </span>
                  <span style={styles.navText}>รายงาน Stock</span>
                </Link>
              </li>
                </ul>
              </li>

              <li className={`nav-item ${dropdownStates.documents ? "menu-open" : ""}`} style={styles.navItem}>
                <a href="#" 
                   className="nav-link" 
                   style={styles.navLink}
                   onClick={() => handleDropdownClick('documents')}>
                  <span style={styles.navIcon}>
                  <i class="fa-solid fa-boxes-packing"></i>
                  </span>
                  <span style={styles.navText}>
                  สินค้า
                    <i className="right fas fa-angle-left ms-2"></i>
                  </span>
                </a>
                <ul className="nav nav-treeview" style={{
                  ...styles.subMenu,
                  display: dropdownStates.documents ? "block" : "none"
                }}>
                  <li className="nav-item" style={styles.navItem}>
                <Link to="/product" className="nav-link" style={styles.navLink}>
                  <span style={styles.navIcon}>
                    <i className="nav-icon fas fa-box"></i>
                  </span>
                  <span style={styles.navText}>สินค้า</span>
                </Link>
              </li>

              <li className="nav-item" style={styles.navItem}>
                <Link to="/stock" className="nav-link" style={styles.navLink}>
                  <span style={styles.navIcon}>
                    <i className="nav-icon fas fa-home"></i>
                  </span>
                  <span style={styles.navText}>รับสินค้าเข้า Stock</span>
                </Link>
              </li>
                </ul>
              </li>
              
              <li className="nav-item" style={styles.navItem}>
                <Link to="/ReportUse" className="nav-link" style={styles.navLink}>
                  <span style={styles.navIcon}>
                  <i class="fa-solid fa-address-card"></i>
                  </span>
                  <span style={styles.navText}>แจ้งปัญหาการใช้งาน</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <Modal id="modalPackage" title="เลือกแพคเกจที่ต้องการ" modalSize="modal-lg">
        <div className="row g-4">
          {packages.length > 0
            ? packages.map((item) => (
                <div className="col-4" key={item.id}>
                  <div className="card h-100 shadow-sm hover-shadow"
                       style={{
                         borderRadius: '12px',
                         transition: 'all 0.3s ease',
                         cursor: 'pointer',
                         '&:hover': {
                           transform: 'translateY(-5px)',
                           boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                         }
                       }}>
                    <div className="card-body d-flex flex-column">
                      <div className="flex-grow-1">
                        <div className="h3">{item.name}</div>

                        <div className="h4 mt-3 text-primary">
                          <strong>
                            {isNaN(item.price)
                              ? item.price
                              : parseInt(item.price).toLocaleString("th-TH")}{" "}
                            .-
                          </strong>
                          <span className="ms-2">/ เดือน</span>
                        </div>

                        <div className="mt-3">
                          จำนวนบิล{" "}
                          <span className="text-danger ms-2 me-2">
                            <strong>
                              {isNaN(item.bill_amount)
                                ? item.bill_amount
                                : parseInt(item.bill_amount).toLocaleString(
                                    "th-TH"
                                  )}
                            </strong>
                          </span>
                          ต่อเดือน
                        </div>
                      </div>

                      <div className="mt-3 text-center">
                        {renderButton(item)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : ""}
        </div>
      </Modal>

      <Modal id="modalBank" title="ช่องทางชำระเงิน" modalSize="modal-lg">
        <div className="h4 text-secondary">
          Package ที่เลือกคือ{" "}
          <span className="text-primary">{choosePackage.name}</span>
        </div>
        <div className="mt-3 h5">
          ราคา{" "}
          <span className="text-danger">
            {parseInt(choosePackage.price).toLocaleString("th-TH")}
          </span>{" "}
          บาท/เดือน
        </div>

        <table className="table table-bordered table-striped mt-3">
          <thead>
            <tr>
              <th>ธนาคาร</th>
              <th>เลขบัญชี</th>
              <th>เจ้าของบัญชี</th>
              <th>สาขา</th>
            </tr>
          </thead>
          <tbody>
            {banks.length > 0
              ? banks.map((item) => (
                  <tr key={item.bankCode}>
                    <td>{item.bankType}</td>
                    <td>{item.bankCode}</td>
                    <td>{item.bankName}</td>
                    <td>{item.bankBranch}</td>
                  </tr>
                ))
              : ""}
          </tbody>
        </table>

        <div className="alert mt-3 alert-warning">
          <i className="fa fa-info-circle me-2"></i>
          เมื่อโอนชำระเงินแล้ว ให้แจ้งที่ไลน์ ID = Min0ru21 ชื่อ Kaimuk.j
        </div>

        <div className="mt-3 text-center">
          <button onClick={handleChangePackage} className="btn btn-primary">
            <i className="fa fa-check me-2"></i>
            ยืนยันการสมัคร
          </button>
        </div>
      </Modal>
    </>
  );
});

export default Sidebar;
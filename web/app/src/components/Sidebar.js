import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import React from "react";
import ExitIcon from "../assets/Exit.svg";
import logoGif from "../assets/coin.gif";
import shopping from "../assets/shopping.gif";
import report from "../assets/report.gif";
import Selling from "../assets/Selling.gif";
import checklist from "../assets/checklist.gif";
import candidates from "../assets/candidates.gif";
import service from "../assets/service.gif";

const Sidebar = forwardRef((props, sidebarRef) => {
  const [firstName, setfirstName] = useState();
  const [packageName, setPackageName] = useState();
  const [packages, setPackages] = useState([]);
  const [totalBill, setTotalBill] = useState(0);
  const [billAmount, setBillAmount] = useState(0);
  const [banks, setBanks] = useState([]);
  const [choosePackage, setChoosePackage] = useState({});
  const [isPackageSubscribed, setIsPackageSubscribed] = useState(false);
  const [dropdownStates, setDropdownStates] = useState({
    reports: false,
    documents: false,
    CRM: false,
  });
  const [userLevel, setUserLevel] = useState("");
  const navigate = useNavigate();
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  useEffect(() => {
    fetchData();
    fetchDataTotalBill();
    // Get user level from localStorage
    const storedUserType = localStorage.getItem("userType");
    const storedUserLevel = localStorage.getItem("userLevel");
    setUserLevel(
      storedUserLevel || (storedUserType === "member" ? "owner" : "employee")
    );
  }, []);

  const isOwner = userLevel === "owner";

  //This will display:

  //5:00-11:59 = "Good Morning"
  //12:00-16:59 = "Good Afternoon"
  //17:00-4:59 = "Good Evening"

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  const handleSignOut = () => {
    Swal.fire({
      title: "Sign out",
      text: "ยืนยันการออกจากระบบ",
      imageUrl: ExitIcon,
      imageWidth: 200,
      imageHeight: 200,
      showCancelButton: true,
      showConfirmButton: true,
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem(config.token_name);
        navigate("/");
      }
    });
  };

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
    if (
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.response?.data?.error === "TOKEN_NOT_FOUND"
    ) {
      Swal.fire({
        icon: "error",
        title: "กรุณาเข้าสู่ระบบ",
        text: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่",
        confirmButtonText: "เข้าสู่ระบบ",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      });
      return true;
    }
    return false;
  };

  const fetchData = async () => {
    try {
      // Get stored user type to determine which endpoint to use
      const userType = localStorage.getItem("userType");
      const endpoint = userType === "employee" ? "/user/info" : "/member/info";

      const res = await axios.get(config.api_path + endpoint, config.headers());

      if (res.data.message === "success") {
        if (userType === "employee") {
          setfirstName(res.data.result.name); // For employees, use name from user table
        } else {
          setfirstName(res.data.result.firstName); // For owners, use firstName from member table
        }
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
          onClick={() => handleChoosePackage(item)}
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
    setShowBankModal(true); // Add this line
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
    setDropdownStates((prevStates) => ({
      ...Object.keys(prevStates).reduce(
        (acc, key) => ({
          ...acc,
          [key]: key === dropdownId ? !prevStates[key] : false,
        }),
        {}
      ),
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDropdownStates((prevStates) =>
      Object.keys(prevStates).reduce(
        (acc, key) => ({
          ...acc,
          [key]: false,
        }),
        {}
      )
    );
  };

  useImperativeHandle(sidebarRef, () => ({
    refreshCountBill() {
      fetchDataTotalBill();
    },
  }));

  const styles = {
    sidebar: {
      boxShadow: "2px 0 10px rgba(0,0,0,0.2)",
      transition: "all 0.3s ease",
      height: "100vh",
      background: "linear-gradient(180deg, #2c3e50 0%, #3498db 100%)",
    },
    brandLink: {
      display: "flex",
      alignItems: "center",
      padding: "15px",
      background: "rgba(255,255,255,0.1)",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      transition: "all 0.3s ease",
    },
    brandImage: {
      width: "35px",
      height: "35px",
      marginRight: "10px",
      borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.2)",
    },
    brandText: {
      color: "#fff",
      fontSize: "1.2rem",
      fontWeight: "500",
    },
    userPanel: {
      position: "relative", // Add this
      background: "rgba(255,255,255,0.1)",
      padding: "20px",
      margin: "15px",
      borderRadius: "10px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    },
    signOutButton: {
      position: "absolute",
      top: "10px",
      right: "10px",
      background: "rgba(255,255,255,0.1)",
      border: "none",
      borderRadius: "50%",
      width: "35px",
      height: "35px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      transition: "all 0.3s ease",
      cursor: "pointer",
      "&:hover": {
        background: "rgba(255,255,255,0.2)",
      },
    },
    upgradeButton: {
      background: "linear-gradient(45deg, #f1c40f, #f39c12)",
      border: "none",
      padding: "8px 15px",
      borderRadius: "5px",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      width: "100%",
    },
    billCard: {
      background: "rgba(255,255,255,0.1)",
      margin: "15px",
      borderRadius: "10px",
      padding: "15px",
    },
    navContainer: {
      margin: "0",
      padding: "0 10px",
    },
    navItem: {
      margin: "2px 0",
      borderRadius: "8px",
      transition: "all 0.3s ease",
    },
    navLink: {
      display: "flex",
      alignItems: "center",
      padding: "10px 15px",
      color: "#fff",
      borderRadius: "8px",
      transition: "all 0.3s ease",
      "&:hover": {
        background: "rgba(255,255,255,0.1)",
      },
    },
    navIcon: {
      width: "25px",
      textAlign: "center",
      marginRight: "10px",
    },
    navText: {
      flex: 1,
    },
    subMenu: {
      paddingLeft: "15px",
    },
  };

  return (
    <>
      <aside
        className="main-sidebar sidebar-dark-primary elevation-4"
        style={styles.sidebar}
      >
        <a href="#" className="brand-link" style={styles.brandLink}>
          <img src={logoGif} alt="AdminLTE Logo" style={styles.brandImage} />
          <span style={styles.brandText}>POS on Cloud</span>
          <button
            onClick={handleSignOut}
            style={styles.signOutButton}
            title="Sign out"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </a>

        <div className="sidebar">
          <div style={styles.userPanel}>
            <div className="text-white">
              <div className="h5 mb-2">{getGreeting()}</div>
              <div className="h5 mb-2">
                <span className="text-warning">{firstName}</span>
                <span
                  className="badge bg-info ms-2"
                  style={{
                    padding: "5px 10px",
                    borderRadius: "15px",
                    fontSize: "0.8rem",
                    fontWeight: "normal",
                  }}
                >
                  {isOwner ? "เจ้าของร้าน" : "พนักงาน"}
                </span>
              </div>
              <div className="text-white-50 mb-3">Package: {packageName}</div>
              {isOwner && (
                <button
                  onClick={() => {
                    fetchPackages();
                    setShowPackageModal(true);  // Add this state
                  }}
                  className="btn"
                  style={styles.upgradeButton}
                >
                  <i className="fa-solid fa-arrow-up-wide-short"></i>
                  Upgrade Package
                </button>
              )}
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
              <div
                className="alert alert-danger"
                style={{
                  background: "rgba(220,53,69,0.2)",
                  border: "1px solid rgba(220,53,69,0.3)",
                  borderRadius: "8px",
                }}
              >
                <i className="fas fa-exclamation-circle me-2"></i>
                ถึงขีดจำกัดการขายแล้ว
              </div>
            </div>
          )}

          <nav className="mt-3">
            <ul
              className="nav nav-pills nav-sidebar flex-column"
              style={styles.navContainer}
            >
              {/* Sale menu - visible to all */}
              <li className="nav-item" style={styles.navItem}>
                <Link to="/sale" className="nav-link" style={styles.navLink}>
                  <span style={styles.navIcon}>
                    <img
                      src={Selling}
                      alt="Selling"
                      style={{ height: "50px", marginRight: "100px" }}
                    />
                  </span>
                  <span className="ml-3" style={styles.navText}>
                    ขายสินค้า
                  </span>
                </Link>
              </li>

              {/* Reports menu - visible only to owner */}
              {isOwner && (
                <li
                  className={`nav-item ${dropdownStates.reports ? "menu-open" : ""
                    }`}
                >
                  <a
                    href="#"
                    className="nav-link"
                    style={styles.navLink}
                    onClick={() => handleDropdownClick("reports")}
                  >
                    <span style={styles.navIcon}>
                      <img
                        src={report}
                        alt="report"
                        style={{ height: "50px", marginRight: "100px" }}
                      />
                    </span>
                    <span className="ml-3" style={styles.navText}>
                      รายงาน
                      <i className="right fas fa-angle-left ms-2"></i>
                    </span>
                  </a>
                  <ul
                    className="nav nav-treeview"
                    style={{
                      ...styles.subMenu,
                      display: dropdownStates.reports ? "block" : "none",
                    }}
                  >
                    <li className="nav-item">
                      <a
                        href="#"
                        className="nav-link"
                        style={styles.navLink}
                        onClick={() => handleNavigation("/dashboard")}
                      >
                        <span style={styles.navIcon}>
                          <i className="nav-icon fas fa-tachometer-alt"></i>
                        </span>
                        <span style={styles.navText}>แดชบอร์ด</span>
                      </a>
                    </li>
                    <li className="nav-item">
                      <a
                        href="#"
                        className="nav-link"
                        style={styles.navLink}
                        onClick={() => handleNavigation("/dashboardreport")}
                      >
                        <span style={styles.navIcon}>
                          <i className="fa-solid fa-file-contract"></i>
                        </span>
                        <span style={styles.navText}>รายงาน</span>
                      </a>
                    </li>
                    <li className="nav-item" style={styles.navItem}>
                      <Link
                        to="/sumSalePerDay"
                        className="nav-link"
                        style={styles.navLink}
                      >
                        <span style={styles.navIcon}>
                          <i className="nav-icon fas fa-file-alt"></i>
                        </span>
                        <span style={styles.navText}>สรุปยอดขายรายวัน</span>
                      </Link>
                    </li>
                    <li className="nav-item" style={styles.navItem}>
                      <Link
                        to="/billSales"
                        className="nav-link"
                        style={styles.navLink}
                      >
                        <span style={styles.navIcon}>
                          <i className="nav-icon fas fa-list-alt"></i>
                        </span>
                        <span style={styles.navText}>รายงานบิลขาย</span>
                      </Link>
                    </li>

                    <li className="nav-item" style={styles.navItem}>
                      <Link
                        to="/reportStock"
                        className="nav-link"
                        style={styles.navLink}
                      >
                        <span style={styles.navIcon}>
                          <i className="nav-icon fas fa-file"></i>
                        </span>
                        <span style={styles.navText}>รายงาน Stock</span>
                      </Link>
                    </li>
                  </ul>
                </li>
              )}

              {/* Products menu - visible to all */}
              <li
                className={`nav-item ${dropdownStates.documents ? "menu-open" : ""
                  }`}
                style={styles.navItem}
              >
                <a
                  href="#"
                  className="nav-link"
                  style={styles.navLink}
                  onClick={() => handleDropdownClick("documents")}
                >
                  <span style={styles.navIcon}>
                    <img
                      src={shopping}
                      alt="shopping"
                      style={{ height: "50px", marginRight: "100px" }}
                    />
                  </span>
                  <span className="ml-3" style={styles.navText}>
                    สินค้า
                    <i className="right fas fa-angle-left ms-2"></i>
                  </span>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    ...styles.subMenu,
                    display: dropdownStates.documents ? "block" : "none",
                  }}
                >
                  <li className="nav-item" style={styles.navItem}>
                    <Link
                      to="/product"
                      className="nav-link"
                      style={styles.navLink}
                    >
                      <span style={styles.navIcon}>
                        <i className="nav-icon fas fa-box"></i>
                      </span>
                      <span style={styles.navText}>สต๊อก</span>
                    </Link>
                  </li>

                  <li className="nav-item" style={styles.navItem}>
                    <Link
                      to="/stock"
                      className="nav-link"
                      style={styles.navLink}
                    >
                      <span style={styles.navIcon}>
                        <i className="nav-icon fas fa-home"></i>
                      </span>
                      <span style={styles.navText}>รับสินค้าเข้า Stock</span>
                    </Link>
                  </li>
                </ul>
              </li>
              <li
                className={`nav-item ${dropdownStates.CRM ? "menu-open" : ""
                  }`}
                style={styles.navItem}
              >
                <a
                  href="#"
                  className="nav-link"
                  style={styles.navLink}
                  onClick={() => handleDropdownClick("CRM")}
                >
                  <span style={styles.navIcon}>
                    <img
                      src={checklist}
                      alt="shopping"
                      style={{ height: "50px", marginRight: "100px" }}
                    />
                  </span>
                  <span className="ml-3" style={styles.navText}>
                    CRM
                    <i className="right fas fa-angle-left ms-2"></i>
                  </span>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    ...styles.subMenu,
                    display: dropdownStates.CRM ? "block" : "none" 
                  }}
                >
                  <li className="nav-item" style={styles.navItem}>
                    <Link
                      to="/customer"
                      className="nav-link"
                      style={styles.navLink}
                    >
                      <span style={styles.navIcon}>
                        <i className="fas fa-users"></i>
                      </span>
                      <span className="ml-3" style={styles.navText}>
                        ข้อมูลลูกค้า
                      </span>
                    </Link>
                  </li>

                  <li className="nav-item" style={styles.navItem}>
                    <Link
                      to="/reward"
                      className="nav-link"
                      style={styles.navLink}
                    >
                      <span style={styles.navIcon}>
                        <i className="fas fa-gift"></i>
                      </span>
                      <span className="ml-3" style={styles.navText}>
                        แลกของรางวัล
                      </span>
                    </Link>
                  </li>
                </ul>
              </li>
              
              {/* Users management - visible only to owner */}
              {isOwner && (
                <li className="nav-item" style={styles.navItem}>
                  <Link to="/user" className="nav-link" style={styles.navLink}>
                    <span style={styles.navIcon}>
                      <img
                        src={candidates}
                        alt="candidates"
                        style={{ height: "45px", marginRight: "100px" }}
                      />
                    </span>
                    <span className="ml-4" style={styles.navText}>
                      ผู้ใช้งานระบบ
                    </span>
                  </Link>
                </li>
              )}

             

              {/* Report issues - visible to all */}
             
            </ul>
          </nav>
        </div>
      </aside>

      {/* Only render package modals if user is owner */}
      {isOwner && (
        <>
          <Modal
            show={showPackageModal}
            onHide={() => setShowPackageModal(false)}
            title="เลือกแพคเกจที่ต้องการ"
            modalSize="modal-lg"
          >
            <div className="row g-4">
              {packages.length > 0
                ? packages.map((item) => (
                  <div className="col-4" key={item.id}>
                    <div
                      className="card h-100 shadow-sm hover-shadow"
                      style={{
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <div className="card-body d-flex flex-column">
                        <div className="flex-grow-1">
                          <div className="h3">{item.name}</div>

                          <div className="h4 mt-3 text-primary">
                            <strong>
                              {isNaN(item.price)
                                ? item.price
                                : parseInt(item.price).toLocaleString(
                                  "th-TH"
                                )}{" "}
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

          <Modal 
            show={showBankModal}
            onHide={() => setShowBankModal(false)}
            title="ช่องทางชำระเงิน" 
            modalSize="modal-lg"
          >
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
      )}
    </>
  );
});

export default Sidebar;

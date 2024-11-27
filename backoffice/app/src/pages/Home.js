import Template from "./Template";
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import '../styles/styles.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'warning', text: 'รอดำเนินการ' },
    in_progress: { color: 'info', text: 'กำลังดำเนินการ' },
    completed: { color: 'success', text: 'เสร็จสิ้น' },
    cancelled: { color: 'danger', text: 'ยกเลิก' }
  };

  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`badge bg-${config.color} px-3 py-2`}>
      {config.text}
    </span>
  );
};

function Home() {
  const myDate = new Date();
  const [year, setYear] = useState(myDate.getFullYear());
  const [arrYear, setArrYear] = useState(() => {
    let arr = [];
    const y = myDate.getFullYear();
    const startYear = y - 5;

    for (let i = startYear; i <= y; i++) {
      arr.push(i);
    }

    return arr;
  });
  const [myData, setMyData] = useState([]);
  const [options, setOptions] = useState(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'รายงานสรุปยอดขายรายเดือน',
          font: {
            size: 20
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: "rgba(0,0,0,0.1)"
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    };
  });
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchData();
    fetchReports();
  }, []);

  const fetchData = async () => {
    try {
      const url = config.api_path + "/changePackage/reportSumSalePerMonth";
      const payload = {
        year: year,
      };
      await axios
        .post(url, payload, config.headers())
        .then((res) => {
          if (res.data.message === "success") {
            const results = res.data.results;
            let arr = [];

            for (let i = 0; i < results.length; i++) {
              const item = results[i];
              arr.push(item.sum);
            }

            const labels = [
              "มกราคม",
              "กุมภาพันธ์",
              "มีนาคม",
              "เมษายน",
              "พฤษภาคม",
              "มิถุนายน",
              "กรกฏาคม",
              "สิงหาคม",
              "กันยายน",
              "ตุลาคม",
              "พฤศจิกายน",
              "ธันวาคม",
            ];

            setMyData({
              labels,
              datasets: [
                {
                  label: "ยอดขาย",
                  data: arr,
                  backgroundColor: "rgba(255, 99, 132, 0.2)",
                },
              ],
            });
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

  const fetchReports = async () => {
    try {
      const response = await axios.get(config.api_path + '/reportUse', config.headers());
      setReports(response.data);
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const response = await axios.put(
        `${config.api_path}/reportUse/${reportId}`,
        {
          status: newStatus,
          response: `Status updated to ${newStatus}`
        },
        config.headers()
      );

      if (response.data.message === 'success') {
        Swal.fire({
          title: 'สำเร็จ',
          text: 'อัพเดทสถานะเรียบร้อย',
          icon: 'success',
          timer: 1000
        });
        fetchReports(); // Refresh reports list
      }
    } catch (e) {
      Swal.fire({
        title: 'error',
        text: e.message,
        icon: 'error'
      });
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const result = await Swal.fire({
        title: 'ยืนยันการลบ',
        text: 'คุณต้องการลบรายการนี้ใช่หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      });

      if (result.isConfirmed) {
        const response = await axios.delete(
          `${config.api_path}/reportUse/${reportId}`,
          config.headers()
        );

        if (response.data.message === 'success') {
          Swal.fire({
            title: 'สำเร็จ',
            text: 'ลบรายการเรียบร้อย',
            icon: 'success',
            timer: 1000
          });
          fetchReports();
        }
      }
    } catch (e) {
      Swal.fire({
        title: 'error',
        text: e.message,
        icon: 'error'
      });
    }
  };

  return (
    <Template>
      <div className="dashboard-container">
        <div className="card dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-chart-line me-2"></i>
              Dashboard
            </h2>
          </div>
          <div className="card-body">
            <div className="row align-items-center mb-4">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-calendar-alt"></i>
                  </span>
                  <select
                    className="form-control form-control-lg"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    {arrYear.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <button onClick={fetchData} className="btn btn-primary btn-lg w-100">
                  <i className="fas fa-sync-alt me-2"></i>
                  แสดงรายการ
                </button>
              </div>
            </div>

            <div className="chart-container" style={{ height: '60vh', position: 'relative' }}>
              {myData.datasets != null ? (
                <Bar options={options} data={myData} />
              ) : (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reports Management Section */}
        <div className="card dashboard-card mt-4">
          <div className="card-header bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="card-title h4 m-0">
                <i className="fas fa-ticket-alt me-2 text-primary"></i>
                รายการแจ้งปัญหา
              </h2>
              <button 
                className="btn btn-light border-primary text-primary hover-primary px-4 d-flex align-items-center"
                onClick={fetchReports}
              >
                <i className="fas fa-sync-alt me-2"></i>
                <span className="d-none d-md-inline">รีเฟรชข้อมูล</span>
              </button>
            </div>
          </div>
          
          {reports.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>หัวข้อ</th>
                      <th>รายละเอียด</th>
                      <th>ชื่อผู้ติดต่อ</th>
                      <th>เบอร์โทรติดต่อ</th>
                      <th>สถานะ</th>
                      <th>วันที่แจ้ง</th>
                      <th>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="fade-in">
                        <td className="text-nowrap">{report.subject}</td>
                        <td>
                          <div className="text-truncate" style={{maxWidth: '300px'}}>
                            {report.message}
                          </div>
                        </td>
                        <td className="text-nowrap">
                        <i class="fa-solid fa-signature"> </i>
                           {report.contactName}
                        </td>
                        <td className="text-nowrap">
                          <i className="fas fa-phone me-2"></i>
                          {report.phoneNumber}
                        </td>
                        <td>
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="text-nowrap">
                          {new Date(report.createdAt).toLocaleString('th-TH')}
                        </td>
                        <td>
                          {report.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleUpdateStatus(report.id, 'completed')}>
                                <i className="fas fa-check me-1"></i>
                                เสร็จสิ้น
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleUpdateStatus(report.id, 'cancelled')}>
                                <i className="fas fa-times me-1"></i>
                                ยกเลิก
                              </button>
                            </>
                          )}
                          {(report.status === 'completed' || report.status === 'cancelled') && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteReport(report.id)}>
                              <i className="fas fa-trash me-1"></i>
                              ลบ
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Template>
  );
}

export default Home;

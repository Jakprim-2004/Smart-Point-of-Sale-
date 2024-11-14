import React, { useEffect, useState } from "react";
import Template from "../components/Template";
import config from "../config";
import axios from "axios";
import Swal from "sweetalert2";

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const myDate = new Date();
  const [year, setYear] = useState(myDate.getFullYear());
  const [month, setMonth] = useState(myDate.getMonth() + 1);
  const [viewType, setViewType] = useState("daily");
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
  const [stockData, setStockData] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [topSellingCategories, setTopSellingCategories] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [options, setOptions] = useState({
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            let label = tooltipItem.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += parseFloat(tooltipItem.raw).toFixed(2) + " บาท";
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function (value) {
            return parseFloat(value).toFixed(2);
          },
        },
      },
    },
  });

  useEffect(() => {
    reportSumSalePerMonth();
    reportStock();
    reportTopSellingProducts();
    reportTopSellingCategories();
  }, [year, month, viewType]); 

  const reportSumSalePerMonth = async () => {
    try {
      const url = config.api_path + "/reportSumSalePerMonth";
      const payload = { year, month, viewType }; 

      const res = await axios.post(url, payload, config.headers());
      if (res.data.message === "success") {
        const results = res.data.results;
        let salesData = [],
          profitData = [],
          costData = [];

        if (viewType === "daily") {
          const daysInMonth = new Date(year, month, 0).getDate(); 
          salesData = Array(daysInMonth).fill(null);
          profitData = Array(daysInMonth).fill(null);
          costData = Array(daysInMonth).fill(null);
          results.forEach((item) => {
            salesData[item.day - 1] = item.sum;
            profitData[item.day - 1] = item.profit;
            costData[item.day - 1] = item.cost;
          });
        } else if (viewType === "weekly") {
          const weeksInMonth = 4; 
          salesData = Array(weeksInMonth).fill(null);
          profitData = Array(weeksInMonth).fill(null);
          costData = Array(weeksInMonth).fill(null);
          results.forEach((item) => {
            const weekOfMonth = Math.ceil(new Date(year, month - 1, item.day).getDate() / 7);
            if (weekOfMonth <= weeksInMonth) {
              salesData[weekOfMonth - 1] = item.sum;
              profitData[weekOfMonth - 1] = item.profit;
              costData[weekOfMonth - 1] = item.cost;
            }
          });
        } else if (viewType === "monthly") {
          salesData = Array(12).fill(null);
          profitData = Array(12).fill(null);
          costData = Array(12).fill(null);
          results.forEach((item) => {
            salesData[item.month - 1] = item.sum;
            profitData[item.month - 1] = item.profit;
            costData[item.month - 1] = item.cost;
          });
        }

        const labels =
          viewType === "monthly"
            ? [
              "มกราคม",
              "กุมภาพันธ์",
              "มีนาคม",
              "เมษายน",
              "พฤษภาคม",
              "มิถุนายน",
              "กรกฎาคม",
              "สิงหาคม",
              "กันยายน",
              "ตุลาคม",
              "พฤศจิกายน",
              "ธันวาคม",
            ]
            : viewType === "weekly"
              ? Array.from({ length: 4 }, (_, i) => `สัปดาห์ที่ ${i + 1}`)
              : Array.from(
                { length: salesData.length },
                (_, i) => `วันที่ ${i + 1}`
              );

        setMyData({
          labels,
          datasets: [
            {
              label: "ยอดขายรวม",
              data: salesData,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
            {
              label: "ราคาต้นทุน",
              data: costData,
              backgroundColor: "rgba(153, 102, 255, 0.6)",
              borderColor: "rgba(153, 102, 255, 1)",
              borderWidth: 1,
            },
            {
              label: "กำไร",
              data: profitData,
              backgroundColor: "rgba(255, 99, 132, 0.6)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            },
          ],
        });

        setTotalSales(res.data.totalSales);
        setTotalProfit(res.data.totalProfit);
        setTotalCost(res.data.totalCost);
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const reportStock = async () => {
    try {
      const url = config.api_path + "/reportStock";
      const res = await axios.get(url, config.headers());
      if (res.data.message === "success") {
        const results = res.data.results;
        let stockData = results
          .map((item) => ({
            productId: item.productId,
            productName: item.productName,
            remainingQty: item.totalQty,
          }))
          .sort((a, b) => a.remainingQty - b.remainingQty);

        setStockData(stockData);
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const reportTopSellingProducts = async () => {
    try {
      const url = config.api_path + "/reportTopSellingProducts";
      const res = await axios.get(url, config.headers());
      if (res.data.message === "success") {
        const results = res.data.results;
        const filteredResults = results.slice(0, 5); 
        setTopSellingProducts(filteredResults);
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const reportTopSellingCategories = async () => {
    try {
      const url = config.api_path + "/reportTopSellingCategories";
      const res = await axios.get(url, config.headers());
      if (res.data.message === "success") {
        const results = res.data.results;
        const filteredResults = results.slice(0, 5);
        setTopSellingCategories(filteredResults);
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const containerStyle = {
    backgroundColor: "#f8f9fa",
    padding: "25px",
    borderRadius: "15px",
    fontFamily: "'Kanit', sans-serif",
    minHeight: "100vh",
  };

  const summaryCardStyle = {
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    height: "100%",
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };


 

  const formatNumber = (num) => {
    return Number(num).toLocaleString("th-TH");
  };

  return (
    <Template>
      <div style={containerStyle}>
        <div className="card-body mb-4">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card text-center" style={summaryCardStyle}>
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">ยอดขาย/ปี</h5>
                </div>
                <div className="card-body">
                  <h3 className="mb-0">{formatNumber(totalSales)} บาท</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center" style={summaryCardStyle}>
                <div className="card-header bg-warning text-white">
                  <h5 className="mb-0">ต้นทุน/ปี</h5>
                </div>
                <div className="card-body">
                  <h3 className="mb-0">{formatNumber(totalCost)} บาท</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center" style={summaryCardStyle}>
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">กำไรสุทธิ/ปี</h5>
                </div>
                <div className="card-body">
                  <h3 className="mb-0">{formatNumber(totalProfit)} บาท</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100" style={summaryCardStyle}>
              <div className="card-header text-center bg-info">
                <h4>สินค้าคงเหลือ</h4>
                
              </div>
              <div
                className="card-body"
                style={{
                  height: "320px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    overflowY: "auto",
                    padding: "15px",
                  }}
                >
                  {stockData.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {stockData.map((item, index) => (
                        <li
                          key={index}
                          style={{
                            padding: "10px",
                            borderBottom: "1px solid #ddd",
                          }}
                        >
                          <strong>สินค้า:</strong> {item.productName} <br />
                          <strong>จำนวนคงเหลือ:</strong> {item.remainingQty}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="alert alert-info text-center">
                      ไม่มีข้อมูลสต๊อก
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100" style={summaryCardStyle}>
              <div className="card-header text-center bg-info">
                <h4>สินค้าขายดี</h4>
              </div>
              <div
                className="card-body"
                style={{
                  height: "320px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    overflowY: "auto",
                    padding: "15px",
                  }}
                >
                  {topSellingProducts.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {topSellingProducts.map((item, index) => (
                        <li
                          key={index}
                          style={{
                            padding: "10px",
                            borderBottom: "1px solid #ddd",
                          }}
                        >
                          <strong>สินค้า:</strong> {item.productName} <br />
                          <strong>จำนวนที่ขายได้:</strong> {item.totalQty}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="alert alert-info text-center">
                      ไม่มีข้อมูลสินค้าขายดี
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100" style={summaryCardStyle}>
              <div className="card-header text-center bg-info">
                <h4>หมวดหมู่ขายดี</h4>
              </div>
              <div
                className="card-body"
                style={{
                  height: "320px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    overflowY: "auto",
                    padding: "15px",
                  }}
                >
                  {topSellingCategories.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {topSellingCategories.map((item, index) => (
                        <li
                          key={index}
                          style={{
                            padding: "10px",
                            borderBottom: "1px solid #ddd",
                          }}
                        >
                          <strong>หมวดหมู่:</strong> {item.category} <br />

                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="alert alert-info text-center">
                      ไม่มีข้อมูลหมวดหมู่ขายดี
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Template>
  );
}

export default Dashboard;
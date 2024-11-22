import React, { useEffect, useState } from "react";
import Template from "../components/Template";
import config from "../config";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from 'react-router-dom';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,  // Add this
  PointElement,  // Add this
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";  // Add Line import

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,  // Add this
  PointElement,  // Add this
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const myDate = new Date();
  const [year] = useState(myDate.getFullYear());
  const [month] = useState(myDate.getMonth() + 1);
  const [viewType] = useState("daily"); // unused but kept for future use with API
  const [topSellingViewType, setTopSellingViewType] = useState('products');
  const [paymentChartType, setPaymentChartType] = useState('pie');
  const [topSellingChartType, setTopSellingChartType] = useState('pie');
  const [hourlyChartType, setHourlyChartType] = useState('line'); // Add this state
  const navigate = useNavigate();

  // Keep existing state variables for data
  const [stockData, setStockData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [topSellingCategories, setTopSellingCategories] = useState([]);
  const [todaySales, setTodaySales] = useState({
    date: new Date(),
    totalAmount: 0,
    billCount: 0,
    averagePerBill: 0,
    hourlyData: [],
    topProducts: [],
    growthRate: 0,
    yesterdayTotal: 0,
    yesterdayBillCount: 0,
    yesterdayAveragePerBill: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [paymentStats, setPaymentStats] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Remove unused options state and replace with simple object
  const chartOptions = {
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
  };

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {

    reportStock();
    reportTopSellingProducts();
    reportTopSellingCategories();
    getTodaySalesReport(); // Add this line
    getPaymentStats(); // Add this line
  }, [year, month, viewType]);

  useEffect(() => {
    calculateLowStockCount(); // Add this
  }, [stockData]);

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

  const getTodaySalesReport = async () => {
    try {
      const url = config.api_path + "/todaySalesReport";
      const res = await axios.get(url, config.headers());

      if (res.data.message === "success") {
        const data = res.data.results;

        setTodaySales({
          date: new Date(data.date),
          totalAmount: data.totalAmount || 0,
          billCount: data.billCount || 0,
          averagePerBill: data.averagePerBill || 0,
          hourlyData: data.hourlyData || [],
          topProducts: data.topProducts || [],
          growthRate: data.growthRate || 0,
          yesterdayTotal: data.yesterdayTotal || 0,
          yesterdayBillCount: data.yesterdayBillCount || 0,
          yesterdayAveragePerBill: data.yesterdayAveragePerBill || 0,
        });
      }
    } catch (error) {

      Swal.fire({
        title: "error",
        text: error.message,
        icon: "error",
      });
    }
  };

  const getPaymentStats = async () => {
    try {
      const url = config.api_path + "/paymentMethodStats";
      const res = await axios.get(url, config.headers());
      if (res.data.message === "success") {
        setPaymentStats(res.data.results);
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  // ปรับค่า threshold สำหรับแยกระดับสินค้าใกล้หมด
  const calculateLowStockCount = () => {
    const CRITICAL_THRESHOLD = 5;  // สีแดง
    const WARNING_THRESHOLD = 10;  // สีเหลือง
    const lowStockProducts = stockData.filter(item => item.remainingQty <= WARNING_THRESHOLD);
    setLowStockCount(lowStockProducts.length);
    setLowStockItems(lowStockProducts); 
  };

  const navigateToBillSales = () => {
    navigate('/billSales');
  };

  const navigateToStock = () => {
    navigate('/reportStock');
  };

  const renderTopSellingContent = () => {
    if (topSellingViewType === 'products') {
      const totalAmount = topSellingProducts.reduce((sum, item) => 
        sum + parseFloat(item.totalAmount || 0), 0);
  
      const chartData = {
        labels: topSellingProducts.map(item => ''),  // Empty labels for chart
        datasets: [{
          data: topSellingProducts.map(item => parseFloat(item.totalAmount || 0)),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
        }]
      };
  
      return topSellingProducts.length > 0 ? (
        <div style={{ position: 'relative', height: '100%', padding: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'start' }}>
            <div style={{ width: '35%', height: '150px' }}> {/* ปรับขนาดตรงนี้ */}
              {topSellingChartType === 'pie' ? (
                <Pie
                  data={chartData}
                  options={{
                    maintainAspectRatio: true,
                    aspectRatio: 1, // ปรับให้กราฟเป็นวงกลมสมบูรณ์
                    plugins: {
                      legend: { display: false },
                      tooltip: { 
                        enabled: true,
                        callbacks: {
                          title: (items) => {
                            if (!items.length) return '';
                            const index = items[0].dataIndex;
                            return topSellingProducts[index]?.productName || '';
                          },
                          label: (item) => {
                            const value = parseFloat(item.raw || 0);
                            return `฿${value.toLocaleString()}`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <Bar
                  data={{
                    labels: topSellingProducts.map(() => ''), // Empty labels
                    datasets: [{
                      data: topSellingProducts.map(item => parseFloat(item.totalAmount || 0)),
                      backgroundColor: chartData.datasets[0].backgroundColor
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          title: (items) => {
                            if (!items.length) return '';
                            const index = items[0].dataIndex;
                            return topSellingProducts[index]?.productName || '';
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        ticks: { display: false } // Hide y-axis labels
                      }
                    }
                  }}
                />
              )}
            </div>
            <div style={{ width: '65%', paddingLeft: '20px' }}> {/* เพิ่มพื้นที่ส่วนข้อมูล */}
              {topSellingProducts.map((item, index) => {
                const amount = parseFloat(item.totalAmount || 0);
                const percentage = ((amount / totalAmount) * 100).toFixed(2);
                return (
                  <div 
                    key={index}
                    style={{
                      marginBottom: '15px',
                      borderLeft: `3px solid ${chartData.datasets[0].backgroundColor[index]}`,
                      paddingLeft: '10px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                    <div style={{ color: '#666' }}>
                      ฿{amount.toLocaleString()}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.9em' }}>
                      ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info text-center">
          ไม่มีข้อมูลสินค้าขายดี
        </div>
      );
    } else {
      const totalAmount = topSellingCategories.reduce((sum, item) => 
        sum + parseFloat(item.totalAmount || 0), 0);
  
      const chartData = {
        labels: topSellingCategories.map(item => ''),
        datasets: [{
          data: topSellingCategories.map(item => parseFloat(item.totalAmount || 0)),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
        }]
      };
  
      return topSellingCategories.length > 0 ? (
        <div style={{ position: 'relative', height: '100%', padding: '10px' }}>
          <div className="d-flex justify-content-end mb-2">
            <i 
              className="fas fa-chart-pie mx-2" 
              style={topSellingChartType === 'pie' ? styles.activeIcon : styles.inactiveIcon}
              onClick={() => setTopSellingChartType('pie')}
              title="กราฟวงกลม"
            />
            <i 
              className="fas fa-chart-bar mx-2" 
              style={topSellingChartType === 'bar' ? styles.activeIcon : styles.inactiveIcon}
              onClick={() => setTopSellingChartType('bar')}
              title="กราฟแท่ง"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'start' }}>
            <div style={{ width: '35%', height: '150px' }}> {/* ปรับขนาดตรงนี้ */}
              {topSellingChartType === 'pie' ? (
                <Pie
                  data={chartData}
                  options={{
                    maintainAspectRatio: true,
                    aspectRatio: 1, // ปรับให้กราฟเป็นวงกลมสมบูรณ์
                    plugins: {
                      legend: { display: false },
                      tooltip: { 
                        enabled: true,
                        callbacks: {
                          title: (items) => {
                            if (!items.length) return '';
                            const index = items[0].dataIndex;
                            return topSellingCategories[index]?.category || '';
                          },
                          label: (item) => {
                            const value = parseFloat(item.raw || 0);
                            return `฿${value.toLocaleString()}`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <Bar
                  data={{
                    labels: topSellingCategories.map(() => ''), // Empty labels
                    datasets: [{
                      data: topSellingCategories.map(item => parseFloat(item.totalAmount || 0)),
                      backgroundColor: chartData.datasets[0].backgroundColor
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          title: (items) => {
                            if (!items.length) return '';
                            const index = items[0].dataIndex;
                            return topSellingCategories[index]?.category || '';
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        ticks: { display: false } // Hide y-axis labels
                      }
                    }
                  }}
                />
              )}
            </div>
            <div style={{ width: '65%', paddingLeft: '20px' }}> {/* เพิ่มพื้นที่ส่วนข้อมูล */}
              {topSellingCategories.map((item, index) => {
                const amount = parseFloat(item.totalAmount || 0);
                const percentage = ((amount / totalAmount) * 100).toFixed(2);
                return (
                  <div key={index} style={{
                    marginBottom: '15px',
                    borderLeft: `3px solid ${chartData.datasets[0].backgroundColor[index]}`,
                    paddingLeft: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{item.category}</div>
                    <div style={{ color: '#666' }}>
                      ฿{amount.toLocaleString()}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.9em' }}>
                      ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info text-center">
          ไม่มีข้อมูลหมวดหมู่ขายดี
        </div>
      );
    }
  };
  

  const renderPaymentChart = () => {
    const total = paymentStats.reduce((sum, stat) => sum + parseFloat(stat.total || 0), 0);
  
    const chartData = {
      labels: paymentStats.map(stat => ''), // Empty labels
      datasets: [{
        data: paymentStats.map(stat => stat.total),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ]
      }]
    };
  
    const barChartOptions = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const index = items[0].dataIndex;
              return paymentStats[index]?.paymentMethod || '';
            }
          }
        }
      },
      scales: {
        y: {
          ticks: { display: false } // Hide y-axis labels
        }
      }
    };

    return (
      <div style={{ position: 'relative', height: '100%', padding: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'start' }}>
          <div style={{ width: '35%', height: '150px' }}> {/* ปรับขนาดตรงนี้ */}
            {paymentChartType === 'pie' ? (
              <Pie
                data={chartData}
                options={{
                  maintainAspectRatio: true,
                  aspectRatio: 1, // ปรับให้กราฟเป็นวงกลมสมบูรณ์
                  plugins: { 
                    legend: { display: false },
                    tooltip: { 
                      enabled: true,
                      callbacks: {
                        title: (items) => {
                          if (!items.length) return '';
                          const index = items[0].dataIndex;
                          return paymentStats[index]?.paymentMethod || '';
                        },
                        label: (item) => {
                          const value = parseFloat(item.raw || 0);
                          return `฿${value.toLocaleString()}`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: paymentStats.map(() => ''), // Empty labels
                  datasets: [{
                    data: paymentStats.map(stat => stat.total),
                    backgroundColor: chartData.datasets[0].backgroundColor
                  }]
                }}
                options={barChartOptions}
              />
            )}
          </div>
          <div style={{ width: '65%', paddingLeft: '20px' }}> {/* เพิ่มพื้นที่ส่วนข้อมูล */}
            {paymentStats.map((stat, index) => {
              const amount = parseFloat(stat.total || 0);
              const percentage = ((amount / total) * 100).toFixed(2);
              return (
                <div 
                  key={index}
                  style={{
                    marginBottom: '15px',
                    borderLeft: `3px solid ${chartData.datasets[0].backgroundColor[index]}`,
                    paddingLeft: '10px'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{stat.paymentMethod}</div>
                  <div style={{ color: '#666' }}>
                    ฿{amount.toLocaleString()}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.9em' }}>
                    ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  

  // Consolidate styles into a single styles object
  const styles = {
    container: {
      backgroundColor: "#f8f9fa",
      padding: "25px",
      borderRadius: "15px",
      fontFamily: "'Kanit', sans-serif",
      minHeight: "100vh",
    },
    summaryCard: {
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
      height: "100%",
      border: "none",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    modernHeader: {
      backgroundColor: "#4dabf7",
      color: "white",
      padding: "15px 20px",
      fontSize: "18px",
      fontWeight: "600",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: "12px 12px 0 0",
      background: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)',
    },
    chartIcon: {
      cursor: 'pointer',
      padding: '5px 10px',
      fontSize: '1.2rem',
      transition: 'all 0.2s'
    },
    activeIcon: {
      color: '#0dcaf0',
      transform: 'scale(1.2)'
    },
    inactiveIcon: {
      color: '#6c757d'
    },
    clickableNumber: {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    clickableNumberHover: {
      backgroundColor: '#e9ecef',
      color: '#0dcaf0'
    }
  };

  // Add new state for hover
  const [billCountHover, setBillCountHover] = useState(false);
  const [averageHover, setAverageHover] = useState(false);

  return (
    <Template>
      <div style={styles.container}>

        <div className="row mb-4">

          <div className="col-12">
            <div style={{...styles.chartContainer, background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'}}>


              <div style={styles.modernHeader}>
                <h4 style={{ margin: 0, fontWeight: '600' }}>
                  <i className="fas fa-chart-line fa-beat  me-2"></i>
                  ยอดขายวันนี้ {currentTime.toLocaleDateString('th-TH')} 
                  <span className="ms-2 badge bg-light text-dark">
                    {currentTime.toLocaleTimeString('th-TH')}
                  </span>
                </h4>
              </div>

              <div className="row p-4 g-4">
                <div className="col-md-3">
                  <div style={styles.statCard} className="text-center">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5 className="mb-0">ยอดรวม</h5>
                      <i className="fas fa-wallet text-primary fa-lg"></i>
                    </div>
                    <h3 className="text-primary mb-0">฿ {todaySales.totalAmount.toLocaleString()}</h3>
                    
                  </div>
                </div>

                <div className="col-md-3">
                  <div style={styles.statCard} className="text-center">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5 className="mb-0">การเติบโต</h5>
                      <i className={`fas fa-trending-${todaySales.growthRate >= 0 ? 'up text-success' : 'down text-danger'} fa-lg`}></i>
                    </div>
                    <h3 style={{ color: todaySales.growthRate < 0 ? '#dc3545' : '#198754' }}>
                      {todaySales.growthRate >= 0 ? "+" : ""}{todaySales.growthRate}%
                    </h3>
                    <small className="text-muted">
                      เทียบกับยอดขายเมื่อวาน (฿ {todaySales.yesterdayTotal.toLocaleString()})
                    </small>
                  </div>
                </div>

                <div className="col-md-3">
                  <div style={styles.statCard} className="text-center">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5 className="mb-0">จำนวนบิล</h5>
                      <i className="fas fa-receipt text-info fa-lg"></i>
                    </div>
                    <h3 
                      className="text-info mb-0"
                      style={{
                        ...styles.clickableNumber,
                        ...(billCountHover ? styles.clickableNumberHover : {})
                      }}
                      onClick={navigateToBillSales}
                      onMouseEnter={() => setBillCountHover(true)}
                      onMouseLeave={() => setBillCountHover(false)}
                    >
                      <u>{todaySales.billCount} บิล</u>
                    </h3>
                    <small className="text-muted d-block mt-2">
                      เมื่อวาน: {todaySales.yesterdayBillCount} บิล
                      <span className={`ms-2 ${todaySales.billCountGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                        {todaySales.billCountGrowth > 0 && '+'}{todaySales.billCountGrowth}
                      </span>
                    </small>
                  </div>
                </div>

                <div className="col-md-3">
                  <div style={styles.statCard} className="text-center">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5 className="mb-0">เฉลี่ย/บิล</h5>
                      <i className="fas fa-calculator text-info fa-lg"></i>
                    </div>
                    <h3 
                      className="text-info mb-0"
                      style={{
                        ...styles.clickableNumber,
                        ...(averageHover ? styles.clickableNumberHover : {})
                      }}
                      onClick={navigateToBillSales}
                      onMouseEnter={() => setAverageHover(true)}
                      onMouseLeave={() => setAverageHover(false)}
                    >
                      <u>฿ {todaySales.averagePerBill.toLocaleString()}</u>
                    </h3>
                    <small className="text-muted d-block mt-2">
                      เมื่อวาน: ฿ {todaySales.yesterdayAveragePerBill.toLocaleString()}
                      <span className={`ms-2 ${todaySales.averageGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                        {todaySales.averageGrowth > 0 && '+'}{todaySales.averageGrowth}
                      </span>
                    </small>
                  </div>
                </div>

                

              </div>

              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">
                    <i className="fas fa-clock fa-spin fa-xl me-2"></i>
                    ยอดขายตามช่วงเวลา
                  </h5>
                  <div>
                    <i 
                      className="fas fa-chart-line mx-2" 
                      style={hourlyChartType === 'line' ? styles.activeIcon : styles.inactiveIcon}
                      onClick={() => setHourlyChartType('line')}
                      title="กราฟเส้น"
                    />
                    <i 
                      className="fas fa-chart-bar mx-2" 
                      style={hourlyChartType === 'bar' ? styles.activeIcon : styles.inactiveIcon}
                      onClick={() => setHourlyChartType('bar')}
                      title="กราฟแท่ง"
                    />
                  </div>
                </div>
                <div style={{ height: '250px', padding: '20px', background: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  {hourlyChartType === 'line' ? (
                    <Line
                      options={{
                        ...chartOptions,
                        maintainAspectRatio: false
                      }}
                      data={{
                        labels: todaySales.hourlyData.map(h => `${h.hour}:00`),
                        datasets: [{
                          label: 'ยอดขาย',
                          data: todaySales.hourlyData.map(h => h.amount),
                          borderColor: 'rgb(75, 192, 192)',
                          backgroundColor: 'rgba(75, 192, 192, 0.5)',
                          tension: 0.3,
                          fill: true
                        }]
                      }}
                    />
                  ) : (
                    <Bar
                      options={{
                        ...chartOptions,
                        maintainAspectRatio: false
                      }}
                      data={{
                        labels: todaySales.hourlyData.map(h => `${h.hour}:00`),
                        datasets: [{
                          label: 'ยอดขาย',
                          data: todaySales.hourlyData.map(h => h.amount),
                          backgroundColor: 'rgba(75, 192, 192, 0.6)'
                        }]
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>



        <div className="row g-4">
        <div className="col-md-4 ">
            <div className="card h-100" style={styles.summaryCard}>
              <div className="card-header text-center bg-info">
                <div className="d-flex justify-content-between align-items-center">                      
                  <div className="d-flex align-items-center gap-2">
                    <i className="fa-solid fa-star fa-shake fa-2xl" style={{ color: "#FFD43B" }}></i>
                    <select 
                      className="form-select form-select-sm" 
                      style={{ 
                        width: 'auto',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        paddingRight: '2rem'
                      }}
                      value={topSellingViewType}
                      onChange={(e) => setTopSellingViewType(e.target.value)}
                    > 
                      <option value="products" style={{ color: 'black' }}> สินค้า</option>
                      <option value="categories" style={{ color: 'black' }}>หมวดหมู่ </option>
                    </select>
                    <span className="text-white">ขายดี 5 อันดับ</span>
                  </div>
                  <div>
                    <i 
                      className="fas fa-chart-pie mx-2" 
                      style={topSellingChartType === 'pie' ? styles.activeIcon : styles.inactiveIcon}
                      onClick={() => setTopSellingChartType('pie')}
                      title="กราฟวงกลม"
                    />
                    <i 
                      className="fas fa-chart-bar mx-2" 
                      style={topSellingChartType === 'bar' ? styles.activeIcon : styles.inactiveIcon}
                      onClick={() => setTopSellingChartType('bar')}
                      title="กราฟแท่ง"
                    />
                  </div>
                </div>   
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
                  {renderTopSellingContent()}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100" style={styles.summaryCard}>
              <div className="card-header text-center bg-info">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0"><i class="fa-solid fa-money-bill-transfer fa-flip fa-lg" style={{color: "#365dba"}}></i> วิธีการชำระเงิน</h4>
                  <div>
                    <i 
                      className="fas fa-chart-pie mx-2" 
                      style={paymentChartType === 'pie' ? styles.activeIcon : styles.inactiveIcon}
                      onClick={() => setPaymentChartType('pie')}
                      title="กราฟวงกลม"
                    />
                    <i 
                      className="fas fa-chart-bar mx-2" 
                      style={paymentChartType === 'bar' ? styles.activeIcon : styles.inactiveIcon}
                      onClick={() => setPaymentChartType('bar')}
                      title="กราฟแท่ง"
                    />
                  </div>
                </div>
              </div>
              <div className="card-body">
                {renderPaymentChart()}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100" style={styles.summaryCard}>
              <div className="card-header text-center bg-warning text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">
                    <i className="fas fa-box-open fa-fade me-2"></i>
                    สินค้าใกล้หมด
                  </h4>
                  <span 
                    onClick={navigateToStock}
                    className="badge bg-danger fs-5" 
                    style={{ 
                      padding: '8px 15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.target.style.transform = 'scale(1.1)';
                      e.target.style.backgroundColor = '#bb2d3b';
                    }}
                    onMouseLeave={e => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.backgroundColor = '#dc3545';
                    }}
                    title="คลิกเพื่อดูายละเอียด"
                  >
                    {lowStockCount} รายการ
                  </span>
                </div>
              </div>
              <div 
                className="card-body"
                style={{
                  height: "320px",
                  overflowY: "auto",
                  padding: "0",
                }}
              >
                {lowStockItems.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {/* แสดงสินค้าที่ใกล้หมดระดับวิกฤต (สีแดง) */}
                    {lowStockItems
                      .filter(item => item.remainingQty <= 5)
                      .map((item, index) => (
                        <div
                          key={`critical-${index}`}
                          className="list-group-item"
                          style={{
                            borderLeft: "4px solid #dc3545",
                            padding: "15px",
                            backgroundColor: 'rgba(220, 53, 69, 0.05)'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1 fw-bold">{item.productName}</h6>
                              <div className="badge bg-danger fs-6">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                เหลือ: {item.remainingQty} ชิ้น
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}

                    {/* แสดงสินค้าที่ใกล้หมดระดับเตือน (สีเหลือง) */}
                    {lowStockItems
                      .filter(item => item.remainingQty > 5 && item.remainingQty <= 10)
                      .map((item, index) => (
                        <div
                          key={`warning-${index}`}
                          className="list-group-item"
                          style={{
                            borderLeft: "4px solid #ffc107",
                            padding: "15px",
                            backgroundColor: 'rgba(255, 193, 7, 0.05)'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1 fw-bold">{item.productName}</h6>
                              <div className="badge bg-warning text-dark fs-6">
                                <i className="fas fa-exclamation me-1"></i>
                                เหลือ: {item.remainingQty} ชิ้น
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-success m-3 text-center">
                    <i className="fas fa-check-circle fa-2x mb-2"></i>
                    <p className="mb-0">สินค้าในคลังมีเพียงพอ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Template>
  );
}

export default Dashboard;
import React, { useEffect, useState } from "react";
import Template from "../components/Template";
import config from "../config";
import axios from "axios";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
);

function Dashboard() {
  const myDate = new Date();
  const [year, setYear] = useState(myDate.getFullYear());
  const [month, setMonth] = useState(myDate.getMonth() + 1);
  const [viewType, setViewType] = useState("daily");
  const [arrYear, ] = useState(() => {
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
  const [options, ] = useState({
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

  const [dateRange, setDateRange] = useState("today");
  const [dateRangeValue, setDateRangeValue] = useState([null, null]);
  const [salesData, setSalesData] = useState([]);
  const [activeSection, setActiveSection] = useState('sales'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [productDetails, setProductDetails] = useState([]);
  const [productDateRange, setProductDateRange] = useState([new Date(), new Date()]);
  const [topSalesDays, setTopSalesDays] = useState([]);
  const [showSold, setShowSold] = useState(true);
  const [showRemaining, setShowRemaining] = useState(false);
  const [combinedStockData, setCombinedStockData] = useState([]);

  useEffect(() => {
    reportSumSalePerMonth();
    reportStock();
    reportTopSellingProducts();
    reportTopSellingCategories();
    fetchSalesData();
    if (activeSection === 'stock') {
      fetchProductDetails();
    }
  }, [year, month, viewType, dateRange, dateRangeValue, activeSection, productDateRange]); 

  useEffect(() => {
    if (activeSection === 'stock') {
      fetchTopSalesDays();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'stock' && productDateRange[0] && productDateRange[1]) {
      fetchTopSalesDays();
      fetchProductDetails();
    }
  }, [productDateRange, activeSection]);

  useEffect(() => {
    if (activeSection === 'timeline') {
      fetchCombinedStockData();
    }
  }, [activeSection, dateRange, dateRangeValue]);

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

        const calculateVat = (amount) => {
          return amount * 1.07; // เพิ่ม VAT 7%
        };

        if (viewType === "daily") {
          const daysInMonth = new Date(year, month, 0).getDate(); 
          salesData = Array(daysInMonth).fill(0);
          profitData = Array(daysInMonth).fill(0);
          costData = Array(daysInMonth).fill(0);
          results.forEach((item) => {
            salesData[item.day - 1] = calculateVat(item.sum || 0);
            profitData[item.day - 1] = item.profit || 0;
            costData[item.day - 1] = item.cost || 0;
          });
        } else if (viewType === "weekly") {
          const weeksInMonth = 4; 
          salesData = Array(weeksInMonth).fill(0);
          profitData = Array(weeksInMonth).fill(0);
          costData = Array(weeksInMonth).fill(0);
          results.forEach((item) => {
            const weekOfMonth = Math.ceil(new Date(year, month - 1, item.day).getDate() / 7);
            if (weekOfMonth <= weeksInMonth) {
              salesData[weekOfMonth - 1] = calculateVat(item.sum || 0);
              profitData[weekOfMonth - 1] = item.profit || 0;
              costData[weekOfMonth - 1] = item.cost || 0;
            }
          });
        } else if (viewType === "monthly") {
          salesData = Array(12).fill(0);
          profitData = Array(12).fill(0);
          costData = Array(12).fill(0);
          results.forEach((item) => {
            salesData[item.month - 1] = calculateVat(item.sum || 0);
            profitData[item.month - 1] = item.profit || 0;
            costData[item.month - 1] = item.cost || 0;
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
              label: "ยอดขายรวม (รวม VAT 7%)",
              data: salesData,
              backgroundColor: "rgba(75, 192, 192, 0.4)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
              tension: 0.3,
              fill: true,
            },
           
           
          ],
        });

        setTotalSales(calculateVat(res.data.totalSales));
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

  const fetchSalesData = async () => {
    try {
      const url = config.api_path + "/reportSalesByDateRange";
      const [start, end] = dateRangeValue;
      
      if (dateRange === 'custom' && (!start || !end)) {
        setSalesData([]);
        return;
      }

      const payload = {
        dateRange,
        customStartDate: start ? start.toISOString() : null,
        customEndDate: end ? end.toISOString() : null
      };

      const res = await axios.post(url, payload, config.headers());
      if (res.data.message === "success") {
        setSalesData(res.data.results);
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchProductDetails = async () => {
    try {
      const url = config.api_path + "/productDetails";
      // Use productDateRange instead of dateRange
      const [start, end] = productDateRange;
      if (!start || !end) return;

      const startDate = new Date(start);
      const endDate = new Date(end);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const res = await axios.post(url, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, config.headers());

      if (res.data.message === "success") {
        setProductDetails(res.data.results);
      }
    } catch (e) {
      console.error('Error fetching product details:', e);
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchTopSalesDays = async () => {
    try {
      const [start, end] = productDateRange;
      if (!start || !end) return;

      // Clone the dates to avoid modifying the original dates
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Set time to beginning and end of days
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const res = await axios.post(
        `${config.api_path}/reportTopSalesDays`,
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        config.headers()
      );

      if (res.data.message === 'success') {
        setTopSalesDays(res.data.results);
      }
    } catch (error) {
      console.error('Error fetching top sales days:', error);
    }
  };

  const fetchCombinedStockData = async () => {
    try {
      const url = config.api_path + "/stock/combinedReport";
      let startDate = new Date();
      let endDate = new Date();
      
      // eslint-disable-next-line default-case
      switch(dateRange) {
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1);
          endDate = new Date(startDate);
          break;
        case 'last7days':
          startDate.setDate(startDate.getDate() - 6);
          break;
        case 'last30days':
          startDate.setDate(startDate.getDate() - 29);
          break;
        case 'lastMonth':
          startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          break;
        case 'custom':
          if (dateRangeValue[0] && dateRangeValue[1]) {
            startDate = dateRangeValue[0];
            endDate = dateRangeValue[1];
          }
          break;
      }
  
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
  
      const res = await axios.post(url, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dateRange: dateRange
      }, config.headers());
  
      if (res.data.message === "success") {
        setCombinedStockData(res.data.results);
      }
    } catch (e) {
      console.error('Error fetching combined stock data:', e);
    }
  };

  useEffect(() => {
    if (activeSection === 'stock') {
      fetchProductDetails();
    }
  }, [dateRange, dateRangeValue, activeSection]);

  const renderTopSalesDaysChart = () => {
    const formattedData = topSalesDays.map(day => {
      const date = new Date(day.date);
      const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const isToday = date.getTime() === today.getTime();
      const dayText = isToday ? 'วันนี้' : thaiDays[date.getDay()];
      
      const total = topSalesDays.reduce((sum, d) => sum + d.netProfit, 0);
      const percentage = total > 0 ? ((day.netProfit / total) * 100).toFixed(2) : '0.00';

      return {
        label: `${date.getDate()} ${['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][date.getMonth()]} ${date.getFullYear() + 543} ${dayText}`,
        amount: day.netProfit,
        percentage
      };
    });

    return (
      <div className="card mt-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">กำไรสุทธิตามช่วงวันที่ (5 อันดับสูงสุด)</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <div style={{ height: '300px' }}>
                <Bar
                  data={{
                    labels: formattedData.map(day => day.label),
                    datasets: [{
                      label: 'กำไรสุทธิ',
                      data: formattedData.map(day => day.amount),
                      backgroundColor: 'rgba(75, 192, 192, 0.6)',
                      borderColor: 'rgba(75, 192, 192, 1)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `฿${formatNumber(context.raw)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="sales-summary">
                {formattedData.map((day, index) => (
                  <div key={index} className="mb-2 p-2 bg-light rounded">
                    <div className="small">{day.label}</div>
                    <div className="h6 mb-0">฿{formatNumber(day.amount)}</div>
                    <div className="small text-muted">({day.percentage}%)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTopSalesChart = () => {
    const sortedProducts = [...combinedStockData]
      .sort((a, b) => b.netProfit - a.netProfit) // เปลี่ยนจาก soldQty เป็น netProfit
      .slice(0, 5);

    const chartColors = [
      { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },   // เขียว
      { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },   // น้ำเงิน
      { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)' },   // แดง
      { bg: 'rgba(255, 159, 64, 0.6)', border: 'rgba(255, 159, 64, 1)' },   // ส้ม
      { bg: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)' }  // ม่วง
    ];

    return (
      <div className="card mt-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">สินค้าที่ทำกำไรสูงสุด 5 อันดับ</h5>
        </div>
        <div className="card-body">
          <div style={{ height: '300px' }}>
            <Bar
              data={{
                labels: sortedProducts.map(item => item.name),
                datasets: [{
                  label: 'กำไรสุทธิ',
                  data: sortedProducts.map(item => item.netProfit),
                  backgroundColor: sortedProducts.map((_, index) => chartColors[index].bg),
                  borderColor: sortedProducts.map((_, index) => chartColors[index].border),
                  borderWidth: 1
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `฿${formatNumber(context.raw)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '฿' + formatNumber(value);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const summaryCardStyle = {
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    height: "100%",
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    margin: window.innerWidth < 768 ? '0 0 15px 0' : '0'
  };

  const sidebarStyle = {
    width: window.innerWidth < 768 
    ? '100%' 
    : (isSidebarCollapsed ? '60px' : '250px'),
  height: window.innerWidth < 768 ? 'auto' : '100vh',
  padding: isSidebarCollapsed && window.innerWidth >= 768 ? '20px 5px' : '20px',
  position: window.innerWidth < 768 ? 'relative' : 'sticky',
  top: 0,
  overflowY: 'auto',
  borderRight: window.innerWidth < 768 ? 'none' : '1px solid #e0e0e0',
  borderBottom: window.innerWidth < 768 ? '1px solid #e0e0e0' : 'none',
  backgroundColor: 'white',
  transition: 'all 0.3s ease',
  zIndex: 1000
  };

  const mainContentStyle = {
    flex: 1,
    padding: '20px',
    marginLeft: window.innerWidth < 768 ? 0 : (isSidebarCollapsed ? '60px' : '250px'),
    width: window.innerWidth < 768 ? '100%' : 'auto',
    overflowX: 'hidden'
  };

  const containerWrapperStyle = {
    display: 'flex',
    width: '100%',
    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
    overflow: 'hidden'
  };

  const menuItemStyle = (isActive) => ({
    padding: isSidebarCollapsed ? '12px 0' : '12px 20px',
    margin: '8px 0',
    cursor: 'pointer',
    color: isActive ? 'white' : '#6c757d',
    backgroundColor: isActive ? '#1976d2' : 'transparent', 
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
    '&:hover': {
      backgroundColor: isActive ? '#1565c0' : '#f8f9fa', 
      color: isActive ? 'white' : '#2c3e50'
    }
  });

  const menuTitleStyle = {
    color: '#6c757d',
    fontSize: '1.1rem',
    fontWeight: '500',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',  
    justifyContent: isSidebarCollapsed ? 'center' : 'space-between'
  };

  const toggleButtonStyle = {
    cursor: 'pointer',
    padding: '5px',
    color: '#6c757d'
  };

  const iconStyle = {
    width: '20px',
    textAlign: 'center',
    fontSize: '1.1rem',
    marginRight: isSidebarCollapsed ? '0' : '10px'
  };

  const formatNumber = (num) => {
    return Number(num).toLocaleString("th-TH");
  };

  const renderStockSection = () => {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
      const dayAbbr = date.getTime() === today.getTime() ? 'วันนี้' : thaiDays[date.getDay()];
  
      return {
        fullDate: date.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        dayAbbr
      };
    };
  
    return (
      <div className="col-md-12">
        <div className="card" style={summaryCardStyle}>
          <div className="card-header bg-white">
            <div className="row align-items-center">
              <div className="col">
                <h4 className="mb-0">รายละเอียดยอดขาย</h4>
              </div>
              <div className="col-auto">
                <DatePicker
                  selectsRange={true}
                  startDate={productDateRange[0]}
                  endDate={productDateRange[1]}
                  onChange={(update) => {
                    setProductDateRange(update);
                  }}
                  maxDate={new Date()}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable={true}
                  placeholderText="เลือกช่วงวันที่"
                />
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table" style={{
                borderSpacing: '0 8px',
                borderCollapse: 'separate'
              }}>
                <thead>
                  <tr style={{ background: 'none' }}>
                    <th style={{ border: 'none', padding: '12px 8px' }}>วันที่จำหน่าย</th>
                    <th style={{ border: 'none', padding: '12px 8px' }}>ยอดรวม</th>
                    <th style={{ border: 'none', padding: '12px 8px' }}>ทุนต่อชิ้น</th>
                    <th style={{ border: 'none', padding: '12px 8px' }}>ขายต่อชิ้น</th>
                    <th style={{ border: 'none', padding: '12px 8px' }}>กำไรสุทธิ</th>
                  </tr>
                </thead>
                <tbody>
                  {productDetails.map((item, index) => {
                    const { fullDate, dayAbbr } = formatDate(item.saleDate);
                    return (
                      <tr key={index} style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}>
                        <td style={{ border: 'none', padding: '12px 8px' }}>
                          {`${fullDate} ${dayAbbr}`}
                        </td>
                        <td style={{ border: 'none', padding: '12px 8px' }}>{formatNumber(item.totalAmount)} บาท</td>
                        <td style={{ border: 'none', padding: '12px 8px' }}>{formatNumber(item.minCostPerUnit)} บาท</td>
                        <td style={{ border: 'none', padding: '12px 8px' }}>{formatNumber(item.maxPricePerUnit)} บาท</td>
                        <td style={{ border: 'none', padding: '12px 8px' }}>{formatNumber(item.netProfit)} บาท</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              {renderTopSalesDaysChart()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const chartContainerStyle = {
    height: window.innerWidth < 768 ? '300px' : '500px',
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    overflowX: 'auto'
  };

  const tableWrapperStyle = {
    overflowX: 'auto',
    width: '100%',
    fontSize: window.innerWidth < 768 ? '14px' : '16px'
  };

  useEffect(() => {
    const handleResize = () => {
      
      setIsSidebarCollapsed(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  

  return (
    <Template>
      <div style={containerWrapperStyle}>
        {/* Sidebar */}
        <div style={sidebarStyle}>
          <div className="mb-2">
            <div style={menuTitleStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isSidebarCollapsed && <span style={{ marginRight: '-4px' }}>รายงานสินค้า</span>}
                <i 
                  className={`fas fa-${isSidebarCollapsed ? 'chevron-right' : 'chevron-left'}`}
                  style={toggleButtonStyle}
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
              </div>
            </div>
            <div 
              style={menuItemStyle(activeSection === 'sales')}
              onClick={() => setActiveSection('sales')}
              className="d-flex align-items-center"
              title="ยอดขาย"
            >
              <i className="fas fa-chart-line" style={iconStyle} />
              {!isSidebarCollapsed && <span className="ms-2">กราฟ</span>}
            </div>
            
            <div 
              style={menuItemStyle(activeSection === 'stock')}
              onClick={() => setActiveSection('stock')}
              className="d-flex align-items-center"
              title="ยอดขาย"
            >
              <i className="fas fa-calendar-alt" style={iconStyle} />
              {!isSidebarCollapsed && <span className="ms-2">ยอดขาย</span>}
            </div>
            
            <div 
              style={menuItemStyle(activeSection === 'timeline')}
              onClick={() => setActiveSection('timeline')}
              className="d-flex align-items-center"
              title="สินค้า"
            >
              <i className="fas fa-boxes" style={iconStyle} />
              {!isSidebarCollapsed && <span className="ms-2">สินค้า</span>}
            </div>
            
          </div>
        </div>

     
        <div style={{
          ...mainContentStyle,
          marginLeft: isSidebarCollapsed ? '10px' : '0px',
          transition: 'margin-left 0.3s ease'
        }}>
        
          <div className="card-body mb-4">
            <div className="row g-4">
              <div className="col-12 col-md-4">
                <div className="card text-center" style={summaryCardStyle}>
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">ยอดขาย</h5>
                  </div>
                  <div className="card-body">
                    <h3 className="mb-0">{formatNumber(totalSales)} บาท</h3>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card text-center" style={summaryCardStyle}>
                  <div className="card-header bg-warning text-white">
                    <h5 className="mb-0">ต้นทุน</h5>
                  </div>
                  <div className="card-body">
                    <h3 className="mb-0">{formatNumber(totalCost)} บาท</h3>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card text-center" style={summaryCardStyle}>
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">กำไรสุทธิ</h5>
                  </div>
                  <div className="card-body">
                    <h3 className="mb-0">{formatNumber(totalProfit)} บาท</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Rendering based on activeSection */}
          {activeSection === 'sales' && (
            <div className="card mb-4">
              <div className="card-header bg-white">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-auto">
                    <select 
                      className="form-select" 
                      value={viewType}
                      onChange={(e) => setViewType(e.target.value)}
                    >
                      <option value="daily">รายวัน</option>
                      
                      <option value="monthly">รายเดือน</option>
                    </select>
                  </div>
                  {viewType !== "monthly" && (
                    <div className="col-12 col-md-auto">
                      <select 
                        className="form-select"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>
                            เดือนที่ {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="col-12 col-md-auto">
                    <select 
                      className="form-select"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                      {arrYear.map(y => (
                        <option key={y} value={y}>
                          ปี {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div style={chartContainerStyle}>
                  {myData.datasets && <Line options={options} data={myData} />}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'timeline' && (
            <div className="card mb-4">
              <div className="card-header bg-white">
                <div className="row align-items-center">
                  <div className="col">
                    <h5 className="mb-0">รายละเอียดสินค้า</h5>
                  </div>
                  <div className="col-auto">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="showSoldCheck"
                        checked={showSold}
                        onChange={(e) => setShowSold(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="showSoldCheck">
                        ขายได้
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="showRemainingCheck"
                        checked={showRemaining}
                        onChange={(e) => setShowRemaining(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="showRemainingCheck">
                        คงเหลือ
                      </label>
                    </div>
                  </div>
                  <div className="col-auto">
                    <select 
                      className="form-select"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                    >
                      <option value="today">วันนี้</option>
                      <option value="yesterday">เมื่อวาน</option>
                      <option value="last7days">7 วันล่าสุด</option>
                      <option value="last30days">30 วันล่าสุด</option>
                      <option value="lastMonth">เดือนที่แล้ว</option>
                      <option value="custom">กำหนดช่วงเวลา</option>
                    </select>
                  </div>
                  {dateRange === "custom" && (
                    <div className="col-auto">
                      <DatePicker
                        selectsRange={true}
                        startDate={dateRangeValue[0]}
                        endDate={dateRangeValue[1]}
                        onChange={(update) => setDateRangeValue(update)}
                        className="form-control"
                        dateFormat="dd/MM/yyyy"
                        isClearable={true}
                        placeholderText="เลือกช่วงวันที่"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div style={tableWrapperStyle}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>รหัสสินค้า</th>
                        <th>ชื่อสินค้า</th>
                        <th>จำนวนขาย</th>
                        <th>รวมเป็นเงิน</th>
                        <th>เฉลี่ยต่อชิ้น (ทุน/ขาย)</th>
                        <th>กำไรสุทธิ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedStockData.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productId || '-'}</td>
                          <td>{item.name || '-'}</td>
                          <td>{formatNumber(item.soldQty) || 0} ชิ้น</td>
                          <td>฿{formatNumber(item.totalAmount) || 0}</td>
                          <td>฿{formatNumber(item.cost)} | ฿{formatNumber(item.price)}</td>
                          <td className="text-success">
                            ฿{formatNumber(item.netProfit) || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderTopSalesChart()}
              </div>
            </div>
          )}

          {activeSection === 'stock' && renderStockSection()}

          

          
        </div>
      </div>
    </Template>
  );
}

export default Dashboard;
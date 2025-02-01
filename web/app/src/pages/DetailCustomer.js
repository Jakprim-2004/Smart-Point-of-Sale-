import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import config from "../config";

function DetailCustomer() {
    const [customer, setCustomer] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [purchases, setPurchases] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showBillModal, setShowBillModal] = useState(false);
    const navigate = useNavigate();

    // ข้อมูลจำลองประวัติการใช้แต้ม
    const mockPointHistory = [
        { id: 1, date: '2024-01-14', points: -50, description: 'แลกส่วนลด 50 บาท', balance: 150 },
        { id: 2, date: '2024-01-12', points: -100, description: 'แลกของรางวัล: เครื่องดื่ม', balance: 200 },
        { id: 3, date: '2024-01-08', points: 23, description: 'สะสมแต้มจากการซื้อ', balance: 300 },
    ];

    useEffect(() => {
        const customerData = localStorage.getItem('customerData');
        if (!customerData) {
            Swal.fire({
                title: 'กรุณาเข้าสู่ระบบ',
                icon: 'warning'
            }).then(() => {
                navigate('/login-customer');
            });
            return;
        }
        setCustomer(JSON.parse(customerData));
    }, [navigate]);

    // โหลดข้อมูลประวัติการซื้อ
    useEffect(() => {
        if (customer) {
            loadPurchaseHistory();
        }
    }, [customer]);

    const loadPurchaseHistory = async () => {
        try {
            const response = await axios.get(`${config.api_path}/customer/${customer.id}/purchases`);
            // Remove /api from the path ----------------^
            if (response.data.success) {
                setPurchases(response.data.result);
            }
        } catch (error) {
            console.error('Load purchase history error:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดประวัติการซื้อได้',
                icon: 'error'
            });
        }
    };

    const handleViewBillDetail = async (billId) => {
        try {
            const response = await axios.get(`${config.api_path}/bill/${billId}`);
            // Remove /api from the path ----------^
            if (response.data.success) {
                setSelectedBill(response.data.result);
                setShowBillModal(true);
            }
        } catch (error) {
            console.error('View bill detail error:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดูรายละเอียดบิลได้',
                icon: 'error'
            });
        }
    };

    const getPaymentMethodThai = (method) => {
        switch(method?.toLowerCase()) {
            case 'promptpay':
                return 'พร้อมเพย์';
            case 'cash':
                return 'เงินสด';
            default:
                return method || '-';
        }
    };

    // Component สำหรับแสดง Modal รายละเอียดบิล
    const BillDetailModal = () => (
        <div className={`modal fade ${showBillModal ? 'show' : ''}`} 
             style={{ display: showBillModal ? 'block' : 'none' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">รายละเอียดบิล {selectedBill?.id}</h5>
                        <button type="button" className="btn-close" onClick={() => setShowBillModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        {selectedBill && (
                            <>
                                <div className="mb-3">
                                    <p><strong>วันที่:</strong> {new Date(selectedBill.createdAt).toLocaleString()}</p>
                                    <p><strong>ชำระผ่าน:</strong> {getPaymentMethodThai(selectedBill.paymentMethod)}</p>
                                    <p><strong>ยอดรวมภาษี 7%:</strong> {selectedBill.totalAmount?.toLocaleString()} บาท</p>
                                </div>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>สินค้า</th>
                                            <th className="text-end">ราคา/หน่วย</th>
                                            <th className="text-end">จำนวน</th>
                                            <th className="text-end">รวม</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.details?.map(detail => (
                                            <tr key={detail.id}>
                                                <td>{detail.productName || detail.Product?.name || 'ไม่พบชื่อสินค้า'}</td>
                                                <td className="text-end">
                                                    {parseFloat(detail.price || 0).toLocaleString()} บาท
                                                </td>
                                                <td className="text-end">
                                                    {detail.qty || 0}
                                                </td>
                                                <td className="text-end">
                                                    {detail.subtotal?.toLocaleString()} บาท
                                                </td>
                                            </tr>
                                        ))}
                                       
                                    </tbody>
                                    <tbody>
                                        
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // แทนที่ส่วนแสดงประวัติการซื้อเดิม
    const PurchaseHistory = () => (
        <div className="card">
            <div className="card-header">
                <h5>ประวัติการซื้อ</h5>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>วันที่</th>
                                <th>เลขที่บิล</th>
                                <th>ยอดซื้อ</th>
                                <th>แต้มที่ได้รับ</th>
                                <th>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map(bill => (
                                <tr key={bill.id}>
                                    <td>{new Date(bill.createdAt).toLocaleString()}</td>
                                    <td>{bill.id}</td>
                                    <td>{bill.totalAmount?.toLocaleString()} บาท</td>
                                    <td>{Math.floor(bill.totalAmount / 100)}</td>
                                    <td>
                                        <button 
                                            className="btn btn-info btn-sm"
                                            onClick={() => handleViewBillDetail(bill.id)}
                                        >
                                            ดูรายละเอียด
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (!customer) return <div>Loading...</div>;

    return (
        <div className="container mt-5">
            {/* ข้อมูลลูกค้า */}
            <div className="card mb-4">
                <div className="card-header">
                    <h3>ข้อมูลลูกค้า</h3>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <p><strong>ชื่อ:</strong> {customer.name}</p>
                            <p><strong>เบอร์โทร:</strong> {customer.phone}</p>
                            <p><strong>อีเมล:</strong> {customer.email || '-'}</p>
                        </div>
                        <div className="col-md-6">
                            <p><strong>แต้มสะสม:</strong> {customer.points}</p>
                            <p><strong>ระดับสมาชิก:</strong> {customer.membershipTier}</p>
                            <p><strong>ยอดใช้จ่ายสะสม:</strong> {customer.totalSpent}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* แท็บเมนู */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'purchase' ? 'active' : ''}`}
                        onClick={() => setActiveTab('purchase')}
                    >
                        ประวัติการซื้อ
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'points' ? 'active' : ''}`}
                        onClick={() => setActiveTab('points')}
                    >
                        ประวัติการใช้แต้ม
                    </button>
                </li>
            </ul>

            {/* แสดงประวัติการซื้อ */}
            {activeTab === 'purchase' && <PurchaseHistory />}

            {/* แสดงประวัติการใช้แต้ม */}
            {activeTab === 'points' && (
                <div className="card">
                    <div className="card-header">
                        <h5>ประวัติการใช้แต้ม</h5>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>วันที่</th>
                                        <th>รายการ</th>
                                        <th>แต้ม</th>
                                        <th>คงเหลือ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockPointHistory.map(point => (
                                        <tr key={point.id}>
                                            <td>{new Date(point.date).toLocaleDateString()}</td>
                                            <td>{point.description}</td>
                                            <td className={point.points < 0 ? 'text-danger' : 'text-success'}>
                                                {point.points > 0 ? `+${point.points}` : point.points}
                                            </td>
                                            <td>{point.balance}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            <BillDetailModal />
        </div>
    );
}

export default DetailCustomer;

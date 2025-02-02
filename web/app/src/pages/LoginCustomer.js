import { useState } from "react";
import axios from 'axios';
import config from "../config";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import mochiGif from '../assets/mochi-young-woman.gif';

function LoginCustomer() {
    const [loginData, setLoginData] = useState({
        email: "",
        phone: ""
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!loginData.email || !loginData.phone) {
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'กรุณากรอกทั้งอีเมลและเบอร์โทรศัพท์',
                icon: 'warning'
            });
            return;
        }

        try {
            const response = await axios.post(config.api_path + '/login/customer', loginData);
            if (response.data.success === false) {
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด',
                    text: response.data.message || 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง',
                    icon: 'error'
                });
                return;
            }

            if (response.data.result) {
                localStorage.setItem('customerData', JSON.stringify(response.data.result));
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'เข้าสู่ระบบสำเร็จ',
                    icon: 'success',
                    timer: 2000,
                }).then(() => {
                    navigate('/DetailCustomer');
                });
            }
        } catch (error) {
            let errorMessage = 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: errorMessage,
                icon: 'error'
            });
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center align-items-center">
                <div className="col-md-5 text-center d-none d-md-block">
                    <img 
                        src={mochiGif} 
                        alt="Mochi woman" 
                        style={{
                            maxWidth: '80%',
                            borderRadius: '15px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}
                    />
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h3 className="text-center mb-0" style={{ color: '#2c3e50' }}>เข้าสู่ระบบลูกค้า</h3>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">อีเมล <span className="text-danger">*</span></label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={loginData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">เบอร์โทรศัพท์ <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="phone"
                                        value={loginData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="text-muted mb-3">
                                    * กรุณากรอกข้อมูลให้ครบทุกช่อง
                                </div>
                                <button type="submit" className="btn btn-primary w-100">
                                    เข้าสู่ระบบ
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginCustomer;
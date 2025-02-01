import { useState } from "react";
import axios from 'axios';
import config from "../config";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

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
        if (!loginData.email && !loginData.phone) {
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'กรุณากรอกอีเมลหรือเบอร์โทรศัพท์',
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
                    icon: 'success'
                }).then(() => {
                    navigate('/DetailCustomer');
                });
            }
        } catch (error) {
            let errorMessage = 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
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
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-center">เข้าสู่ระบบลูกค้า</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">อีเมล</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={loginData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">เบอร์โทรศัพท์</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="phone"
                                        value={loginData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="text-muted mb-3">
                                    * กรุณากรอกอีเมลหรือเบอร์โทรศัพท์อย่างใดอย่างหนึ่ง
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
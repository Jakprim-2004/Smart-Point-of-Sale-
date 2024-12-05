import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import config from "../config";
import { useNavigate } from "react-router-dom";
import '../styles/Login.css';

function Login() {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const navigate = useNavigate();

    const handleSignIn = async () => {
        try {
            const payload = { 
                phone: phone || '', 
                email: email || '', 
                pass 
            };
            if (!phone && !email) {
                Swal.fire({
                    title: 'Sign In',
                    text: 'กรุณากรอกอีเมลหรือเบอร์โทรศัพท์',
                    icon: 'warning',
                    timer: 2000
                });
                return;
            }
            await axios.post(config.api_path + '/member/signin', payload)
                .then(res => {
                    if (res.data.message === 'success') {
                        Swal.fire({
                            title: 'Sign In',
                            text: 'เข้าสู่ระบบแล้ว',
                            icon: 'success',
                            timer: 2000
                        });

                        localStorage.setItem(config.token_name, res.data.token);
                        navigate('/dashboard');
                    } else {
                        Swal.fire({
                            title: 'Sign In',
                            text: 'ไม่พบข้อมูลในระบบ',
                            icon: 'warning',
                            timer: 2000
                        });
                    }
                }).catch(err => {
                    throw err.response.data;
                });
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Sign In',
                text: 'อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง',
                icon: 'error',
                timer: 2000
            });
        }
    };

    return (
        <div className="login-container d-flex justify-content-center align-items-center vh-100">
            <div className="card login-card shadow-lg p-4">
                <div className="row">
                    <div className="col-md-6 d-flex flex-column align-items-center justify-content-center">
                        <h3 className="login-title">Retail Point of Sale </h3>
                        <p className="login-subtitle">Online inventory management system</p>
                        <img src="/logologin.jpg" alt="Logo" className="login-logo" />
                    </div>
                    <div className="col-md-6 login-form-container">
                        <h3 className="text-center mb-4 mt-5">Login to Retail Point of Sale z</h3>
                        <div className="form-group mb-3 mt-5">
                            <label htmlFor="loginField">Email or Phone Number</label>
                            <input 
                                type="text" 
                                id="loginField" 
                                value={phone || email} 
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.includes('@')) {
                                        setEmail(value);
                                        setPhone('');
                                    } else {
                                        setPhone(value);
                                        setEmail('');
                                    }
                                }} 
                                className="form-control form-control-lg" 
                                placeholder="Enter your email or phone number"
                            />
                        </div>
                        <div className="form-group mb-4">
                            <label htmlFor="pass">Password</label>
                            <input 
                                type="password" 
                                id="pass" 
                                value={pass} 
                                onChange={(e) => setPass(e.target.value)} 
                                className="form-control form-control-lg" 
                                placeholder="Enter your password"
                            />
                        </div>
                        <button onClick={handleSignIn} className="btn btn-primary w-100 btn-lg mb-3 mt-5">Sign In</button>
                        <div className="text-center">
                            <p>คุณยังไม่มีบัญชีใช้งาน? <a href="/package" className="text-primary">สร้างบัญชีใหม่</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;

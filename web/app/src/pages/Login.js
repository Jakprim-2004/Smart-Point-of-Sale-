import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import config from "../config";
import { useNavigate } from "react-router-dom";
import '../styles/Login.css';
import Lottie from 'lottie-react';
import animationData from '../assets/Logo-new.json';
import welcomeIcon from '../assets/welcome.svg';

function Login() {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [loginType, setLoginType] = useState('member');
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleSignIn = async () => {
        try {
            let payload;
            let endpoint;
            
            if (loginType === 'member') {
                payload = { 
                    phone: phone || '', 
                    email: email || '', 
                    pass 
                };
                endpoint = '/member/signin';
            } else {
                payload = {
                    usr: username,
                    pwd: pass
                };
                endpoint = '/user/signin';
            }

            if (loginType === 'member' && !phone && !email) {
                Swal.fire({
                    title: 'Sign In',
                    text: 'กรุณากรอกอีเมลหรือเบอร์โทรศัพท์',
                    icon: 'warning',
                    timer: 2000
                });
                return;
            }

            const res = await axios.post(config.api_path + endpoint, payload);
            
            if (res.data.message === 'success') {
                Swal.fire({
                    title: 'Sign In',
                    text: 'เข้าสู่ระบบแล้ว',
                    imageUrl: welcomeIcon,
                    imageWidth: 200,
                    imageHeight: 200,
                    timer: 2000
                });

                localStorage.setItem(config.token_name, res.data.token);
                localStorage.setItem('userType', loginType);
                
                // Store user level for employees
                if (loginType === 'employee' && res.data.userInfo) {
                    localStorage.setItem('userLevel', res.data.userInfo.level);
                } else {
                    localStorage.setItem('userLevel', 'owner');
                }

                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Sign In',
                text: loginType === 'member' ? 
                    'อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง' : 
                    'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
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
                        <div className="w-32 h-32 mx-auto mb-4">
                            <Lottie
                                animationData={animationData}
                                loop={true}
                                autoplay={true}
                            />
                        </div>
                    </div>
                    <div className="col-md-6 login-form-container">
                        <h3 className="text-center mb-4 mt-5">Login to Retail Point of Sale </h3>
                        <div className="form-group mb-3 mt-5">
                            <label htmlFor="loginField">Email or Phone Number</label>
                            <div className="btn-group w-100 mb-3">
                                <button 
                                    className={`btn ${loginType === 'member' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setLoginType('member')}>
                                    เจ้าของร้าน
                                </button>
                                <button 
                                    className={`btn ${loginType === 'employee' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setLoginType('employee')}>
                                    พนักงาน
                                </button>
                            </div>
                            {loginType === 'member' ? (
                                <input 
                                    type="text" 
                                    className="form-control form-control-lg" 
                                    placeholder="Enter your email or phone number"
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
                                />
                            ) : (
                                <input 
                                    type="text" 
                                    className="form-control form-control-lg" 
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            )}
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

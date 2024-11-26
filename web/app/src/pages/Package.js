import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import config from "../config";
import Modal from "../components/Modal";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaStore, FaMapMarkerAlt } from 'react-icons/fa';

function Package() {
    const [packages, setPackages] = useState([]);
    const [yourPackage, setYourPackage] = useState({});
    const [name, setname] = useState('');
    const [phone, setPhone] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address, setAddress] = useState('');
    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [subDistrict, setSubDistrict] = useState('');
    const [postalCode, setPostalCode] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            axios.get(config.api_path + '/package/list').then(res => {
                setPackages(res.data.results);
            }).catch(err => {
                throw err.response.data;
            });
        } catch (e) {
            console.log(e.message);
        }
    }, []);

    

    const handleRegister = async (e) => {
    e.preventDefault();

    if (pass !== confirmPass) {
        Swal.fire({
            title: 'Error',
            text: 'กรุณากรอกรหัสผ่านให้ตรงกัน',
            icon: 'error'
        });
        return;
    }

    try {
        handleConfirmation.call(this);
    } catch (e) {
        Swal.fire({
            title: 'Error',
            text: e.message,
            icon: 'error'
        });
    }
};

const handleConfirmation = function() {
    Swal.fire({
        title: 'ยืนยันการสมัคร',
        text: 'โปรดยืนยันการสมัครใช้บริการ package ของเรา',
        icon: 'question',
        showCancelButton: true,
        showConfirmButton: true
    }).then(res => {
        if (res.isConfirmed) {
            const payload = {
                packageId: 1, // Set packageId to 1 automatically
                email: email,
                name: name,
                phone: phone, 
                password: pass,
                firstName: firstName,
                lastName: lastName,
                address: {
                    fullAddress: address,
                    country: 'ไทย',
                    province: province,
                    district: district,
                    subDistrict: subDistrict,
                    postalCode: postalCode
                },
                status: 'active'
            };

            axios.post(config.api_path + '/member/register', payload)
                .then(res => {
                    if (res.data.message === 'success') {
                        Swal.fire({
                            title: 'บันทึกข้อมูล',
                            text: 'บันทึกข้อมูลการสมัครเรียบร้อยแล้ว',
                            icon: 'success',
                            timer: 2000
                        });
                        navigate('/');
                    }
                })
                .catch(err => {
                    Swal.fire({
                        title: 'Error',
                        text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                        icon: 'error'
                    });
                });
        }
    });
};

    return (
        <div className="container py-5">
            <div className="card shadow-lg rounded-3 border-0">
                <div className="card-body p-4">
                    <h2 className="text-center mb-4 text-primary">สมัครสมาชิก</h2>
                    <form onSubmit={handleRegister} className="row g-4">
                        {/* Basic Information Section */}
                        <div className="col-12">
                            <h5 className="text-secondary mb-3">ข้อมูลพื้นฐาน</h5>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaEnvelope /></span>
                                        <input type="email" className="form-control" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaPhone /></span>
                                        <input type="tel" className="form-control" placeholder="เบอร์โทรศัพท์" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaStore /></span>
                                        <input type="text" className="form-control" placeholder="ชื่อร้าน" value={name} onChange={(e) => setname(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="col-12">
                            <h5 className="text-secondary mb-3">รหัสผ่าน</h5>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaLock /></span>
                                        <input type="password" className="form-control" placeholder="รหัสผ่าน" value={pass} onChange={(e) => setPass(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaLock /></span>
                                        <input type="password" className="form-control" placeholder="ยืนยันรหัสผ่าน" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information Section */}
                        <div className="col-12">
                            <h5 className="text-secondary mb-3">ข้อมูลส่วนตัว</h5>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaUser /></span>
                                        <input type="text" className="form-control" placeholder="ชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaUser /></span>
                                        <input type="text" className="form-control" placeholder="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="col-12">
                            <h5 className="text-secondary mb-3">ที่อยู่</h5>
                            <div className="row g-3">
                                <div className="col-12">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaMapMarkerAlt /></span>
                                        <textarea className="form-control" placeholder="ที่อยู่" value={address} onChange={(e) => setAddress(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <input type="text" className="form-control bg-light" value="ไทย" disabled />
                                </div>
                                <div className="col-md-6">
                                    <input type="text" className="form-control" placeholder="จังหวัด/รัฐ" value={province} onChange={(e) => setProvince(e.target.value)} required />
                                </div>
                                <div className="col-md-4">
                                    <input type="text" className="form-control" placeholder="อำเภอ/เขต" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                                </div>
                                <div className="col-md-4">
                                    <input type="text" className="form-control" placeholder="ตำบล/แขวง" value={subDistrict} onChange={(e) => setSubDistrict(e.target.value)} required />
                                </div>
                                <div className="col-md-4">
                                    <input type="text" className="form-control" placeholder="รหัสไปรษณีย์" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        <div className="col-12 text-center mt-4">
                            <button type="submit" className="btn btn-primary btn-lg px-5 rounded-pill">
                                ยืนยันการสมัคร
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Package;

import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import config from "../config";
import Modal from "../components/Modal";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";

function Package() {
    const [packages, setPackages] = useState([]);
    const [yourPackage, setYourPackage] = useState({});
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

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

    const choosePackage = useCallback((item) => {
        setYourPackage(item);
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
            Swal.fire({
                title: 'ยืนยันการสมัคร',
                text: 'โปรดยืนยันการสมัครใช้บริการ package ของเรา',
                icon: 'question',
                showCancelButton: true,
                showConfirmButton: true
            }).then(res => {
                if (res.isConfirmed) {
                    const payload = {
                        packageId: yourPackage.id,
                        name: name,
                        phone: phone,
                        pass: pass
                    };
                    axios.post(config.api_path + '/package/memberRegister', payload).then(res => {
                        if (res.data.message === 'success') {
                            Swal.fire({
                                title: 'บันทึกข้อมูล',
                                text: 'บันทึกข้อมูลการสมัครแล้ว',
                                icon: 'success',
                                timer: 2000
                            });
                            document.getElementById('btnModalClose').click();
                            navigate('/');
                        }
                    }).catch(err => {
                        throw err.response.data;
                    });
                }
            });
        } catch (e) {
            Swal.fire({
                title: 'Error',
                text: e.message,
                icon: 'error'
            });
        }
    };

    const formatBillAmount = (amount) => {
        return isNaN(amount) || amount === 'Unlimit' || amount === null
            ? 'Unlimit'
            : Number(amount).toLocaleString('th-TH');
    };

    const formatPrice = (price) => {
        return price && !isNaN(price)
            ? Number(price).toLocaleString('th-TH', { minimumFractionDigits: 0 })
            : 'N/A';
    };

    return (
        <>
            <div className="container mt-4">
                <div className="text-center mb-4">
                    <h2 className="text-primary fw-bold">DDPOs: Point of Sale on Cloud</h2>
                    <h5 className="text-muted">Best Package for You</h5>
                </div>

                <div className="row g-4">
                    {packages.map((item, index) => (
                        <div className="col-sm-12 col-md-6 col-lg-4" key={index}>
                            <div className="card shadow-sm border border-gray-400"> 
                                <div className="card-body text-center p-4">
                                    <h4 className="text-success mb-3">{item.name}</h4>
                                    <p className="h5 mb-2">
                                        {formatBillAmount(item.bill_amount)} บิลต่อเดือน
                                    </p>
                                    <p className="h5 text-secondary mb-4">
                                        {formatPrice(item.price)} บาท
                                    </p>
                                    <button
                                        onClick={() => choosePackage(item)}
                                        type="button"
                                        className="btn btn-primary btn-lg px-4"
                                        data-toggle="modal"
                                        data-target="#modalRegister"
                                    >
                                        สมัคร
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-5">
                    <h5 className="mb-3">ต้องการข้อมูลเพิ่มเติม?</h5>
                    <button className="btn btn-outline-primary me-2">ติดต่อสอบถาม</button>
                    <a href="/terms" className="btn btn-outline-secondary">ดูเงื่อนไขการให้บริการ</a>
                </div>
            </div>

            <Modal id="modalRegister" title="สมัครใช้บริการ">
                <form onSubmit={handleRegister}>
                    <div>
                        <div className="alert alert-info">
                            {yourPackage.name} ราคา {formatPrice(yourPackage.price)} บาทต่อเดือน
                        </div>
                    </div>
                    <div className="mt-3">
                        <label>ชื่อร้าน</label>
                        <input
                            className="form-control"
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-3">
                        <label>เบอร์โทร</label>
                        <input
                            type="tel"
                            className="form-control"
                            onChange={e => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-3">
                        <label>รหัสผ่าน</label>
                        <input
                            type="password"
                            className="form-control"
                            onChange={e => setPass(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-3">
                        <label>ยืนยันรหัสผ่าน</label>
                        <input
                            type="password"
                            className="form-control"
                            onChange={e => setConfirmPass(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-3 text-end">
                        <button type="submit" className="btn btn-primary">
                            ยืนยันการสมัคร
                            <i className="fa fa-arrow-right ms-2"></i>
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

export default Package;

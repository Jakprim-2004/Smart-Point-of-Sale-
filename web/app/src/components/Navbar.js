import config from '../config';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from './Modal';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [memberName, setMemberName] = useState();
    const [currentPage, setCurrentPage] = useState("");

    useEffect(() => {
        const path = location.pathname;
        switch (path) {
            case "/dashboard":
                setCurrentPage("Dashboard");
                break;
            
           
            
            default:
                setCurrentPage("");
        }
    }, [location.pathname]);

    const handleSignOut = () => {
        Swal.fire({
            title: 'Sign out',
            text: 'ยืนยันการออกจากระบบ',
            icon: 'question',
            showCancelButton: true,
            showConfirmButton: true
        }).then(res => {
            if (res.isConfirmed) {
                localStorage.removeItem(config.token_name);
                navigate('/');
            }
        })
    }

    const handleEditProfile = async () => {
        try {
            await axios.get(config.api_path + '/member/info', config.headers()).then(res => {
                if (res.data.message === 'success') {
                    setMemberName(res.data.result.name);
                }
            }).catch(err => {
                throw err.response.data;
            })
        } catch (e) {
            Swal.fire({
                title: 'error',
                text: e.messsage,
                icon: 'error'
            })
        }
    }

    const handleChangeProfile = async () => {
        try {
            const url = config.api_path + '/member/changeProfile';
            const payload = { memberName: memberName }
            await axios.put(url, payload, config.headers()).then(res => {
                if (res.data.message === 'success') {
                    Swal.fire({
                        title: 'เปลี่ยนข้อมูล',
                        text: 'เปลี่ยนแปลงข้อมูลร้านของคุณแล้ว',
                        icon: 'success',
                        timer: 2000
                    })
                }
            })
        } catch (e) {
            Swal.fire({
                title: 'error',
                text: e.messsage,
                icon: 'error'
            })
        }
    }

    return (
        <>
            <nav className="main-header navbar navbar-expand navbar-white navbar-light shadow-sm" 
                 style={{
                     padding: '0.5rem 1rem',
                     borderBottom: '1px solid #dee2e6',
                     transition: 'all 0.3s ease'
                 }}>
               

                <div className="navbar-page-title " 
                    >
                    <h2 className="page-title m-0" 
                        >
                        
                        {currentPage}
                    </h2>
                </div>

                <ul className="navbar-nav ml-auto">
                    <li className="nav-item d-flex align-items-center">
                        <button onClick={handleEditProfile} 
                                data-toggle='modal' 
                                data-target='#modalEditProfile'
                                className="btn btn-info mr-2"
                                style={{
                                    padding: '0.375rem 1rem',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    fontWeight: '500'
                                }}>
                            <i className="fa fa-user mr-2"></i>
                            Profile
                        </button>
                        <button onClick={handleSignOut} 
                                className="btn btn-danger"
                                style={{
                                    padding: '0.375rem 1rem',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    fontWeight: '500'
                                }}>
                            <i className="fa fa-times mr-2"></i>
                            Sign Out
                        </button>
                    </li>
                </ul>
            </nav>

            <Modal id='modalEditProfile' title='แก้ไขข้อมูลร้านของฉัน'>
                <div className="px-3">
                    <label className="font-weight-bold">ชื่อร้าน</label>
                    <input value={memberName}
                           onChange={e => setMemberName(e.target.value)}
                           className='form-control'
                           style={{
                               padding: '0.5rem',
                               borderRadius: '0.25rem',
                               border: '1px solid #ced4da'
                           }} />
                </div>
                <div className='mt-3 px-3 pb-3'>
                    <button onClick={handleChangeProfile} 
                            className='btn btn-primary'
                            style={{
                                padding: '0.5rem 1.5rem',
                                fontWeight: '500'
                            }}>
                        <i className='fa fa-check mr-2'></i>
                        Save
                    </button>
                </div>
            </Modal>
        </>
    )
}
export default Navbar;
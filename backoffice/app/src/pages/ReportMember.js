import Swal from "sweetalert2";
import Template from "./Template";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import * as dayjs from "dayjs";
import { FaSearch, FaUserFriends, FaUsers, FaChartLine } from 'react-icons/fa';

function ReportMember() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await axios
        .get(config.api_path + "/member/list", config.headers())
        .then((res) => {
          if (res.data.message === "success") {
            setMembers(res.data.results);
          }
        })
        .catch((err) => {
          throw err.response.data;
        });
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Template>
      <div className="container-fluid px-4">
        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card bg-primary bg-gradient h-100 shadow-sm">
              <div className="card-body text-white">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <FaUsers className="display-6" />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="mb-0">สมาชิกทั้งหมด</h6>
                    <h3 className="mb-0">{members.length}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 py-3">
            <div className="row align-items-center">
              <div className="col">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <FaUserFriends className="text-primary" />
                  รายงานคนที่สมัครใช้บริการ
                </h5>
              </div>
              <div className="col-md-4">
                <div className="position-relative">
                  <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="ค้นหาจากชื่อหรือเบอร์โทร..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-4">ชื่อ</th>
                    <th className="border-0">เบอร์โทร</th>
                    <th className="border-0">วันที่สมัคร</th>
                    <th className="border-0">แพ็กเกจ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                              <span className="text-primary">{item.name.charAt(0)}</span>
                            </div>
                            <span className="fw-medium">{item.name}</span>
                          </div>
                        </td>
                        <td>{item.phone}</td>
                        <td>{dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary rounded-pill px-3">
                            {item.package.name}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        <div className="text-muted">
                          <FaSearch size={32} className="mb-2 opacity-50" />
                          <p className="mb-0">ไม่พบข้อมูลสมาชิก</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Template>
  );
}

export default ReportMember;

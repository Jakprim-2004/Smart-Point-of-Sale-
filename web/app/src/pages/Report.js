import React, { useState } from "react";
import Template from "../components/Template";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faLine } from "@fortawesome/free-brands-svg-icons";
import axios from "axios";
import Swal from "sweetalert2";
import config from "../config";


const ReportUse = () => {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    phoneNumber: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        config.api_path + "/reportUse",
        formData
      );

      if (response.data.message === "success") {
        Swal.fire({
          icon: 'success',
          title: 'ส่งข้อความสำเร็จ',
          text: 'เราจะติดต่อกลับโดยเร็วที่สุด',
          showConfirmButton: false,
          timer: 2000
        });

        setFormData({
          subject: "",
          message: "",
          phoneNumber: ""
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.response?.data?.message || 'ไม่สามารถส่งข้อมูลได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Template>
      <div className="container mx-auto px-4 py-5 max-w-4l">
        <h1 className="text-3xl font-bold text-center mb-5">แจ้งปัญหาการใช้งาน</h1>

        <div className="card mb-5 shadow">
          <div className="card-header">
            <h2 className="card-title h4 fw-semibold text-dark">
              ติดต่อสอบถาม
            </h2>
          </div>
          <div className="card-body">
            <p className="text-muted mb-4">
              สามารถติดต่อในช่วงเวลาทำการทุกวันจันทร์ ถึงวันศุกร์ (9.00 - 18.00
              น.) ผ่านช่องทางดังต่อปนี้
            </p>

            <div className="d-flex flex-column gap-4">
              <ContactItem
                icon={
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="me-2 text-primary"
                  />
                }
                title="เบอร์โทรศัพท์"
                link="tel:065-692-0000"
                linkText="065-692-0000"
              />

              <ContactItem
                icon={
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="me-2 text-primary"
                  />
                }
                title="อีเมล"
                link="mailto:Kaimuk.j@icloud.com"
                linkText="Kaimuk-2024@icloud.com"
              />

              <ContactItem
                icon={
                  <FontAwesomeIcon
                    icon={faLine}
                    className="me-2 text-primary"
                  />
                }
                title="ไลน์แอด"
                link="https://line.me/ti/p/Min0ru21"
                linkText="Min0ru"
              />
            </div>
          </div>
        </div>

        <div className="card shadow-lg border-0 rounded-lg">
          <div className="card-header bg-primary text-white">
            <h2 className="card-title h4 m-0">แบบฟอร์มแจ้งปัญหา</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">

              <FormInput
                label="เบอร์โทรศัพท์"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="กรอกเบอร์โทรศัพท์ของคุณ (ตัวเลขเท่านั้น)"
                type="tel"
                pattern="[0-9]{9,10}"
                required
                minLength={9}
                maxLength={10}
              />

              <FormInput
                label="หัวข้อ"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="กรอกหัวข้อของคุณ (อย่างน้อย 5 ตัวอักษร)"
                required
                minLength={5}
              />

              <FormTextarea
                label="ความคิดเห็น"
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="กรอกรายละเอียดของคุณ (อย่างน้อย 10 ตัวอักษร)"
                rows={4}
                required
                minLength={10}
              />

              <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 position-relative"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                )}
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อความ'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Template>
  );
};

const ContactItem = ({ icon, title, link, linkText }) => (
  <div className="d-flex align-items-center">
    {icon}
    <div>
      <strong className="d-block">{title}</strong>
      <a href={link} className="text-primary text-decoration-none">
        {linkText}
      </a>
    </div>
  </div>
);

const FormInput = ({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  onInput,
  required,
  pattern,
  minLength,
  maxLength
}) => (
  <div>
    <label htmlFor={id} className="form-label fw-medium text-dark mb-1">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onInput={onInput}
      placeholder={placeholder}
      className="form-control w-100"
      required={required}
      pattern={pattern}
      minLength={minLength}
      maxLength={maxLength}
    />
  </div>
);

const FormTextarea = ({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  rows,
  required,
  minLength
}) => (
  <div>
    <label htmlFor={id} className="form-label fw-medium text-dark mb-1">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="form-control w-100"
      required={required}
      minLength={minLength}
    />
  </div>
);

export default ReportUse;

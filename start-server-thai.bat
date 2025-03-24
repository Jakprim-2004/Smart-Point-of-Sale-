@echo off
:: ตั้งค่าภาษาไทยใน CMD
chcp 65001
echo เริ่มต้นเซิร์ฟเวอร์...
echo.

:: รันเซิร์ฟเวอร์แบบ development ด้วย nodemon
nodemon server.js

:: ถ้าต้องการใช้ Node แทน nodemon ให้ใช้บรรทัดนี้
:: node server.js

echo.
echo เซิร์ฟเวอร์หยุดทำงาน
pause

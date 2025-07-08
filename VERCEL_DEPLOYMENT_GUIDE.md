# 🚀 คำแนะนำการ Deploy ระบบ POS บน Vercel

## ✅ สิ่งที่คุณทำแล้ว
- [x] Deploy API Server ขึ้น Vercel
- [x] อัพเดท config.js ให้รองรับ Vercel URL

## 📋 ขั้นตอนต่อไป

### 1. หา Vercel URL ของ API Server
ไปที่ Vercel Dashboard และ copy URL ของ API project เช่น:
```
https://smart-pos-api.vercel.app
```

### 2. อัพเดท Environment Variables
เปิดไฟล์ `.env.production` และเปลี่ยน:
```
REACT_APP_API_URL=https://your-vercel-app.vercel.app
```
เป็น:
```
REACT_APP_API_URL=https://smart-pos-api.vercel.app
```

### 3. Deploy React App ขึ้น Vercel
```bash
cd web/app
npm run build
```
แล้วใช้ Vercel CLI หรือ drag & drop folder `build/` ไปที่ Vercel

### 4. ตั้งค่า Environment Variables ใน Vercel
ใน Vercel Dashboard ของ React app:
1. ไปที่ Settings > Environment Variables
2. เพิ่ม: `REACT_APP_API_URL` = `https://smart-pos-api.vercel.app`

## 🔄 การทดสอบ

### Local Development
```bash
# Terminal 1 - API Server (ถ้าจำเป็น)
cd api
npm start

# Terminal 2 - React App
cd web/app
npm start
```

### Production
เข้าใช้งานผ่าน Vercel URL ได้เลย โดยไม่ต้องรัน server ใน local!

## 🛡️ CORS Settings
ตรวจสอบว่า API server รองรับ CORS สำหรับ domain ของ React app:

```javascript
// ใน server.js
app.use(cors({
    origin: [
        'http://localhost:3001',              // Local development
        'https://your-react-app.vercel.app'   // Production
    ]
}));
```

## 📱 ผลลัพธ์
หลังจากนี้:
- ✅ ไม่ต้องรัน `node server.js` ใน local อีกต่อไป
- ✅ สามารถใช้ระบบ POS ได้ทุกที่ทุกเวลา
- ✅ ระบบทำงานผ่าน Vercel serverless functions
- ✅ ฐานข้อมูล Neon ทำงานได้ทั้ง local และ production

## 🔧 หาก URL เปลี่ยน
แค่อัพเดทในไฟล์เดียว: `src/config.js`

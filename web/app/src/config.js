// ไฟล์นี้ใช้สำหรับตั้งค่า API URL แบบ Dynamic
const getApiUrl = () => {
    // ถ้าอยู่ใน production (Vercel) ใช้ Vercel URL
    if (process.env.NODE_ENV === 'production') {
        return process.env.REACT_APP_API_URL || 'https://vercel.com/jakprim-2004s-projects/smart-point-of-sale-ca9k/FZ8Dpp66DcyhymmzPK725wDtwGo4';
    }
    
    // ถ้าอยู่ใน development ใช้ localhost
    return 'http://localhost:3000';
};

const config = {
    api_path: getApiUrl(),
    token_name: 'pos_token',
    headers: () => {
        const token = localStorage.getItem(config.token_name);
        if (!token) {
            console.error('No token found');
            return {};
        }
        
        return {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }
    }
}

export default config;

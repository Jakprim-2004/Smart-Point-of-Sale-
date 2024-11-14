module.exports = {
    getToken: (req) => {
        return req.headers.authorization?.replace('Bearer ', '') || null;
    },

    isLogin: (req, res, next) => {
        require('dotenv').config();
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).send({
                message: 'กรุณาเข้าสู่ระบบ',
                error: 'TOKEN_NOT_FOUND'
            });
        }

        const secret = process.env.secret;

        try {
            const verify = jwt.verify(token, secret);
            if (verify) {
                req.user = verify;
                next();
            } else {
                return res.status(403).send({
                    message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่',
                    error: 'INVALID_TOKEN'
                });
            }
        } catch (e) {
            return res.status(403).send({
                message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่',
                error: 'TOKEN_VERIFICATION_FAILED'
            });
        }
    },

    getMemberId: (req) => {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization?.replace('Bearer ', '');
        const payLoad = jwt.decode(token);

        // ตรวจสอบว่ามี payLoad และมี id
        return payLoad && payLoad.id ? payLoad.id : null;
    },

    getAdminId: (req) => {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization?.replace('Bearer ', '');
        const payLoad = jwt.decode(token);

        // ตรวจสอบว่ามี payLoad และมี id
        return payLoad && payLoad.id ? payLoad.id : null;
    }
}


//Service.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const isLogin = (req, res, next) => {
    try {
        const token = getToken(req);
        if (token) {
            jwt.verify(token, process.env.secret);
            next();
        } else {
            res.statusCode = 401;
            res.send({ message: 'กรูณาเข้าสู่ระบบใหม่' });
        }
    } catch (e) {
        res.statusCode = 401;
        res.send({ message: e.message });
    }
}

const ownerOnly = (req, res, next) => {
    try {
        const token = getToken(req);
        if (token) {
            const decoded = jwt.verify(token, process.env.secret);
            // Check if user is owner (no employeeId in token) or employee with admin level
            if (!decoded.employeeId || decoded.level === 'owner') {
                next();
            } else {
                res.status(403).send({ message: 'Access denied. Owner only.' });
            }
        } else {
            res.status(401).send({ message: 'Please login again.' });
        }
    } catch (e) {
        res.status(401).send({ message: e.message });
    }
}

const allowedEmployeeRoutes = [
  '/sale',
  '/product',
  '/ReportUse'
];

const checkRouteAccess = (req, res, next) => {
  try {
    const token = getToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.secret);
      const path = req.path;

      // Owner has access to everything
      if (!decoded.employeeId || decoded.level === 'owner') {
        next();
        return;
      }

      // Check if employee has access to this route
      if (allowedEmployeeRoutes.some(route => path.startsWith(route))) {
        next();
      } else {
        res.status(403).send({ message: 'Access denied to this resource' });
      }
    } else {
      res.status(401).send({ message: 'Please login again' });
    }
  } catch (e) {
    res.status(401).send({ message: e.message });
  }
}

const getMemberId = (req) => {
    const token = getToken(req);
    const payload = jwt.decode(token);
    return payload.id;
}

const getEmployeeId = (req) => {
    const token = getToken(req);
    const payload = jwt.decode(token);
    return payload.employeeId;
}

const getUserLevel = (req) => {
    const token = getToken(req);
    const payload = jwt.decode(token);
    return payload.level;
}

const getToken = (req) => {
    return req.headers.authorization?.split(' ')[1];
}

module.exports = {
    isLogin,
    ownerOnly,
    getMemberId,
    getEmployeeId,
    getUserLevel,
    getToken,
    checkRouteAccess
}
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true, tenant: true }
    });

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    
    if (req.user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'User account is inactive' });
    }
    
    if (req.user.tenant.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Tenant account is inactive' });
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({ success: false, message: 'Forbidden: No role assigned' });
    }

    // OWNER has full access
    if (user.role.name === 'OWNER' || user.role.permissions.includes('*')) {
      return next();
    }

    const hasPermission = requiredPermissions.some(perm => user.role.permissions.includes(perm));
    
    if (hasPermission) {
      return next();
    }

    return res.status(403).json({ success: false, message: `Forbidden: You do not have required permissions` });
  };
};

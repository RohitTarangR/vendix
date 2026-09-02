import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name, businessName, businessType } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (prisma) => {
      const tenant = await prisma.tenant.create({
        data: {
          name: businessName,
          businessType
        }
      });

      const ownerRole = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: 'OWNER',
          permissions: ['*'] // full access
        }
      });

      await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: 'MANAGER',
          permissions: [
            'view_dashboard',
            'manage_pos',
            'view_orders',
            'manage_orders',
            'view_products',
            'manage_products',
            'view_inventory',
            'manage_inventory',
            'view_purchases',
            'manage_purchases',
            'view_customers',
            'manage_customers',
            'view_suppliers',
            'manage_suppliers',
            'view_stores'
          ]
        }
      });

      await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: 'CASHIER',
          permissions: ['manage_pos', 'view_orders']
        }
      });

      const store = await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch'
        }
      });

      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          roleId: ownerRole.id,
          storeId: store.id,
          name,
          email,
          password: hashedPassword
        },
        include: {
          role: true
        }
      });

      return { user, tenant };
    });

      await prisma.sessionLog.create({
        data: {
          tenantId: result.tenant.id,
          userId: result.user.id,
          action: 'LOGIN',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(201).json({
      success: true,
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        token: generateToken(result.user.id),
        tenant: result.tenant,
        role: result.user.role
      },
      message: 'Registration successful'
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { tenant: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await prisma.sessionLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
        tenant: user.tenant,
        role: user.role
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await prisma.sessionLog.create({
        data: {
          tenantId: req.user.tenantId,
          userId: req.user.id,
          action: 'LOGOUT',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        role: true,
        tenant: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

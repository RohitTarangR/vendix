import bcrypt from 'bcrypt';
import prisma from '../config/db.js';

// --- Roles Management ---

export const getRoles = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Self-healing default roles
    const existingRoles = await prisma.role.findMany({
      where: { tenantId }
    });

    const existingNames = existingRoles.map(r => r.name);

    if (!existingNames.includes('OWNER')) {
      await prisma.role.create({
        data: { tenantId, name: 'OWNER', permissions: ['*'] }
      });
    }
    if (!existingNames.includes('MANAGER')) {
      await prisma.role.create({
        data: {
          tenantId,
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
    }
    if (!existingNames.includes('CASHIER')) {
      await prisma.role.create({
        data: { tenantId, name: 'CASHIER', permissions: ['manage_pos', 'view_orders'] }
      });
    }

    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    // Check if name is OWNER
    if (name.toUpperCase() === 'OWNER') {
      return res.status(400).json({ success: false, message: 'Cannot create another OWNER role' });
    }

    const roleExists = await prisma.role.findFirst({
      where: { tenantId, name: name.toUpperCase() }
    });

    if (roleExists) {
      return res.status(400).json({ success: false, message: 'Role with this name already exists' });
    }

    const role = await prisma.role.create({
      data: {
        tenantId,
        name: name.toUpperCase(),
        permissions: permissions || []
      }
    });

    res.status(201).json({ success: true, data: role, message: 'Role created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, permissions } = req.body;

    const role = await prisma.role.findFirst({
      where: { id, tenantId }
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.name === 'OWNER') {
      return res.status(400).json({ success: false, message: 'Cannot modify OWNER role' });
    }

    // If changing name, check conflict
    if (name && name.toUpperCase() !== role.name) {
      const nameConflict = await prisma.role.findFirst({
        where: { tenantId, name: name.toUpperCase() }
      });
      if (nameConflict) {
        return res.status(400).json({ success: false, message: 'Another role with this name already exists' });
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: name ? name.toUpperCase() : undefined,
        permissions: permissions || undefined
      }
    });

    res.json({ success: true, data: updatedRole, message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      include: { users: true }
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.name === 'OWNER') {
      return res.status(400).json({ success: false, message: 'Cannot delete OWNER role' });
    }

    if (role.users.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete role assigned to users. Reassign users first.' });
    }

    await prisma.role.delete({ where: { id } });

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};


// --- Staff Users Management ---

export const getStaff = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const staff = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        store: {
          select: {
            id: true,
            name: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, email, password, phone, roleId, storeId } = req.body;

    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ success: false, message: 'Required fields: name, email, password, roleId' });
    }

    // Check email uniqueness
    const emailExists = await prisma.user.findUnique({
      where: { email }
    });

    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }

    // Verify role belongs to tenant
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId }
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Assigned role not found' });
    }

    // Verify store belongs to tenant if storeId is provided
    if (storeId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, tenantId }
      });
      if (!store) {
        return res.status(444).json({ success: false, message: 'Assigned store not found' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: {
        tenantId,
        roleId,
        storeId: storeId || null,
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: newStaff, message: 'Staff user created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, email, password, phone, roleId, storeId, status } = req.body;

    const staffUser = await prisma.user.findFirst({
      where: { id, tenantId },
      include: { role: true }
    });

    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'Staff user not found' });
    }

    // If email is changing, check uniqueness
    if (email && email !== staffUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email address already in use' });
      }
    }

    // Verify role belongs to tenant if roleId is changing
    if (roleId && roleId !== staffUser.roleId) {
      if (staffUser.role.name === 'OWNER') {
        return res.status(400).json({ success: false, message: 'Cannot change OWNER role' });
      }

      const role = await prisma.role.findFirst({
        where: { id: roleId, tenantId }
      });
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }
    }

    // Verify store belongs to tenant if storeId is provided and changing
    if (storeId && storeId !== staffUser.storeId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, tenantId }
      });
      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }
    }

    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email || undefined,
        password: hashedPassword || undefined,
        phone: phone !== undefined ? phone : undefined,
        roleId: roleId || undefined,
        storeId: storeId !== undefined ? (storeId === '' ? null : storeId) : undefined,
        status: status || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({ success: true, data: updatedStaff, message: 'Staff user updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteStaff = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const staffUser = await prisma.user.findFirst({
      where: { id, tenantId },
      include: { role: true }
    });

    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'Staff user not found' });
    }

    if (staffUser.role.name === 'OWNER') {
      return res.status(400).json({ success: false, message: 'Cannot delete the OWNER account' });
    }

    // Instead of hard deleting, we can either soft delete or set status to INACTIVE.
    // Let's set status to INACTIVE and change email slightly to allow reusing the email if desired,
    // or we can hard delete them if there are no order constraints.
    // Wait, Order table has relation to cashierId (which is User). If we delete the user, orders might fail if onDelete is restrict.
    // Let's check how Order relation is defined in schema.prisma.
    // Line 81: "orders    Order[]". Let's search for relation properties of cashier in schema.prisma.
    // Let's just set status to INACTIVE. Or let's delete them if they haven't made orders, otherwise set status to INACTIVE.
    // Let's do delete/deactivate safely.
    
    // Check if user has orders
    const orderCount = await prisma.order.count({
      where: { cashierId: id }
    });

    if (orderCount > 0) {
      // Deactivate
      await prisma.user.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });
      return res.json({ success: true, message: 'Staff user has transaction history. Account has been set to INACTIVE.' });
    } else {
      // Hard delete
      await prisma.user.delete({ where: { id } });
      return res.json({ success: true, message: 'Staff user deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};

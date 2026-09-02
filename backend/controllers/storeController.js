import prisma from '../config/db.js';

export const getStores = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const stores = await prisma.store.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: stores });
  } catch (error) {
    next(error);
  }
};

export const createStore = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Store Name is required' });
    }

    const store = await prisma.store.create({
      data: {
        tenantId,
        name,
        location
      }
    });

    res.status(201).json({ success: true, data: store, message: 'Store branch created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, location } = req.body;

    const existing = await prisma.store.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const store = await prisma.store.update({
      where: { id },
      data: { name, location }
    });

    res.json({ success: true, data: store, message: 'Store branch updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteStore = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const existing = await prisma.store.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Check if store has users or orders
    const ordersCount = await prisma.order.count({ where: { storeId: id } });
    const usersCount = await prisma.user.count({ where: { storeId: id } });

    if (ordersCount > 0 || usersCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete store branch with linked orders or staff users.' 
      });
    }

    await prisma.store.delete({ where: { id } });

    res.json({ success: true, message: 'Store branch deleted successfully' });
  } catch (error) {
    next(error);
  }
};

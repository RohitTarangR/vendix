import prisma from '../config/db.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, page = 1, limit = 10 } = req.query;

    const where = { tenantId, status: 'ACTIVE' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [suppliers, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supplier.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name,
        phone,
        email,
        address,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({ success: true, data: supplier, message: 'Supplier created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, phone, email, address, status } = req.body;

    const existing = await prisma.supplier.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, phone, email, address, status }
    });

    res.json({ success: true, data: supplier, message: 'Supplier updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const existing = await prisma.supplier.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Soft delete
    await prisma.supplier.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });

    res.json({ success: true, message: 'Supplier deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

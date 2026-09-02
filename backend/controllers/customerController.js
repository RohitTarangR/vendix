import prisma from '../config/db.js';

export const getCustomers = async (req, res, next) => {
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

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        customers,
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

export const createCustomer = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, phone, email, address, customerGroup } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    let existing = null;
    if (phone) {
      existing = await prisma.customer.findFirst({
        where: { tenantId, phone }
      });
    } else {
      existing = await prisma.customer.findFirst({
        where: { tenantId, name }
      });
    }

    if (existing) {
      return res.status(200).json({ success: true, data: existing, message: 'Customer already exists' });
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name,
        phone,
        email,
        address,
        customerGroup,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({ success: true, data: customer, message: 'Customer created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, phone, email, address, customerGroup, status } = req.body;

    const existing = await prisma.customer.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone, email, address, customerGroup, status }
    });

    res.json({ success: true, data: customer, message: 'Customer updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const existing = await prisma.customer.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Instead of deleting, soft-delete by deactivating
    await prisma.customer.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });

    res.json({ success: true, message: 'Customer deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

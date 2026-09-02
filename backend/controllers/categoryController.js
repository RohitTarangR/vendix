import prisma from '../config/db.js';

export const getCategories = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, status } = req.query;

    const where = { tenantId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const category = await prisma.category.create({
      data: {
        tenantId,
        name,
        description,
        status: status || 'ACTIVE'
      }
    });

    res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, description, status } = req.body;

    const existing = await prisma.category.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, description, status }
    });

    res.json({ success: true, data: category, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const existing = await prisma.category.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if category is used in products
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category as it is associated with products. Archive it instead.'
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

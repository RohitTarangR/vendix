import prisma from '../config/db.js';

export const getInventoryTransactions = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { productId, type, page = 1, limit = 10 } = req.query;

    const where = { tenantId };
    if (productId) {
      where.productId = productId;
    }
    if (type) {
      where.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [transactions, total] = await prisma.$transaction([
      prisma.inventoryTransaction.findMany({
        where,
        include: { product: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.inventoryTransaction.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        transactions,
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

export const adjustStock = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { productId, quantity, type, reason } = req.body; // type can be ADJUSTMENT, DAMAGE, etc.

    if (!productId || quantity === undefined || !type) {
      return res.status(400).json({ success: false, message: 'Product ID, quantity, and type are required' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a valid integer' });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newStock = product.currentStock + qty;
    if (newStock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Stock adjustment would result in negative stock (${newStock}). Current stock is ${product.currentStock}.` 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create transaction log
      const log = await tx.inventoryTransaction.create({
        data: {
          tenantId,
          productId,
          type,
          quantity: qty,
          referenceId: reason
        }
      });

      // 2. Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock }
      });

      return { log, updatedProduct };
    });

    res.json({
      success: true,
      data: result,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    next(error);
  }
};

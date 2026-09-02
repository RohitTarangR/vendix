import prisma from '../config/db.js';

export const createPurchase = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { supplierId, items, purchaseNumber, status = 'COMPLETED' } = req.body;

    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'Supplier ID is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase items are required' });
    }

    const finalPurchaseNumber = purchaseNumber || `PUR-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsToCreate = [];
      const stockUpdates = [];
      const inventoryLogs = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId }
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        const qty = parseInt(item.quantity);
        if (qty <= 0) {
          throw new Error(`Quantity for product ${product.name} must be greater than zero`);
        }

        const price = parseFloat(item.price || product.purchasePrice);
        const itemTotal = price * qty;
        totalAmount += itemTotal;

        itemsToCreate.push({
          productId: product.id,
          quantity: qty,
          price: price,
          total: itemTotal
        });

        // Increment stock and update purchase price if it changed
        stockUpdates.push(
          tx.product.update({
            where: { id: product.id },
            data: { 
              currentStock: { increment: qty },
              purchasePrice: price
            }
          })
        );

        inventoryLogs.push({
          tenantId,
          productId: product.id,
          type: 'PURCHASE',
          quantity: qty
        });
      }

      // Create purchase
      const purchase = await tx.purchase.create({
        data: {
          tenantId,
          supplierId,
          purchaseNumber: finalPurchaseNumber,
          totalAmount: parseFloat(totalAmount),
          status,
          items: {
            create: itemsToCreate
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          supplier: true
        }
      });

      // Update product stocks
      await Promise.all(stockUpdates);

      // Create inventory logs
      const logsWithPurchase = inventoryLogs.map(log => ({
        ...log,
        referenceId: purchase.id
      }));

      await tx.inventoryTransaction.createMany({
        data: logsWithPurchase
      });

      return purchase;
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Inbound purchase recorded and stock levels updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { supplierId, page = 1, limit = 10 } = req.query;

    const where = { tenantId };
    if (supplierId) where.supplierId = supplierId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [purchases, total] = await prisma.$transaction([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchase.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        purchases,
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

export const getPurchaseById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const purchase = await prisma.purchase.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: { product: true }
        },
        supplier: true
      }
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase record not found' });
    }

    res.json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

import prisma from '../config/db.js';

export const createOrder = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const cashierId = req.user.id;
    let storeId = req.user.storeId;

    if (!storeId) {
      const firstStore = await prisma.store.findFirst({
        where: { tenantId }
      });
      if (firstStore) {
        storeId = firstStore.id;
      } else {
        return res.status(400).json({ success: false, message: 'Cashier is not assigned to any store branch, and no stores exist.' });
      }
    }

    const { customerId, items, discount = 0, tax = 0, paymentMethod, notes, status = 'COMPLETED' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    // Auto-generate order number
    const orderCount = await prisma.order.count({ where: { tenantId } });
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;

      // Validate products, check stock, calculate subtotal
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

        if (product.status === 'ARCHIVED') {
          throw new Error(`Product ${product.name} is archived and cannot be sold`);
        }

        const qty = parseInt(item.quantity);
        if (qty <= 0) {
          throw new Error(`Quantity for product ${product.name} must be greater than zero`);
        }

        // Stock check
        if (product.currentStock < qty) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.currentStock}, Requested: ${qty}`);
        }

        const price = parseFloat(item.price || product.sellingPrice);
        const itemTotal = price * qty;
        subtotal += itemTotal;

        itemsToCreate.push({
          productId: product.id,
          quantity: qty,
          price: price,
          total: itemTotal
        });

        stockUpdates.push(
          tx.product.update({
            where: { id: product.id },
            data: { currentStock: { decrement: qty } }
          })
        );

        inventoryLogs.push({
          tenantId,
          productId: product.id,
          type: 'SALE',
          quantity: -qty
        });
      }

      // Calculations
      const subtotalDec = parseFloat(subtotal);
      const discountDec = parseFloat(discount);
      const taxDec = parseFloat(tax);
      const totalDec = subtotalDec - discountDec + taxDec;

      if (totalDec < 0) {
        throw new Error('Total order amount cannot be negative');
      }

      // 1. Create order
      const order = await tx.order.create({
        data: {
          tenantId,
          storeId,
          cashierId,
          customerId: customerId || null,
          orderNumber,
          subtotal: subtotalDec,
          discount: discountDec,
          tax: taxDec,
          total: totalDec,
          status: status,
          paymentMethod: status === 'HELD' ? null : paymentMethod,
          notes,
          items: {
            create: itemsToCreate
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          cashier: { select: { name: true } },
          customer: true
        }
      });

      if (status === 'COMPLETED') {
        // 2. Create payment record
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: totalDec,
            method: paymentMethod || 'CASH',
            status: 'COMPLETED'
          }
        });

        // 3. Update stock levels
        await Promise.all(stockUpdates);

        // 4. Create inventory transactions logs
        const logsWithOrder = inventoryLogs.map(log => ({
          ...log,
          referenceId: order.id
        }));

        await tx.inventoryTransaction.createMany({
          data: logsWithOrder
        });
      }

      return order;
    });

    res.status(201).json({
      success: true,
      data: result,
      message: status === 'HELD' ? 'Order held successfully' : 'Order completed successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, storeId, cashierId, page = 1, limit = 10 } = req.query;

    const where = { tenantId };
    if (status) where.status = status;
    if (storeId) where.storeId = storeId;
    if (cashierId) where.cashierId = cashierId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          store: true,
          cashier: { select: { name: true } },
          items: {
            include: { product: true }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        orders,
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

export const getOrderById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: { product: true }
        },
        payments: true,
        customer: true,
        store: true,
        cashier: { select: { name: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const refundOrder = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'REFUNDED') {
      return res.status(400).json({ success: false, message: 'Order has already been refunded' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update order status to REFUNDED
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: 'REFUNDED' }
      });

      // 2. Adjust payment status
      await tx.payment.updateMany({
        where: { orderId: id },
        data: { status: 'REFUNDED' }
      });

      // 3. Return stock levels and log transactions
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } }
        });

        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'RETURN',
            quantity: item.quantity,
            referenceId: `REFUND-${order.id}`
          }
        });
      }

      return updatedOrder;
    });

    res.json({ success: true, data: result, message: 'Order refunded and stock returned successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateHeldOrder = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { items, discount = 0, tax = 0 } = req.body;

    const existingOrder = await prisma.order.findFirst({
      where: { id, tenantId, status: 'HELD' }
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Held order not found' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.orderItem.deleteMany({ where: { orderId: id } });

      let subtotal = 0;
      const itemsToCreate = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId }
        });
        if (!product) throw new Error(`Product not found`);

        const qty = parseInt(item.quantity);
        const price = parseFloat(item.price || product.sellingPrice);
        const itemTotal = price * qty;
        subtotal += itemTotal;

        itemsToCreate.push({
          productId: product.id,
          quantity: qty,
          price: price,
          total: itemTotal
        });
      }

      const subtotalDec = parseFloat(subtotal);
      const discountDec = parseFloat(discount);
      const taxDec = parseFloat(tax);
      const totalDec = subtotalDec - discountDec + taxDec;

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          subtotal: subtotalDec,
          discount: discountDec,
          tax: taxDec,
          total: totalDec,
          items: {
            create: itemsToCreate
          }
        },
        include: {
          items: { include: { product: true } },
          customer: true
        }
      });

      return updatedOrder;
    });

    res.json({ success: true, data: result, message: 'Held order updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const completeHeldOrder = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { paymentMethod, notes } = req.body;

    const existingOrder = await prisma.order.findFirst({
      where: { id, tenantId, status: 'HELD' },
      include: { items: { include: { product: true } } }
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Held order not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const stockUpdates = [];
      const inventoryLogs = [];

      for (const item of existingOrder.items) {
        const product = item.product;
        if (product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`);
        }

        stockUpdates.push(
          tx.product.update({
            where: { id: product.id },
            data: { currentStock: { decrement: item.quantity } }
          })
        );

        inventoryLogs.push({
          tenantId,
          productId: product.id,
          type: 'SALE',
          quantity: -item.quantity,
          referenceId: existingOrder.id
        });
      }

      const completedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || existingOrder.notes
        },
        include: {
          items: { include: { product: true } },
          customer: true,
          cashier: { select: { name: true } }
        }
      });

      await tx.payment.create({
        data: {
          orderId: existingOrder.id,
          amount: existingOrder.total,
          method: paymentMethod || 'CASH',
          status: 'COMPLETED'
        }
      });

      await Promise.all(stockUpdates);
      await tx.inventoryTransaction.createMany({ data: inventoryLogs });

      return completedOrder;
    });

    res.json({ success: true, data: result, message: 'Held order completed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

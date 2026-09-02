import prisma from '../config/db.js';

export const getProducts = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, categoryId, status, page = 1, limit = 10 } = req.query;

    const where = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'ARCHIVED' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        products,
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

export const getProductById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      name,
      sku,
      barcode,
      description,
      image,
      purchasePrice,
      sellingPrice,
      mrp,
      tax,
      unit,
      minStock,
      currentStock,
      categoryId
    } = req.body;

    if (!name || !sku || !purchasePrice || !sellingPrice || !categoryId) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Check SKU uniqueness per tenant
    const skuExists = await prisma.product.findFirst({
      where: { sku, tenantId }
    });
    if (skuExists) {
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          tenantId,
          categoryId,
          name,
          sku,
          barcode: barcode || null,
          description: description || null,
          image: image || null,
          purchasePrice,
          sellingPrice,
          mrp: mrp ? mrp : null,
          tax: tax ? tax : null,
          unit: unit || null,
          minStock: parseInt(minStock) || 0,
          currentStock: parseInt(currentStock) || 0,
          status: 'ACTIVE'
        }
      });

      // Record opening stock if currentStock > 0
      if (parseInt(currentStock) > 0) {
        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            productId: p.id,
            type: 'OPENING_STOCK',
            quantity: parseInt(currentStock)
          }
        });
      }

      return p;
    });

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const {
      name,
      sku,
      barcode,
      description,
      image,
      purchasePrice,
      sellingPrice,
      mrp,
      tax,
      unit,
      minStock,
      categoryId,
      status
    } = req.body;

    const existing = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.product.findFirst({
        where: { sku, tenantId, id: { not: id } }
      });
      if (skuExists) {
        return res.status(400).json({ success: false, message: 'SKU already exists' });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        barcode: barcode || null,
        description: description || null,
        image: image || null,
        purchasePrice,
        sellingPrice,
        mrp: mrp ? mrp : null,
        tax: tax ? tax : null,
        unit: unit || null,
        minStock: minStock !== undefined ? parseInt(minStock) : undefined,
        categoryId,
        status
      }
    });

    res.json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const archiveProduct = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Instead of deleting, archive the product to preserve references in sales history
    await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });

    res.json({ success: true, message: 'Product archived successfully' });
  } catch (error) {
    next(error);
  }
};

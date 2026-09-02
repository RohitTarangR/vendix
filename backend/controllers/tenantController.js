import prisma from '../config/db.js';

export const getSettings = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    res.json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, businessType, logo, phone, email, address } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, businessType, logo, phone, email, address }
    });

    res.json({ success: true, data: tenant, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    let trendStartDate = new Date();
    trendStartDate.setDate(trendStartDate.getDate() - 6);
    let trendEndDate = new Date();

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end
        }
      };

      trendStartDate = new Date(start);
      trendEndDate = new Date(end);
    }

    const orderWhere = { tenantId, status: 'COMPLETED', ...dateFilter };

    // 1. Total sales amount
    const salesAggregate = await prisma.order.aggregate({
      where: orderWhere,
      _sum: { total: true },
      _count: { id: true }
    });

    const totalSales = salesAggregate._sum.total ? parseFloat(salesAggregate._sum.total) : 0;
    const totalOrders = salesAggregate._count.id;

    // 2. Count of categories, products, customers
    const totalCategories = await prisma.category.count({ where: { tenantId } });
    const totalProducts = await prisma.product.count({ where: { tenantId, status: 'ACTIVE' } });
    
    // Optionally filter customers by date too, or leave as total. We'll leave as total for now, or filter if requested. 
    // Usually 'Customers Base' implies total customers.
    const totalCustomers = await prisma.customer.count({ where: { tenantId } });

    // 3. Count low stock products
    const products = await prisma.product.findMany({
      where: { tenantId, status: 'ACTIVE' }
    });
    const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;

    // 4. Fetch recent 5 completed orders
    const recentOrders = await prisma.order.findMany({
      where: { tenantId, ...dateFilter },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });

    // 5. Aggregate sales history for charts based on date range
    const diffTime = Math.abs(trendEndDate - trendStartDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysToIterate = Math.min(diffDays + 1, 31); // Max 31 points

    const salesTrend = [];
    for (let i = daysToIterate - 1; i >= 0; i--) {
      const date = new Date(trendEndDate);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dailySalesAgg = await prisma.order.aggregate({
        where: {
          tenantId,
          status: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        _sum: {
          total: true
        }
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const label = daysToIterate > 7 ? `${date.getDate()}/${date.getMonth()+1}` : dayNames[startOfDay.getDay()];
      
      salesTrend.push({
        label: label,
        amount: dailySalesAgg._sum.total ? parseFloat(dailySalesAgg._sum.total) : 0
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalOrders,
          totalCategories,
          totalProducts,
          totalCustomers,
          lowStockCount
        },
        recentOrders,
        salesTrend
      }
    });
  } catch (error) {
    next(error);
  }
};


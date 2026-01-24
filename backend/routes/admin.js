import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { sendTicketsEmail } from '../services/email.js';
import { generateTickets } from '../services/tickets.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateAdmin);

// GET /api/admin/orders - Get all orders with filters
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          prom: true,
          items: {
            include: {
              ticketType: true
            }
          },
        paymentProof: {
          select: {
            id: true,
            fileName: true,
            originalFileName: true,
            mimeType: true,
            uploadedAt: true
          }
        },
          tickets: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/orders/:id - Get single order
router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        prom: true,
        items: {
          include: {
            ticketType: true
          }
        },
        paymentProof: {
          select: {
            id: true,
            fileName: true,
            originalFileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true
          }
        },
        tickets: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/orders/:id/verify - Approve payment
router.post('/orders/:id/verify', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        prom: true,
        items: {
          include: {
            ticketType: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ error: `Order is ${order.status}, cannot verify` });
    }

    // Generate tickets
    const tickets = await generateTickets(order);

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'VERIFIED' },
      include: {
        tickets: true,
        prom: true,
        items: {
          include: {
            ticketType: true
          }
        }
      }
    });

    // Send tickets email
    try {
      await sendTicketsEmail(updatedOrder);
    } catch (emailError) {
      console.error('Failed to send tickets email:', emailError);
      // Don't fail the verification if email fails
    }

    res.json({
      message: 'Order verified and tickets generated',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/orders/:id/reject - Reject payment
router.post('/orders/:id/reject', 
  body('reason').optional().trim().isLength({ max: 500 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await prisma.order.findUnique({
        where: { id: req.params.id }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'PENDING_VERIFICATION') {
        return res.status(400).json({ error: `Order is ${order.status}, cannot reject` });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'REJECTED' }
      });

      // TODO: Send rejection email to customer

      res.json({
        message: 'Order rejected',
        order: updatedOrder
      });
    } catch (error) {
      next(error);
  }
});

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [totalOrders, pendingOrders, verifiedOrders, rejectedOrders, totalRevenue] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING_VERIFICATION' } }),
      prisma.order.count({ where: { status: 'VERIFIED' } }),
      prisma.order.count({ where: { status: 'REJECTED' } }),
      prisma.order.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        verified: verifiedOrders,
        rejected: rejectedOrders
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/stats/sales - Get detailed sales statistics by prom and ticket type
router.get('/stats/sales', async (req, res, next) => {
  try {
    // Get all verified orders with their items
    const verifiedOrders = await prisma.order.findMany({
      where: { status: 'VERIFIED' },
      include: {
        prom: true,
        items: {
          include: {
            ticketType: true
          }
        }
      }
    });

    // Calculate sales by prom
    const salesByProm = {};
    const salesByTicketType = {};

    verifiedOrders.forEach(order => {
      const promName = order.prom.name;
      if (!salesByProm[promName]) {
        salesByProm[promName] = {
          promId: order.prom.id,
          promName: promName,
          totalTickets: 0,
          totalRevenue: 0,
          ticketTypes: {}
        };
      }

      order.items.forEach(item => {
        const ticketTypeName = item.ticketType.name;
        const quantity = item.quantity;

        // Update prom totals
        salesByProm[promName].totalTickets += quantity;
        salesByProm[promName].totalRevenue += item.subtotal;

        // Update ticket type totals for this prom
        if (!salesByProm[promName].ticketTypes[ticketTypeName]) {
          salesByProm[promName].ticketTypes[ticketTypeName] = {
            name: ticketTypeName,
            quantity: 0,
            revenue: 0
          };
        }
        salesByProm[promName].ticketTypes[ticketTypeName].quantity += quantity;
        salesByProm[promName].ticketTypes[ticketTypeName].revenue += item.subtotal;

        // Global ticket type totals
        if (!salesByTicketType[ticketTypeName]) {
          salesByTicketType[ticketTypeName] = {
            name: ticketTypeName,
            quantity: 0,
            revenue: 0
          };
        }
        salesByTicketType[ticketTypeName].quantity += quantity;
        salesByTicketType[ticketTypeName].revenue += item.subtotal;
      });
    });

    res.json({
      byProm: Object.values(salesByProm),
      byTicketType: Object.values(salesByTicketType)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/proms - Get all proms (including inactive)
router.get('/proms', async (req, res, next) => {
  try {
    const proms = await prisma.prom.findMany({
      include: {
        ticketTypes: {
          orderBy: { price: 'asc' }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { date: 'asc' }
    });
    res.json(proms);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/proms - Create new prom
router.post('/proms',
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('date').isISO8601(),
  body('venue').trim().isLength({ min: 2, max: 200 }),
  body('city').trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('ticketTypes').isArray({ min: 1 }).withMessage('At least one ticket type required'),
  body('ticketTypes.*.name').trim().isLength({ min: 2, max: 50 }),
  body('ticketTypes.*.price').isFloat({ min: 0 }),
  body('ticketTypes.*.description').optional().trim().isLength({ max: 200 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, date, venue, city, description, ticketTypes } = req.body;

      // Check if prom with same name already exists
      const existing = await prisma.prom.findFirst({
        where: { name }
      });

      if (existing) {
        return res.status(400).json({ error: 'Prom with this name already exists' });
      }

      const prom = await prisma.prom.create({
        data: {
          name,
          date: new Date(date),
          venue,
          city,
          description: description || null,
          isActive: true,
          ticketTypes: {
            create: ticketTypes.map(tt => ({
              name: tt.name,
              price: parseFloat(tt.price),
              description: tt.description || null,
              isActive: true
            }))
          }
        },
        include: {
          ticketTypes: true
        }
      });

      res.status(201).json(prom);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/proms/:id - Update prom
router.put('/proms/:id',
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('date').optional().isISO8601(),
  body('venue').optional().trim().isLength({ min: 2, max: 200 }),
  body('city').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = {};

      if (req.body.name) updateData.name = req.body.name;
      if (req.body.date) updateData.date = new Date(req.body.date);
      if (req.body.venue) updateData.venue = req.body.venue;
      if (req.body.city) updateData.city = req.body.city;
      if (req.body.description !== undefined) updateData.description = req.body.description || null;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      const prom = await prisma.prom.update({
        where: { id },
        data: updateData,
        include: {
          ticketTypes: true
        }
      });

      res.json(prom);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Prom not found' });
      }
      next(error);
    }
  }
);

// DELETE /api/admin/proms/:id - Delete prom (soft delete by setting isActive to false)
router.delete('/proms/:id', async (req, res, next) => {
  try {
    const prom = await prisma.prom.update({
      where: { id: req.params.id },
      data: { isActive: false },
      include: {
        ticketTypes: true
      }
    });

    res.json({ message: 'Prom deactivated', prom });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Prom not found' });
    }
    next(error);
  }
});

export default router;


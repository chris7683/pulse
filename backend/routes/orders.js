import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { generateReferenceCode } from '../utils/reference.js';
import { getBankDetails } from '../config/bank.js';
import { sendOrderConfirmationEmail, sendTicketsEmail } from '../services/email.js';
import { generateTickets } from '../services/tickets.js';

const router = express.Router();

// Validation middleware
const validateOrder = [
  body('promId').isUUID().withMessage('Invalid prom ID'),
  body('customerName').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('customerEmail').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('customerPhone').trim().isLength({ min: 10, max: 20 }).withMessage('Invalid phone number'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.ticketTypeId').isUUID().withMessage('Invalid ticket type ID'),
  body('items.*.quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be 1-10'),
];

// POST /api/orders - Create new order
router.post('/', validateOrder, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { promId, customerName, customerEmail, customerPhone, items } = req.body;

    // Verify prom exists and is active
    const prom = await prisma.prom.findUnique({
      where: { id: promId, isActive: true },
      include: { ticketTypes: true }
    });

    if (!prom) {
      return res.status(404).json({ error: 'Prom not found or inactive' });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const ticketType = prom.ticketTypes.find(tt => tt.id === item.ticketTypeId && tt.isActive);
      if (!ticketType) {
        return res.status(400).json({ error: `Invalid ticket type: ${item.ticketTypeId}` });
      }

      const subtotal = ticketType.price * item.quantity;
      totalAmount += subtotal;

      validatedItems.push({
        ticketTypeId: ticketType.id,
        quantity: item.quantity,
        unitPrice: ticketType.price,
        subtotal
      });
    }

    // Generate unique reference code
    const referenceCode = await generateReferenceCode();

    // Create order
    const order = await prisma.order.create({
      data: {
        promId,
        referenceCode,
        customerName,
        customerEmail,
        customerPhone,
        totalAmount,
        status: 'PENDING_VERIFICATION',
        items: {
          create: validatedItems
        }
      },
      include: {
        prom: true,
        items: {
          include: {
            ticketType: true
          }
        }
      }
    });

    // Get bank details
    const bankDetails = getBankDetails();

    // Send confirmation email with bank details
    try {
      await sendOrderConfirmationEmail(order, bankDetails);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      order: {
        id: order.id,
        referenceCode: order.referenceCode,
        status: order.status,
        totalAmount: order.totalAmount,
        customerEmail: order.customerEmail
      },
      bankDetails
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:referenceCode - Get order by reference code
router.get('/:referenceCode', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { referenceCode: req.params.referenceCode },
      include: {
        prom: true,
        items: {
          include: {
            ticketType: true
          }
        },
        paymentProof: true,
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

export default router;


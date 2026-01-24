import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// GET /api/proms - Get all active proms
router.get('/', async (req, res, next) => {
  try {
    const proms = await prisma.prom.findMany({
      where: { isActive: true },
      include: {
        ticketTypes: {
          where: { isActive: true },
          orderBy: { price: 'asc' }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    res.json(proms);
  } catch (error) {
    next(error);
  }
});

// GET /api/proms/:id - Get single prom with ticket types
router.get('/:id', async (req, res, next) => {
  try {
    const prom = await prisma.prom.findUnique({
      where: { id: req.params.id },
      include: {
        ticketTypes: {
          where: { isActive: true },
          orderBy: { price: 'asc' }
        }
      }
    });
    
    if (!prom || !prom.isActive) {
      return res.status(404).json({ error: 'Prom not found' });
    }
    
    res.json(prom);
  } catch (error) {
    next(error);
  }
});

export default router;


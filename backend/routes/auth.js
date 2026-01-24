import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';

const router = express.Router();

// POST /api/admin/auth/login - Admin login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const admin = await prisma.adminUser.findUnique({
        where: { email }
      });

      if (!admin || !admin.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLogin: new Date() }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: admin.id, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;


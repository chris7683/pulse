import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import prisma from '../config/database.js';
import { validateFile } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `payment-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/jpg,application/pdf').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

// POST /api/upload/payment-proof/:orderId - Upload payment proof
router.post('/payment-proof/:orderId', upload.single('file'), validateFile, async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify order exists and is pending
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ error: 'Order is not pending verification' });
    }

    // Check if payment proof already exists
    const existingProof = await prisma.paymentProof.findUnique({
      where: { orderId }
    });

    // Store the actual filename that multer generated (not the original name)
    const actualFileName = req.file.filename;
    const originalFileName = req.file.originalname;

    if (existingProof) {
      // Delete old file if it exists
      const fs = await import('fs');
      try {
        if (existingProof.filePath && fs.existsSync(existingProof.filePath)) {
          fs.unlinkSync(existingProof.filePath);
        }
      } catch (err) {
        console.error('Error deleting old file:', err);
      }

      // Update existing proof
      const paymentProof = await prisma.paymentProof.update({
        where: { orderId },
        data: {
          fileName: actualFileName, // Store the actual saved filename
          originalFileName: originalFileName, // Store original name separately
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      });

      return res.json({
        message: 'Payment proof updated',
        paymentProof: {
          id: paymentProof.id,
          fileName: paymentProof.fileName,
          uploadedAt: paymentProof.uploadedAt
        }
      });
    }

    // Create new payment proof
    const paymentProof = await prisma.paymentProof.create({
      data: {
        orderId,
        fileName: actualFileName, // Store the actual saved filename
        originalFileName: originalFileName, // Store original name separately
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    res.status(201).json({
      message: 'Payment proof uploaded successfully',
      paymentProof: {
        id: paymentProof.id,
        fileName: paymentProof.fileName,
        uploadedAt: paymentProof.uploadedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;


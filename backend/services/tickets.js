import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';

/**
 * Generate unique QR codes and create ticket records
 */
export async function generateTickets(order) {
  const tickets = [];

  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      // Generate unique QR code data
      const qrData = JSON.stringify({
        ticketId: uuidv4(),
        orderId: order.id,
        referenceCode: order.referenceCode,
        ticketType: item.ticketType.name,
        prom: order.prom.name,
        timestamp: Date.now()
      });

      // Generate QR code image as data URL
      const qrCodeImage = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 256
      });

      // Create ticket record
      const ticket = await prisma.ticket.create({
        data: {
          orderId: order.id,
          qrCode: qrData,
          ticketType: item.ticketType.name
        }
      });

      tickets.push({
        ...ticket,
        qrCodeImage
      });
    }
  }

  return tickets;
}

/**
 * Validate QR code
 */
export async function validateQRCode(qrData) {
  try {
    const data = JSON.parse(qrData);
    
    const ticket = await prisma.ticket.findUnique({
      where: { qrCode: qrData },
      include: {
        order: {
          include: {
            prom: true
          }
        }
      }
    });

    if (!ticket) {
      return { valid: false, error: 'Ticket not found' };
    }

    if (ticket.order.status !== 'VERIFIED') {
      return { valid: false, error: 'Order not verified' };
    }

    return {
      valid: true,
      ticket: {
        id: ticket.id,
        ticketType: ticket.ticketType,
        prom: ticket.order.prom.name,
        orderReference: ticket.order.referenceCode
      }
    };
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' };
  }
}


import prisma from '../config/database.js';

/**
 * Generate a unique reference code for bank transfer
 * Format: PULSE-YYYYMMDD-XXXXXX (6 random alphanumeric)
 */
export async function generateReferenceCode() {
  const prefix = 'PULSE';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate 6 random alphanumeric characters
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referenceCode = `${prefix}-${date}-${random}`;

    // Check if it exists
    const existing = await prisma.order.findUnique({
      where: { referenceCode }
    });

    if (!existing) {
      return referenceCode;
    }

    attempts++;
  }

  // Fallback: add timestamp if all attempts fail
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${date}-${timestamp}`;
}


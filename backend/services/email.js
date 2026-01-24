import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send order confirmation email with bank transfer details
 */
export async function sendOrderConfirmationEmail(order, bankDetails) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured, skipping email send');
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: order.customerEmail,
    subject: `Order Confirmation - ${order.referenceCode}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7C5CFF; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .bank-details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #7C5CFF; }
          .reference { font-size: 24px; font-weight: bold; color: #7C5CFF; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pulse Productions</h1>
            <h2>Order Confirmation</h2>
          </div>
          <div class="content">
            <p>Dear ${order.customerName},</p>
            <p>Thank you for your order! Your order has been received and is pending payment verification.</p>
            
            <h3>Order Details</h3>
            <p><strong>Reference Code:</strong> <span class="reference">${order.referenceCode}</span></p>
            <p><strong>Prom:</strong> ${order.prom.name}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
            
            <h3>Bank Transfer Details</h3>
            <div class="bank-details">
              <p><strong>Bank Name:</strong> ${bankDetails.bankName}</p>
              <p><strong>Account Number:</strong> ${bankDetails.accountNumber}</p>
              <p><strong>Account Name:</strong> ${bankDetails.accountName}</p>
              <p><strong>SWIFT Code:</strong> ${bankDetails.swiftCode}</p>
              <p><strong>Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
              <p><strong>Reference:</strong> ${order.referenceCode}</p>
            </div>
            
            <p><strong>Important:</strong> Please include the reference code (${order.referenceCode}) in your bank transfer memo/notes.</p>
            <p>After making the transfer, please upload your payment proof on our website.</p>
            <p>Once verified, you will receive your digital tickets via email.</p>
          </div>
          <div class="footer">
            <p>Pulse Productions - Prom Booking System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Order Confirmation - ${order.referenceCode}
      
      Dear ${order.customerName},
      
      Thank you for your order! Your order has been received and is pending payment verification.
      
      Order Details:
      Reference Code: ${order.referenceCode}
      Prom: ${order.prom.name}
      Total Amount: $${order.totalAmount.toFixed(2)}
      
      Bank Transfer Details:
      Bank Name: ${bankDetails.bankName}
      Account Number: ${bankDetails.accountNumber}
      Account Name: ${bankDetails.accountName}
      SWIFT Code: ${bankDetails.swiftCode}
      Amount: $${order.totalAmount.toFixed(2)}
      Reference: ${order.referenceCode}
      
      Please include the reference code in your bank transfer memo/notes.
      After making the transfer, please upload your payment proof on our website.
      Once verified, you will receive your digital tickets via email.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${order.customerEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send tickets email with QR codes
 */
export async function sendTicketsEmail(order) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured, skipping email send');
    return;
  }

  const tickets = order.tickets || [];
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: order.customerEmail,
    subject: `Your Tickets - ${order.prom.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7C5CFF; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .ticket { background: white; padding: 15px; margin: 15px 0; border: 2px solid #7C5CFF; border-radius: 8px; }
          .qr-code { text-align: center; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pulse Productions</h1>
            <h2>Your Tickets Are Ready!</h2>
          </div>
          <div class="content">
            <p>Dear ${order.customerName},</p>
            <p>Your payment has been verified! Here are your digital tickets for <strong>${order.prom.name}</strong>.</p>
            
            <p><strong>Order Reference:</strong> ${order.referenceCode}</p>
            <p><strong>Event Date:</strong> ${new Date(order.prom.date).toLocaleDateString()}</p>
            <p><strong>Venue:</strong> ${order.prom.venue}</p>
            
            <h3>Your Tickets (${tickets.length})</h3>
            ${tickets.map((ticket, index) => `
              <div class="ticket">
                <h4>Ticket ${index + 1} - ${ticket.ticketType}</h4>
                <div class="qr-code">
                  <img src="${ticket.qrCodeImage || ''}" alt="QR Code" style="max-width: 200px;" />
                </div>
                <p><small>Present this QR code at the venue for entry.</small></p>
              </div>
            `).join('')}
            
            <p><strong>Important:</strong> Please save these tickets and bring them (digital or printed) to the event.</p>
          </div>
          <div class="footer">
            <p>Pulse Productions - Prom Booking System</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Tickets email sent to ${order.customerEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}


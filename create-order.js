const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });
}

function buildOrderTable(items) {
  const rows = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:center;">x${i.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:right;">$${i.lineTotal}</td>
    </tr>`).join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      <thead>
        <tr style="background:#1c1208;color:#f5f0e8;">
          <th style="padding:10px 12px;text-align:left;">Item</th>
          <th style="padding:10px 12px;text-align:center;">Qty</th>
          <th style="padding:10px 12px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildRestaurantEmail(customer, items, orderTotal, paymentIntentId) {
  return {
    from: `"Sweet Rise & Co. Orders" <${process.env.GMAIL_USER}>`,
    to: process.env.RESTAURANT_EMAIL,
    subject: `🆕 New Order from ${customer.name} — $${orderTotal}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f6f0;border:1px solid #e8dfc8;border-radius:8px;overflow:hidden;">
        <div style="background:#1c1208;padding:20px 24px;">
          <h1 style="color:#d4af7a;font-size:20px;margin:0;">🆕 NEW ORDER RECEIVED</h1>
          <p style="color:#a89070;font-size:12px;margin:6px 0 0;">Sweet Rise & Co. Online Ordering</p>
        </div>
        <div style="padding:24px;">
          <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e8dfc8;">
            <h2 style="color:#8a6c3a;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Customer Details</h2>
            <p style="margin:4px 0;"><strong>Name:</strong> ${customer.name}</p>
            <p style="margin:4px 0;"><strong>Phone:</strong> <a href="tel:${customer.phone}">${customer.phone}</a></p>
            <p style="margin:4px 0;"><strong>Email:</strong> ${customer.email}</p>
            <p style="margin:4px 0;"><strong>Delivery Address:</strong> ${customer.address}</p>
            ${customer.notes ? `<p style="margin:8px 0 0;padding:8px;background:#fef9f0;border-left:3px solid #b8955a;"><strong>Notes:</strong> ${customer.notes}</p>` : ''}
          </div>
          <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e8dfc8;">
            <h2 style="color:#8a6c3a;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Order Items</h2>
            ${buildOrderTable(items)}
            <div style="text-align:right;padding:12px 12px 0;border-top:2px solid #1c1208;margin-top:8px;">
              <strong style="font-size:18px;color:#1c1208;">Total: $${orderTotal}</strong>
            </div>
          </div>
          <div style="background:#eafaf1;border:1px solid #a8dfc0;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
            <p style="color:#2e7d50;margin:0;font-size:13px;">✅ <strong>Payment Confirmed</strong> — Stripe ID: ${paymentIntentId}</p>
          </div>
          <p style="color:#7a6645;font-size:12px;text-align:center;margin:0;">
            Call <strong>${customer.phone}</strong> to confirm delivery time (Thu or Fri, 10am–7pm)
          </p>
        </div>
      </div>`,
  };
}

function buildCustomerEmail(customer, items, orderTotal) {
  return {
    from: `"Sweet Rise & Co." <${process.env.GMAIL_USER}>`,
    to: customer.email,
    subject: `✅ Your Order is Confirmed — Sweet Rise & Co.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f6f0;border:1px solid #e8dfc8;border-radius:8px;overflow:hidden;">
        <div style="background:#1c1208;padding:20px 24px;text-align:center;">
          <h1 style="color:#d4af7a;font-size:22px;margin:0;letter-spacing:2px;">Sweet Rise & Co.</h1>
          <p style="color:#a89070;font-size:12px;margin:4px 0 0;font-style:italic;">Mediterranean & Persian Cuisine</p>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#1c1208;font-size:18px;margin:0 0 8px;">Thanks, ${customer.name}! 🎉</h2>
          <p style="color:#7a6645;font-size:14px;margin:0 0 20px;">Your order is confirmed and payment received. We'll call you to schedule delivery!</p>
          <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e8dfc8;">
            <h3 style="color:#8a6c3a;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Your Order</h3>
            ${buildOrderTable(items)}
            <div style="text-align:right;padding:12px 12px 0;border-top:2px solid #1c1208;margin-top:8px;">
              <strong style="font-size:18px;color:#1c1208;">Total Paid: $${orderTotal}</strong>
            </div>
          </div>
          <div style="background:#fef9f0;border:1px solid #e8dfc8;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:4px 0;font-size:13px;">📍 <strong>Delivery Address:</strong> ${customer.address}</p>
            <p style="margin:4px 0;font-size:13px;">🚗 <strong>Delivery:</strong> Thursday & Friday, 10am–7pm</p>
            <p style="margin:8px 0 0;font-size:13px;color:#7a6645;">We'll call <strong>${customer.phone}</strong> to confirm your exact time.</p>
          </div>
          <p style="color:#b8955a;font-size:12px;text-align:center;font-style:italic;">✦ Every dish crafted with warmth, tradition, and love. ✦</p>
        </div>
      </div>`,
  };
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let paymentIntent = null;

  try {
    const { paymentMethodId, amount, customer, items, orderTotal } = JSON.parse(event.body);

    if (!paymentMethodId || !amount || !customer || !items) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }
    if (!customer.name || !customer.phone || !customer.email || !customer.address) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'All customer fields are required' }) };
    }

    // ── Charge card ──
    paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        customer_name: customer.name,
        customer_phone: customer.phone,
        delivery_address: customer.address,
      },
      description: `Sweet Rise & Co. order for ${customer.name}`,
      receipt_email: customer.email,
    });

    if (paymentIntent.status !== 'succeeded') {
      return { statusCode: 402, headers, body: JSON.stringify({ error: 'Payment not completed. Please try again.' }) };
    }

    // ── Send emails — wrapped in try/catch so email failure never blocks payment success ──
    try {
      const transporter = createTransporter();
      await Promise.all([
        transporter.sendMail(buildRestaurantEmail(customer, items, orderTotal, paymentIntent.id)),
        transporter.sendMail(buildCustomerEmail(customer, items, orderTotal)),
      ]);
    } catch (emailErr) {
      // Log email error but don't fail the order — payment already succeeded
      console.error('Email send failed (payment still succeeded):', emailErr.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, paymentIntentId: paymentIntent.id }),
    };

  } catch (err) {
    console.error('Order error:', err);
    const message = err.type && err.type.startsWith('Stripe')
      ? err.message
      : 'Something went wrong. Please call us at 928-242-8069.';
    return { statusCode: 500, headers, body: JSON.stringify({ error: message }) };
  }
};

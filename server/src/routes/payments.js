import { Router } from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function client() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay test credentials are not configured');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Create a Razorpay payment order
router.post(
  '/razorpay/order',
  auth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      _id: req.body.orderId,
      customer: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    try {
      const razorpayOrder = await client().orders.create({
        amount: Math.round(order.total * 100),
        currency: 'INR',
        receipt: String(order._id)
      });

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      res.json({
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrder,
        amount: order.total
      });
    } catch (error) {
      res.status(503).json({
        message: 'Could not create Razorpay payment order'
      });
    }
  })
);

// Verify successful payment
router.post(
  '/razorpay/verify',
  auth,
  asyncHandler(async (req, res) => {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    });

    if (!order || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Payment order mismatch' });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({ message: 'Payment already verified', order });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(razorpay_signature || '');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = 'paid';
    await order.save();

    res.json({ message: 'Payment signature verified', order });
  })
);

// Record a payment failure reported by the authenticated checkout
router.post(
  '/razorpay/failure',
  auth,
  asyncHandler(async (req, res) => {
    const { orderId, razorpay_order_id, razorpay_payment_id } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    });

    if (!order || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Payment order mismatch' });
    }

    // Never downgrade a successful payment.
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    if (razorpay_payment_id) {
      order.razorpayPaymentId = razorpay_payment_id;
    }

    order.paymentStatus = 'failed';
    await order.save();

    res.json({ message: 'Payment failure recorded', order });
  })
);

export default router;
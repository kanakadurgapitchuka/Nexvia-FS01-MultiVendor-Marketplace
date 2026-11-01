
import { Router } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import { auth, allow } from '../middleware/auth.js';
import { readCart, clearCart } from '../services/cart.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// CUSTOMER: Checkout and create order
router.post('/checkout', auth, asyncHandler(async (req, res) => {
  const cart = await readCart(req.user.id);

  if (!cart?.length) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const ids = cart.map(i => i.productId);

  const products = await Product.find({
    _id: { $in: ids },
    active: true
  });

  if (products.length !== cart.length) {
    return res.status(400).json({ message: 'Some products are unavailable' });
  }

  let subtotal = 0;

  const commissionRate = Math.min(
    30,
    Math.max(0, +(process.env.PLATFORM_COMMISSION_PERCENT || 10))
  ) / 100;

  const items = [];

  for (const ci of cart) {
    const p = products.find(
      p => String(p._id) === ci.productId
    );

    if (!p || ci.quantity > p.stock) {
      return res.status(400).json({
        message: `Insufficient stock for ${p?.name || 'product'}`
      });
    }

    const lineTotal = Number((p.price * ci.quantity).toFixed(2));
    const commission = Number((lineTotal * commissionRate).toFixed(2));

    subtotal += lineTotal;

    items.push({
      product: p._id,
      vendor: p.vendor,
      name: p.name,
      quantity: ci.quantity,
      unitPrice: p.price,
      lineTotal,
      commission,
      vendorAmount: Number((lineTotal - commission).toFixed(2))
    });
  }

  let discount = 0;
  let couponCode = '';

  if (req.body.couponCode) {
    const coupon = await Coupon.findOne({
      code: req.body.couponCode.toUpperCase(),
      active: true
    });

    if (
      !coupon ||
      (coupon.expiresAt && coupon.expiresAt < new Date()) ||
      coupon.usedCount >= coupon.usageLimit ||
      subtotal < coupon.minSubtotal
    ) {
      return res.status(400).json({
        message: 'Coupon is invalid or not applicable'
      });
    }

    discount = coupon.type === 'percent'
      ? subtotal * coupon.value / 100
      : coupon.value;

    if (coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    discount = Math.min(subtotal, Number(discount.toFixed(2)));

    coupon.usedCount++;
    await coupon.save();

    couponCode = coupon.code;
  }

  const order = await Order.create({
    customer: req.user._id,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    discount,
    total: Number((subtotal - discount).toFixed(2)),
    couponCode,
    shippingAddress: req.body.shippingAddress || {}
  });

  for (const ci of cart) {
    const p = products.find(
      p => String(p._id) === ci.productId
    );

    p.stock -= ci.quantity;
    await p.save();
  }

  await clearCart(req.user.id);

  res.status(201).json({ order });
}));

// CUSTOMER: Get own orders
router.get('/my', auth, asyncHandler(async (req, res) => {
  const orders = await Order.find({
    customer: req.user._id
  }).sort({ createdAt: -1 });

  res.json({ orders });
}));

// VENDOR: Get orders containing this vendor's products
router.get('/vendor', auth, allow('vendor'), asyncHandler(async (req, res) => {
  const orders = await Order.find({
    'items.vendor': req.user._id
  }).sort({ createdAt: -1 });

  const vendorOrders = orders.map(order => {
    const orderData = order.toObject();

    orderData.items = orderData.items.filter(
      item => String(item.vendor) === String(req.user._id)
    );

    return orderData;
  });

  res.json({ orders: vendorOrders });
}));
// ADMIN: Get all orders
router.get('/admin', auth, allow('admin'), asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json({ orders });
}));

// CUSTOMER / VENDOR / ADMIN: Get one order
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (
    req.user.role !== 'admin' &&
    !order.customer.equals(req.user._id) &&
    !order.items.some(i => i.vendor.equals(req.user._id))
  ) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  res.json({ order });
}));

// VENDOR / ADMIN: Update order status
router.patch('/:id/status', auth, allow('vendor', 'admin'), asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const { status } = req.body;

  if (!['packed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  if (
    req.user.role === 'vendor' &&
    !order.items.some(i => i.vendor.equals(req.user._id))
  ) {
    return res.status(403).json({
      message: 'This order has no items from your store'
    });
  }

  const allowed = {
    placed: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };

  if (!allowed[order.status]?.includes(status)) {
    return res.status(400).json({
      message: `Cannot change ${order.status} to ${status}`
    });
  }

  if (status === 'delivered' && order.paymentStatus !== 'paid') {
    return res.status(400).json({
      message: 'Only paid orders can be delivered'
    });
  }

  order.status = status;
  await order.save();

  res.json({ order });
}));

export default router;

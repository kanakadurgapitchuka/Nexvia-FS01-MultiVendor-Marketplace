
import { Router } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/', auth, asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment = '' } = req.body;

  const validOrderId = String(orderId || '')
    .trim()
    .replace(/^Order\s*#/i, '');

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  if (!mongoose.isValidObjectId(validOrderId)) {
    return res.status(400).json({
      message: 'Please enter a valid Order ID (24 characters).'
    });
  }

  if (!Number.isInteger(+rating) || +rating < 1 || +rating > 5) {
    return res.status(400).json({ message: 'Rating must be 1–5' });
  }

  const order = await Order.findOne({
    _id: validOrderId,
    customer: req.user._id,
    status: 'delivered',
    paymentStatus: 'paid',
    'items.product': productId
  });

  if (!order) {
    return res.status(403).json({
      message: 'Review requires a delivered, paid purchase'
    });
  }

  const review = await Review.create({
    product: productId,
    customer: req.user._id,
    order: validOrderId,
    rating: +rating,
    comment
  });

  const stats = await Review.aggregate([
    { $match: { product: review.product } },
    {
      $group: {
        _id: null,
        avg: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats[0]?.avg || 0,
    reviewCount: stats[0]?.count || 0
  });

  res.status(201).json({ review });
}));

export default router;

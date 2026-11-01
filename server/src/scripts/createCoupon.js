
import 'dotenv/config';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';

async function createCoupon() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const coupon = await Coupon.findOneAndUpdate(
      { code: 'NEXVIA10' },
      {
        code: 'NEXVIA10',
        type: 'percent',
        value: 10,
        minSubtotal: 0,
        maxDiscount: 100,
        active: true,
        usageLimit: 100,
        usedCount: 0
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('Coupon created successfully:', coupon);
  } catch (error) {
    console.error('Coupon creation failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createCoupon();

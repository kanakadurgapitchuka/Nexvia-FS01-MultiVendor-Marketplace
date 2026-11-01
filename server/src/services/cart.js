
import Cart from '../models/Cart.js';
import { getRedis } from '../config/redis.js';

const CACHE_TTL = 3600;

function cartKey(userId) {
  return `cart:${userId}`;
}

export async function readCart(userId) {
  const redis = getRedis();

  if (redis) {
    try {
      const cached = await redis.get(cartKey(userId));
      if (cached !== null) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis read skipped:', error.message);
    }
  }

  const cart = await Cart.findOne({ user: userId }).lean();
  const items = cart ? cart.items : [];

  if (redis) {
    try {
      await redis.set(
        cartKey(userId),
        JSON.stringify(items),
        'EX',
        CACHE_TTL
      );
    } catch (error) {
      console.warn('Redis cache skipped:', error.message);
    }
  }

  return items;
}

export async function writeCart(userId, items) {
  await Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const redis = getRedis();

  if (redis) {
    try {
      await redis.set(
        cartKey(userId),
        JSON.stringify(items),
        'EX',
        CACHE_TTL
      );
    } catch (error) {
      console.warn('Redis write skipped:', error.message);
    }
  }
}

export async function clearCart(userId) {
  await Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const redis = getRedis();

  if (redis) {
    try {
      await redis.del(cartKey(userId));
    } catch (error) {
      console.warn('Redis clear skipped:', error.message);
    }
  }
}

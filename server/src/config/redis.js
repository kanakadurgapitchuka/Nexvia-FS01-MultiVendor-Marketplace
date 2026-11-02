
import Redis from 'ioredis';

let redis;

export function getRedis() {
  if (!redis && process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 10000,
      retryStrategy(times) {
        return times > 3 ? null : 2000;
      }
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('Redis ready');
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error.message);
    });

    redis.connect().catch((error) => {
      console.error('Redis initial connection failed:', error.message);
    });
  }

  return redis;
}

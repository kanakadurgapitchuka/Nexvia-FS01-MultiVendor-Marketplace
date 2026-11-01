import Redis from 'ioredis';
let redis;
export function getRedis(){
  if(!redis && process.env.REDIS_URL){
    redis = new Redis(process.env.REDIS_URL,{lazyConnect:true,maxRetriesPerRequest:1});
    redis.on('error',()=>{});
    redis.connect().catch(()=>{});
  }
  return redis;
}

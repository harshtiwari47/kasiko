import {
  createClient
} from 'redis';

import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient( {
  url: process.env.REDIS_URI,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to external Redis');
  } catch (err) {
    console.error('Could not connect to Redis:', err);
  }
})();

export default redisClient
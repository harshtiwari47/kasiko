import {
  createClient
} from 'redis';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: 'info', // Minimum log level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({
      timestamp, level, message
    }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Environment Variable Validation
const redisUri = process.env.REDIS_URI;

if (!redisUri) {
  logger.error('❌ REDIS_URI is not defined in the environment variables.');
  process.exit(1); // Exit the process if REDIS_URI is missing
}

// Create Redis client with enhanced configuration
const redisClient = createClient( {
  url: redisUri,
  socket: {
    keepAlive: true,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('❌ Redis reconnection attempts exceeded.');
        return new Error('Retry attempts exhausted');
      }
      // Exponential backoff: 100ms, 200ms, ..., up to 3000ms
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`🔄 Redis client reconnecting in ${delay}ms...`);
      return delay;
    },
    // Optional: Enable TLS if connecting to a secured Redis instance
    tls: {
      rejectUnauthorized: false
    }
  },
  // Optional: Add password if your Redis instance requires authentication
  // password: process.env.REDIS_PASSWORD,
});

// Comprehensive Event Handling
redisClient.on('error', (err) => logger.error(`❌ Redis Client Error: ${err}`));
redisClient.on('connect', () => logger.info('🔗 Redis client is connecting...'));
redisClient.on('ready', () => logger.info('✅ Redis client connected and ready.'));
redisClient.on('reconnecting', (delay) => logger.warn(`🔄 Redis client reconnecting in ${delay}ms...`));
redisClient.on('end', () => logger.info('🔌 Redis client disconnected.'));

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('✅ Connected to Redis.');
  } catch (err) {
    logger.error(`❌ Could not connect to Redis: ${err}`);
    process.exit(1); // Exit the process if Redis connection fails
  }
};

// Immediately invoke the connection function
connectRedis();

// Graceful Shutdown Handling
const shutdown = async () => {
  try {
    await redisClient.quit();
    logger.info('🛑 Redis client disconnected gracefully.');
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Error during Redis shutdown: ${err}`);
    process.exit(1);
  }
};

// Listen for termination signals to gracefully shutdown Redis client
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Export the Redis client as default
export default redisClient;
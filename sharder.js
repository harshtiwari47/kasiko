import {
  ClusterManager
} from 'discord-hybrid-sharding';
import dotenv from 'dotenv';
dotenv.config();

// Validate the BOT_TOKEN is set
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN not found in environment variables.");
  process.exit(1);
}

const totalShards = process.env.SHARDS || 'auto';
const totalClusters = process.env.CLUSTERS || 'auto';

console.log(`[Sharder] Starting Cluster Manager with:`);
console.log(` - Total Shards: ${totalShards}`);
console.log(` - Total Clusters: ${totalClusters}`);

// Create the Cluster Manager instance
const manager = new ClusterManager('./bot.js', {
  token,
  totalShards,
  totalClusters,
  respawn: true, // Automatically respawn clusters on crash
});

// Log when a cluster is launched and monitor cluster messages
manager.on('clusterCreate', cluster => {
  // Use cluster.shardList which is an array of shard IDs for this cluster.
  console.log(`[Cluster ${cluster.id}] Launched with shard(s): ${cluster.shardList.join(', ')}`);

  cluster.on('message', message => {
    if (message && message.type === 'error') {
      console.error(`[Cluster ${cluster.id}] Error: ${message.error}`);
    }
  });
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('[Sharder] Shutdown signal received. Exiting process...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Spawn clusters and log status
manager.spawn()
.then(() => {
  console.log('[Sharder] All clusters spawned successfully.');
})
.catch(err => {
  console.error('[Sharder] Error spawning clusters:',
    err);
  process.exit(1);
});
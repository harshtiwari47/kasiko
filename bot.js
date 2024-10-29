import {
  Client,
  GatewayIntentBits
} from 'discord.js';
import dotenv from 'dotenv';

import ping from './commands/ping.js';
import textCommands from './commands/textCommandHandler.js';

import {
  createUser,
  userExists
} from './database.js';

dotenv.config();

const client = new Client( {
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.BOT_TOKEN;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  
  //return if author is bot
  if (message.author.bot) return;
  
  console.log(message);

  // check user exist
  if (!userExists(message.author.id)) {
    createUser(message.author.id)
  }

  if (message.content.toLowerCase().trim() === 'kas !ping') {
    ping(message);
  }
  
  // handle all types of text commands started with kas
  await textCommands(message);
  
});

client.login(TOKEN);
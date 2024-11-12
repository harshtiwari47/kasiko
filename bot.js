import {
  Client,
  GatewayIntentBits
} from 'discord.js';
import dotenv from 'dotenv';

import {
  updateExpPoints
} from './utils/experience.js';
import txtcommands from './src/textCommandHandler.js';

import {
  createUser,
  userExists
} from './database.js';

dotenv.config();

export const client = new Client( {
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.BOT_TOKEN;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  try {
    //return if author is bot
    if (message.author.bot) return;

    const mentionedBots = message.mentions.users.filter(user => user.bot);

    let prefix = "kas";


    if (!message.content.toLowerCase().startsWith(prefix)) return

    if (mentionedBots.size > 0) return

    // check user exist
    if (message.content.startsWith(prefix) && !userExists(message.author.id)) {
      createUser(message.author.id)
    }

    updateExpPoints(message.content.toLowerCase(), message.author, message.channel);

    // handle all types of text commands started with kas
    const args = message.content.slice(prefix.toLowerCase().length).trim().split(/ +/);
    const commandName = args[0].toLowerCase();
    const command = txtcommands.get(commandName);

    if (!command) return;

    try {
      command.execute(args, message);
    } catch (error) {
      console.error(error);
      message.reply("There was an error executing that command.");
    }
  } catch (e) {
    console.error(e);
  }
});

client.login(TOKEN);
import {
  Client,
  GatewayIntentBits,
  InteractionType
} from 'discord.js';
import dotenv from 'dotenv';

import express from 'express';

import {
  updateExpPoints
} from './utils/experience.js';
import {
  termsAndcondition
} from './utils/terms.js';
import WelcomeMsg from './utils/welcome.js';

import txtcommands from './src/textCommandHandler.js';
import {
  loadSlashCommands,
  handleSlashCommand
} from './src/slashCommandHandler.js';

import {
  createUser,
  userExists,
  userAcceptedTerms
} from './database.js';

dotenv.config();

// Bind to port
const app = express();
// Simulate port binding
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Discord bot is running!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
// port bind ends

export const client = new Client( {
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.BOT_TOKEN;
const clientId = process.env.APP_ID;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await loadSlashCommands('./src/slashcommands', clientId, TOKEN);
});

client.on('messageCreate', async (message) => {
  try {
    //return if author is bot
    if (message.author.bot) return;

    const mentionedBots = message.mentions.users.filter(user => user.bot);

    let prefix = "kas";

    if (!message.content.toLowerCase().startsWith(prefix)) return
    
    if (mentionedBots.size > 0) return
     
    let ps = performance.now();
    // check user exist
    let userExistence = await userExists(message.author.id);
    if (!userExistence) {
      return termsAndcondition(message);
    }

    updateExpPoints(message.content.toLowerCase(), message.author, message.channel);
    
    let pe = performance.now();
    
    console.log(pe-ps + "overall")
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

client.on('interactionCreate', async (interaction) => {
  try {
    await handleSlashCommand(interaction); // Handle slash command interactions
  } catch (e) {
    console.error(e);
  }
});

client.on('guildCreate', WelcomeMsg.execute);

client.login(TOKEN);
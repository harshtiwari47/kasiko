import {
  Client,
  GatewayIntentBits,
  InteractionType
} from 'discord.js';
import dotenv from 'dotenv';

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

    // check user exist
    let userExistence = await userExists(message.author.id);
    if (!userExistence) {
     return termsAndcondition(message);
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

client.on('interactionCreate', async (interaction) => {
  if (interaction.type === InteractionType.MessageComponent) {
    if (interaction.customId === 'accept_terms') {
      // Handle the button click (User accepted terms)
      let userAgreementState = await userAcceptedTerms(interaction.user.id);

      if (!userAgreementState) {
        await createUser(interaction.user.id).then(async () => {
          await interaction.reply({
            content: 'Thank you for accepting the Terms and Conditions!',
            ephemeral: true
          });
        }).catch(async (err) => {
          console.error(err);
          await interaction.reply({
            content: 'Something went wrong while accepting the Terms and Conditions!',
            ephemeral: true
          });
        })
      }
    }
  }
  await handleSlashCommand(interaction); // Handle slash command interactions
});

client.on('guildCreate', WelcomeMsg.execute);

client.login(TOKEN);
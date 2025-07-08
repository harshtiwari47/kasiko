import {
   getUserData,
   updateUser
} from '../../../database.js';
import {
   AttachmentBuilder,
   EmbedBuilder,
   ContainerBuilder,
   MessageFlags
} from 'discord.js';
import {
   discordUser
} from '../../../helper.js';

export async function crime(id, channel, user) {
   try {
      const userData = await getUserData(id);
      if (!userData || !user) {
         return "Oops! Something went wrong while planning your caper 🚨!";
      }

      const outcome = Math.floor(Math.random() * 45) + 1;
      let crimeMessage = "";
      let earnedCash = 0;
      let penalty = 0;

      // Big Success outcomes (Cases 1-4): 20-30% chance total
      if (outcome >= 1 && outcome <= 21) {
         earnedCash = Math.floor(Math.random() * 5000) + 5000; // 5000 to 10000 cash
         userData.cash += earnedCash;
         await updateUser(id, {
            cash: userData.cash
         });
         switch (outcome) {
            case 1:
               crimeMessage =
                  "💰 **{username}**, you executed a flawless bank heist under cover of darkness—vaults emptied and guards none the wiser!\n" +
                  "<:reply:1368224908307468408> You bagged <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 2:
               crimeMessage =
                  "🚁 **{username}**, you pulled off the ultimate helicopter jewel theft from a moving convoy—riches beyond imagination!\n" +
                  "<:reply:1368224908307468408> You secured <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 3:
               crimeMessage =
                  "🎲 **{username}**, you high-rolled your way through the city’s underground gambling ring—fortune favored you tonight!\n" +
                  "<:reply:1368224908307468408> You scored <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 4:
               crimeMessage =
                  "🏦 **{username}**, you slipped past state-of-the-art security to crack open that high-security vault—bags of cash are yours!\n" +
                  "<:reply:1368224908307468408> You looted <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 5:
               crimeMessage =
                  "💻 **{username}**, you hacked the Federal Reserve’s mainframe and siphoned off a king’s ransom in digital credits!\n" +
                  "<:reply:1368224908307468408> You transferred <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 6:
               crimeMessage =
                  "🚚 **{username}**, you ambushed an armored-truck convoy on the highway—heavy loot and no witnesses in sight!\n" +
                  "<:reply:1368224908307468408> You seized <:kasiko_coin:1300141236841086977>**{cash}**";
               break;

            case 7:
               crimeMessage =
                  "🛰️ **{username}**, you hijacked a private satellite feed and rented the bandwidth to crypto miners across the globe!\n" +
                  "<:reply:1368224908307468408> You netted <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 8:
               crimeMessage =
                  "🛸 **{username}**, you “salvaged” tech from a mysterious UFO crash site before the government showed up—eBay went wild!\n" +
                  "<:reply:1368224908307468408> You pocketed <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 9:
               crimeMessage =
                  "🍔 **{username}**, you hacked every drone-delivery route in town and rerouted the gourmet burgers to your secret lair!\n" +
                  "<:reply:1368224908307468408> You stuffed <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 10:
               crimeMessage =
                  "📱 **{username}**, you pushed a fake phone update that siphoned micro-payments one tap at a time—nobody noticed a cent!\n" +
                  "<:reply:1368224908307468408> You skimmed <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 11:
               crimeMessage =
                  "🚀 **{username}**, you stowed away on a sub-orbital tourist rocket and relieved the VIPs of their zero-G wallets!\n" +
                  "<:reply:1368224908307468408> You nabbed <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 12:
               crimeMessage =
                  "🐒 **{username}**, you pinched the rarest Bored Ape NFT, flipped it fast, and left the blockchain buzzing!\n" +
                  "<:reply:1368224908307468408> You flipped <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 13:
               crimeMessage =
                  "🔋 **{username}**, you tapped the world’s fastest EV-charger network and resold the juice at peak surge pricing!\n" +
                  "<:reply:1368224908307468408> You banked <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 14:
               crimeMessage =
                  "🤖 **{username}**, you jail-broke an elite AI model and auctioned its unfiltered secrets on the dark web!\n" +
                  "<:reply:1368224908307468408> You raked in <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 15:
               crimeMessage =
                  "🎥 **{username}**, you deep-faked a blockbuster teaser, monetized the hype, and vanished before the studio woke up!\n" +
                  "<:reply:1368224908307468408> You cashed <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 16:
               crimeMessage =
                  "🪙 **{username}**, you rerouted an entire volcanic Bitcoin farm overnight—geothermal riches are now yours!\n" +
                  "<:reply:1368224908307468408> You mined <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 17:
               crimeMessage =
                  "🏝️ **{username}**, you infiltrated a billionaire’s private island and liberated the hidden vault of emergency gold!\n" +
                  "<:reply:1368224908307468408> You hauled <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 18:
               crimeMessage =
                  "🏰 **{username}**, you scaled the walls of a royal treasury during the coronation fireworks—talk about timing!\n" +
                  "<:reply:1368224908307468408> You absconded with <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 19:
               crimeMessage =
                  "🕸️ **{username}**, you locked every smart fridge on the planet behind a ‘defrost fee’ and the world paid up—chilling!\n" +
                  "<:reply:1368224908307468408> You stockpiled <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 20:
               crimeMessage =
                  "🛒 **{username}**, you exploited a self-checkout glitch at Megamart—beep, bag, boom: free fortune!\n" +
                  "<:reply:1368224908307468408> You stacked <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 21:
               crimeMessage =
                  "🦄 **{username}**, you front-ran a meme-stock surge and bounced right before regulators blinked—diamond hands, who?\n" +
                  "<:reply:1368224908307468408> You cleaned up <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
         }

         // Moderate Success outcomes (Cases 5-12): 40% chance total
      } else if (outcome >= 22 && outcome <= 31) {
         earnedCash = Math.floor(Math.random() * 2500) + 2500; // 2500 to 5000 cash
         userData.cash += earnedCash;
         await updateUser(id, {
            cash: userData.cash
         });
         switch (outcome) {
            case 22:
               crimeMessage =
                  "🕶️ **{username}**, you slipped through the crowd at the plaza and pickpocketed a tourist too busy taking selfies.\n" +
                  "<:reply:1368224908307468408> You snatched <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 23:
               crimeMessage =
                  "💻 **{username}**, you breached a mom-and-pop online store’s security and quietly drained their digital drawer.\n" +
                  "<:reply:1368224908307468408> You siphoned <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 24:
               crimeMessage =
                  "🚗 **{username}**, you hotwired a luxury car in broad daylight, then flipped it for quick cash on the black market.\n" +
                  "<:reply:1368224908307468408> You flipped it for <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 25:
               crimeMessage =
                  "🏪 **{username}**, you broke into a trendy boutique after hours—designer bags and cash drawers were no match.\n" +
                  "<:reply:1368224908307468408> You walked out with <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 26:
               crimeMessage =
                  "📱 **{username}**, your phishing email convinced dozens to 'verify their account'—classic and effective.\n" +
                  "<:reply:1368224908307468408> You pocketed <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 27:
               crimeMessage =
                  "🎭 **{username}**, you posed as a fake CEO, tricked investors, and ghosted with the funds before sunrise.\n" +
                  "<:reply:1368224908307468408> You earned <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 28:
               crimeMessage =
                  "🔓 **{username}**, you brute-forced access to an unguarded crypto wallet and quietly made the transfer.\n" +
                  "<:reply:1368224908307468408> You cracked <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 29:
               crimeMessage =
                  "📦 **{username}**, you intercepted a premium package delivery, swapped the label, and made off like a pro.\n" +
                  "<:reply:1368224908307468408> You grabbed <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 30:
               crimeMessage =
                  "⛽ **{username}**, you installed a skimmer at a local gas pump and raked in card details like it was a clearance sale.\n" +
                  "<:reply:1368224908307468408> You skimmed <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
            case 31:
               crimeMessage =
                  "✉️ **{username}**, you slipped into the post office and rerouted a suspiciously heavy envelope to your drop spot.\n" +
                  "<:reply:1368224908307468408> You rerouted <:kasiko_coin:1300141236841086977>**{cash}**";
               break;
         }

         // Failure outcomes (Cases 13-20): 40% chance total
      } else if (outcome >= 32 && outcome <= 46) {
         penalty = Math.floor(Math.random() * 2500) + 2500; // 2500 to 5000 cash fine
         if (userData.cash >= penalty) {
            userData.cash -= penalty;
         } else {
            userData.cash = 0;
         }
         await updateUser(id, {
            cash: userData.cash
         });

         switch (outcome) {
            case 32:
               crimeMessage =
                  "🚓 **{username}**, your getaway driver bailed mid-job—and so did your luck.\n" +
                  "<:reply:1368224908307468408> You were fined <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 33:
               crimeMessage =
                  "📸 **{username}**, you smiled for the security cam like it was a selfie. Nice evidence!\n" +
                  "<:reply:1368224908307468408> You lost <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 34:
               crimeMessage =
                  "🧃 **{username}**, you spilled juice on your fake ID mid-heist. That didn’t end well.\n" +
                  "<:reply:1368224908307468408> You paid <:kasiko_coin:1300141236841086977>**{penalty}** in damages";
               break;
            case 35:
               crimeMessage =
                  "🕵️ **{username}**, an undercover janitor turned out to be a cop. Oops.\n" +
                  "<:reply:1368224908307468408> You were penalized <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 36:
               crimeMessage =
                  "🎣 **{username}**, you tried a phishing scam but emailed the actual FBI.\n" +
                  "<:reply:1368224908307468408> You lost <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 37:
               crimeMessage =
                  "🧯 **{username}**, your smoke bomb backfired and filled *your* getaway car.\n" +
                  "<:reply:1368224908307468408> You coughed up <:kasiko_coin:1300141236841086977>**{penalty}** in fines";
               break;
            case 38:
               crimeMessage =
                  "🐦 **{username}**, you bragged about your plan on X. Authorities replied.\n" +
                  "<:reply:1368224908307468408> You lost <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 39:
               crimeMessage =
                  "🧠 **{username}**, you used ChatGPT to plan the crime—and it told the cops first. Classic.\n" +
                  "<:reply:1368224908307468408> You paid <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 40:
               crimeMessage =
                  "⛓️ **{username}**, you walked into the wrong building—turns out it was a police station.\n" +
                  "<:reply:1368224908307468408> You lost <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 41:
               crimeMessage =
                  "🗣️ **{username}**, your partner couldn’t stop live-tweeting the operation.\n" +
                  "<:reply:1368224908307468408> You were fined <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 42:
               crimeMessage =
                  "🧊 **{username}**, you slipped on a wet floor during the heist and faceplanted into justice.\n" +
                  "<:reply:1368224908307468408> You lost <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 43:
               crimeMessage =
                  "🎬 **{username}**, your whole attempt was filmed—and went viral as 'Crime Fails Vol. 9'.\n" +
                  "<:reply:1368224908307468408> You were embarrassed *and* fined <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 44:
               crimeMessage =
                  "📦 **{username}**, you accidentally robbed a fake storefront made for sting operations.\n" +
                  "<:reply:1368224908307468408> You paid <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 45:
               crimeMessage =
                  "🍕 **{username}**, you left your receipt with full name and address at the scene. Smooth.\n" +
                  "<:reply:1368224908307468408> You were fined <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            case 46:
               crimeMessage =
                  "🤡 **{username}**, you wore a clown mask to be sneaky—but forgot to take off your name tag.\n" +
                  "<:reply:1368224908307468408> You lost <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
            default:
               crimeMessage =
                  "🤡 **{username}**, you wore a clown mask to be sneaky—but forgot to take off your name tag.\n" +
                  "<:reply:1368224908307468408> You lost <:kasiko_coin:1300141236841086977>**{penalty}**";
               break;
         }
      }

      const userDetails = discordUser(user);

      return crimeMessage.replace("{username}", userDetails?.name?.toUpperCase()).replace("{cash}", earnedCash ? earnedCash.toLocaleString() : "").replace("{penalty}", penalty ? penalty.toLocaleString() : "");
   } catch (e) {
      console.error(e);
      return "Oops! Something went wrong during your risky criminal endeavor 🚨!";
   }
}

export default {
   name: "crime",
   description: "Attempt a daring crime with 20 possible outcomes—will you score big or get caught?",
   aliases: ["cr"],
   args: "",
   example: ["cr"],
   emoji: "🚨",
   cooldown: 10000,
   category: "🏦 Economy",
   execute: async (args, message) => {
      let crimeReply = await crime(message.author.id, message.channel, message.author);

      const Container = new ContainerBuilder()
         .setAccentColor(Math.floor(Math.random() * 16777216))
         .addSectionComponents(
            section => section
            .addTextDisplayComponents(
               textDisplay => textDisplay.setContent(`-# <:user:1385131666011590709> ${message.author.username}`),
               textDisplay => textDisplay.setContent(`### 𝗖𝗥𝗜𝗠𝗘`),
            )
            .setThumbnailAccessory(
               thumbnail => thumbnail
               .setDescription('Crime')
               .setURL("https://harshtiwari47.github.io/kasiko-public/images/crime.png")
            )
         )
         .addSeparatorComponents(separate => separate)
         .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(crimeReply)
         )

      await message.reply({
            components: [Container],
            flags: MessageFlags.IsComponentsV2
         })
         .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      return;
   },

   // Slash command interaction handler
   interact: async (interaction) => {
      
      if (!interaction.deferred) {
         await interaction.deferReply({
            ephemeral: false
         });
      }

      try {
         const userId = interaction.user.id;
         const user = interaction.user;
         const channel = interaction.channel;

         const crimeReply = await crime(userId, channel, user);

         const Container = new ContainerBuilder()
            .setAccentColor(Math.floor(Math.random() * 16777216))
            .addSectionComponents(
               section => section
               .addTextDisplayComponents(
                  textDisplay => textDisplay.setContent(`-# <:user:1385131666011590709> ${interaction.user.username}`),
                  textDisplay => textDisplay.setContent(`### 𝗖𝗥𝗜𝗠𝗘`)
               )
               .setThumbnailAccessory(
                  thumbnail => thumbnail
                  .setDescription('Crime')
                  .setURL("https://harshtiwari47.github.io/kasiko-public/images/crime.png")
               )
            )
            .addSeparatorComponents(separate => separate)
            .addTextDisplayComponents(
               textDisplay => textDisplay.setContent(crimeReply)
            )

         await interaction.editReply({
            components: [Container],
            flags: MessageFlags.IsComponentsV2
         });
         return;
      } catch (e) {
         console.error(e);
         await interaction.editReply({
            content: "Oops! Something went wrong during your crime attempt 🚨. Please try again later!"
         }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
         return;
      }
   }
};
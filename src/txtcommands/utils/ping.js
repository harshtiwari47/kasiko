import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";

/**
 * Ping command that calculates and displays the bot's latency.
 */
export default {
  name: "ping",
  description: "Checks the bot's latency and responds with detailed ping information.",
  aliases: ["latency", "pong"],
  cooldown: 10000,
  category: "🔧 Utility",

  /**
   * Executes the ping command.
   * @param {Array} args - The command arguments.
   * @param {Message} message - The Discord message object.
   */
  execute: async (args, message) => {
    try {
      // Capture the current timestamp to measure round-trip latency
      const startTime = Date.now();

      // Send an initial reply indicating that the ping is in progress
      const pingMessage = await message.reply("🏓 Pinging...");

      // Calculate the latency between sending and editing the message
      const roundTripLatency = Date.now() - startTime;

      // Get the WebSocket (API) latency from the Discord client
      const apiLatency = message.client.ws.ping;

      // Create an embed with enhanced design and detailed descriptions
      const embed = new EmbedBuilder()
        .setTitle("🏓 Pong!")
        .addFields(
          {
            name: "Round-Trip Latency",
            value: `**${roundTripLatency}ms**`,
            inline: true,
          },
          {
            name: "WebSocket (API) Latency",
            value: `**${apiLatency}ms**`,
            inline: true,
          }
        )

      // Edit the original ping message to include the embed with latency details
      await pingMessage.edit({
        content: null, // Clear the initial text message
        embeds: [embed],
      });
    } catch (error) {
      // Log errors unless they are common, non-critical issues
      if (error.message !== "Unknown Message" && error.message !== "Missing Permissions") {
        console.error("An error occurred in the ping command:", error);
      }
    }
  },
};
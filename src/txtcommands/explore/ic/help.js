import {
  EmbedBuilder
} from 'discord.js';

const embed = new EmbedBuilder()
.setTitle("🍦 Ice Cream Shop Commands")
.setColor("#f5bbaf")
.setDescription("Here are the available commands for managing your Ice Cream Shop:")
.addFields(
  {
    name: "💢 General", value: "`ice create <shopname (no space)>`, `shop`, `layout`, `leaderboard`"
  },
  {
    name: "🍧 Flavours",
    value: "`flavours` (all available), `flavours my` (your shop flavours)"
  },
  {
    name: "🍨 Shop Actions",
    value: "`make` (create a new flavour), `upgrade machine/layout` (upgrade shop), `share @user <flavour>` (share ice cream)"
  },
  {
    name: "💰 Economy",
    value: "`exchange <amount>` (convert loyalty points into <:kasiko_coin:1300141236841086977> cash), `daily` (claim your daily bonus)"
  }
)
.setFooter({
  text: "Use `ice <command>` to interact with your shop!"
});

export default embed
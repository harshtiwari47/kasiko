import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "weapon",
  description: "View pirate combat weapons and stats.",
  aliases: ["weapons", "arsenal"],
  cooldown: 10000,
  category: "⚓ Pirates",
  execute: async (args, message) => {
    try {
      const embed = new EmbedBuilder()
        .setTitle("⚓ Pirate Combat Arsenal")
        .setColor("#e67e22")
        .setDescription("Equip your pirate ship with powerful cannons and defensive weaponry for tactical sea battles.")
        .addFields(
          {
            name: "💥 Standard Cannon",
            value: "**Type:** Basic Attack\n**Damage:** 15-30 HP\n**Cooldown:** None",
            inline: true
          },
          {
            name: "🛡️ Reinforced Plating",
            value: "**Type:** Defense\n**Effect:** Reduces incoming damage by 40%\n**Cooldown:** 1 turn",
            inline: true
          },
          {
            name: "🪝 Grappling Harpoon",
            value: "**Type:** Special Attack\n**Damage:** 40-75 HP\n**Cooldown:** 2 turns",
            inline: true
          }
        )
        .setFooter({
          text: "Use 'kas battle @user' to challenge rivals to a sea battle!"
        })
        .setTimestamp();

      return await message.channel.send({
        embeds: [embed]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (err) {
      console.error('[Weapon] Error:', err);
    }
  }
};

import HorizonUser from "../../../models/HorizonUser.js";
import {
  EmbedBuilder
} from "discord.js";
import {
  handleMessage,
  discordUser
} from "../../../helper.js";

export async function horizonMe(context, userId) {
  const {
    name,
    avatar
  } = discordUser(context);

  const user = await HorizonUser.findOne({
    userId
  });

  if (!user) {
    return handleMessage(context, {
      embeds: [
        new EmbedBuilder()
        .setTitle(`🐲 Horizon Profile`)
        .setDescription(`**${name}**, you haven't participated in any Horizon battles yet.`)
        .setColor("Red")
        .setFooter({
          text: "Join a battle using `horizon new` or `horizon join <code>`"
        })
        .setTimestamp()
        .setAuthor({
          name, iconURL: avatar
        })
      ]
    });
  }

  const {
    totalBattlesPlayed = 0,
    totalBattlesWon = 0,
    totalBattlesLost = 0,
    totalBossesDefeated = 0,
    totalDamageDealt = 0,
    highestDamageInBattle = 0,
    mostBossesInBattle = 0,
    lastBattle = {}
  } = user;

  const {
    code = "—",
    status = "—",
    bossLevelReached = "—",
    damageDealt = "—",
    totalRewards = "—",
    finishedAt
  } = lastBattle || {};

  const profileEmbed = new EmbedBuilder()
  .setTitle(`🌅 Horizon Profile`)
  .setColor("Blurple")
  .setAuthor({
    name, iconURL: avatar
  })
  .addFields(
    {
      name: "🏆 Battles",
      value: `**Played:** ${totalBattlesPlayed}\n**Won:** ${totalBattlesWon}\n**Lost:** ${totalBattlesLost}`,
      inline: true
    },
    {
      name: "🐉 Performance",
      value: `**Bosses Defeated:** ${totalBossesDefeated}\n**Damage Dealt:** ${totalDamageDealt}`,
      inline: true
    },
    {
      name: "🔝 Best Stats",
      value: `**Max Damage:** ${highestDamageInBattle}\n**Most Bosses:** ${mostBossesInBattle}`,
      inline: true
    },
    {
      name: "📜 Last Battle",
      value: `**Code:** \`${code}\`\n**Status:** ${status}\n**Boss Level:** ${bossLevelReached}\n**Damage:** ${damageDealt}\n**Rewards:** ${totalRewards}\n**Activity:** ${finishedAt ? `<t:${Math.floor(new Date(finishedAt).getTime() / 1000)}:R>`: "—"}`
    }
  );

  return handleMessage(context, {
    embeds: [profileEmbed]
  });
}
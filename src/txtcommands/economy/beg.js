import {
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  ITEM_DEFINITIONS,
  getRandomItem
} from '../../inventory.js';

import redisClient from '../../../redis.js';

export default {
  name: "beg",
  description: "Beg in a silly tone for cash. Sometimes you succeed, sometimes you hilariously fail!",
  aliases: ["plead",
    "begplease"],
  args: "",
  example: ["beg"],
  related: ["daily",
    "cash",
    "economy"],
  cooldown: 5000,
  customCooldown: true,
  emoji: "<:beg_outfit:1385612271128018944>",
  category: "🏦 Economy",
  cooldownMessage(ttl, name) {
    const minutes = Math.floor(ttl / 60);
    const seconds = ttl % 60;
    let timeStr = "";
    if (minutes > 0) timeStr += `${minutes} minute${minutes !== 1 ? 's': ''}`;
    if (minutes > 0 && seconds > 0) timeStr += " ";
    if (seconds > 0) timeStr += `${seconds} second${seconds !== 1 ? 's': ''}`;

    const container = new ContainerBuilder()
    .addTextDisplayComponents(td =>
      td.setContent(`Chill **${name}**, even beggars need a break.`)
    )
    .addTextDisplayComponents(td =>
      td.setContent(`<:kasiko_stopwatch:1355056680387481620> Come back in **${timeStr}**.`)
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  },
  async execute(args, context) {
    const user = context.user || context.author;
    const {
      id: userId,
      name
    } = discordUser(context);

    let userData;
    try {
      userData = await getUserData(userId);
    } catch (err) {
      console.error('Error fetching user data in beg command:', err);
      return handleMessage(context, {
        content: `<:alert:EMOJI_ID> Oops! Couldn't fetch your data. Try again later.`
      });
    }

    if (typeof userData.cash !== 'number') {
      userData.cash = 0;
    }

    const events = [
      // 1
      {
        get: () => {
          const amount = 3000 + Math.floor(Math.random() * 7001); // 3000–10000
          const result = amount >= 6000 ? "success": "mid";
          return {
            message: `A mysterious stranger finds your act so “avant-garde” they fork over **<:kasiko_coin:1300141236841086977>${amount}** “for the show.”`,
            delta: amount,
            result
          };
        }
      },
      // 2
      {
        get: () => {
          // originally some small random; now decide whether someone gives a small tip
          let amount = 0;
          if (Math.random() < 0.7) {
            amount = 3000 + Math.floor(Math.random() * 3000); // 3000–5999
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `You trip over dramatically; someone tosses you **<:kasiko_coin:1300141236841086977>${amount}** out of pity (or laughter!).`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `You trip and land face-first. No coins, just bruised ego.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 3
      {
        get: () => {
          let amount = 0;
          if (Math.random() < 0.5) {
            amount = 3000 + Math.floor(Math.random() * 7001);
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `You recite a heartfelt (but off-key) plea; a passerby tips you **<:kasiko_coin:1300141236841086977>${amount}** coins.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `You recite your plea, but voice cracks horribly. Nobody listens.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 4
      {
        get: () => ({
          message: `A prankster gives you a pie to the face 🥧 instead of coins. Ouch!`,
          delta: 0,
          result: "failure"
        })
      },
      // 5
      {
        get: () => ({
          message: `A stray dog snatches your hat. You have no coins to bribe it back, so you just watch it run off. No loss—but you gain nothing.`,
          delta: 0,
          result: "failure"
        })
      },
      // 6
      {
        get: () => {
          const amount = 6000 + Math.floor(Math.random() * 4001); // 6000–10000
          const result = "success";
          return {
            message: `A confused merchant mistakes you for a street performer and gives you **<:kasiko_coin:1300141236841086977>${amount}** “for entertaining.”`,
            delta: amount,
            result
          };
        }
      },
      // 7
      {
        get: () => {
          let amount = 0;
          if (Math.random() < 0.7) {
            amount = 3000 + Math.floor(Math.random() * 7001);
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `Someone mistakes you for a famous beggar and throws **<:kasiko_coin:1300141236841086977>${amount}** at you—lucky break!`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `Someone mistakes you for a mime. They stare silently; no coins exchanged.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 8
      {
        get: () => ({
          message: `Your dramatic plea is so baffling that someone hands you a sock 🧦. Cash? Nope.`,
          delta: 0,
          result: "failure"
        })
      },
      // 9
      {
        get: () => ({
          message: `A bird poops on your head mid-plea. You have no coins to buy a towel; you just endure it. No gain.`,
          delta: 0,
          result: "failure"
        })
      },
      // 10
      {
        get: () => {
          const amount = 3000 + Math.floor(Math.random() * 7001);
          const result = amount >= 6000 ? "success": "mid";
          return {
            message: `A tiny fairy (in your imagination) gifts you **<:kasiko_coin:1300141236841086977>${amount}** coins.`,
            delta: amount,
            result
          };
        }
      },
      // 11
      {
        get: () => {
          if (Math.random() < 0.5) {
            const amount = 3000 + Math.floor(Math.random() * 7001);
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `A street magician is impressed by your plea and “magically” produces **<:kasiko_coin:1300141236841086977>${amount}** from thin air.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `The magician tries to help but accidentally pulls out a frog 🐸 instead of coins.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 12
      {
        get: () => {
          if (Math.random() < 0.3) {
            return {
              message: `A mischievous goblin appears but finds no coins to steal. You lose nothing—but gain nothing either.`,
              delta: 0,
              result: "failure"
            };
          } else {
            const gain = 3000 + Math.floor(Math.random() * 7001);
            const result = gain >= 6000 ? "success": "mid";
            return {
              message: `A kindly old wizard hears your plea and gives you **<:kasiko_coin:1300141236841086977>${gain}** coins (and a sparkle in your eye).`,
              delta: gain,
              result
            };
          }
        }
      },
      // 13
      {
        get: () => ({
          message: `You sing a tune off-key; a cat joins in but no one tips. Zero coins.`,
          delta: 0,
          result: "failure"
        })
      },
      // 14
      {
        get: () => {
          const amount = 3000 + Math.floor(Math.random() * 2001); // 3000–5000
          const result = "mid";
          return {
            message: `A toddler gives you **<:kasiko_coin:1300141236841086977>${amount}** coins because they think you're playing a game.`,
            delta: amount,
            result
          };
        }
      },
      // 15
      {
        get: () => ({
          message: `You borrow coins from a friend to beg, then forget to repay. Your friend laughs it off, so you lose nothing now—but the shame remains.`,
          delta: 0,
          result: "failure"
        })
      },
      // 16
      {
        get: () => {
          let amount = 0;
          if (Math.random() < 0.5) {
            amount = 3000 + Math.floor(Math.random() * 7001);
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `You wave a sign with hilarious doodles; someone gives you **<:kasiko_coin:1300141236841086977>${amount}** out of amusement.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `Your sign is so confusing that people ignore you completely.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 17
      {
        get: () => ({
          message: `A passerby gives you a mysterious “lucky charm” 🧿 instead of coins. No cash change.`,
          delta: 0,
          result: "failure"
        })
      },
      // 18
      {
        get: () => {
          let amount = 0;
          if (Math.random() < 0.5) {
            amount = 3000 + Math.floor(Math.random() * 7001);
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `A baker hears you and gives you **<:kasiko_coin:1300141236841086977>${amount}** coins plus a free muffin 🧁.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `The baker is out of muffins and coins. Better luck next time.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 19
      {
        get: () => {
          if (Math.random() < 0.4) {
            const amount = 3000 + Math.floor(Math.random() * 2001); // 3000–5000
            const result = "mid";
            return {
              message: `A ninja appears silently, tosses you **<:kasiko_coin:1300141236841086977>${amount}**, and vanishes without a trace.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `A ninja appears and karate-chops your wallet—but you had no coins. You lose nothing (but still feel the pain).`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 20
      {
        get: () => {
          let amount = 0;
          if (Math.random() < 0.5) {
            amount = 3000 + Math.floor(Math.random() * 7001);
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `A tourist mistakes you for a guide and tips you **<:kasiko_coin:1300141236841086977>${amount}** coins.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `A tourist mistakes you for a guide but then leaves abruptly.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 21
      {
        get: () => ({
          message: `You attempt to juggle imaginary coins; someone politely hands you a water bottle instead.`,
          delta: 0,
          result: "failure"
        })
      },
      // 22
      {
        get: () => {
          const amount = 3000 + Math.floor(Math.random() * 7001);
          const result = amount >= 6000 ? "success": "mid";
          return {
            message: `A pirate (in cosplay) thinks you're part of the act and gives **<:kasiko_coin:1300141236841086977>${amount}** coins.`,
            delta: amount,
            result
          };
        }
      },
      // 23
      {
        get: () => {
          if (Math.random() < 0.5) {
            return {
              message: `Someone mistakes you for a pickpocket but finds no coins to fine you. You walk away with nothing lost—but nothing gained.`,
              delta: 0,
              result: "failure"
            };
          } else {
            return {
              message: `You're unlucky: mistaken identity, but you have no coins so they let you go.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 24
      {
        get: () => {
          let amount = 0;
          if (Math.random() < 0.5) {
            amount = 3000 + Math.floor(Math.random() * 7001);
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `A juggler invites you on stage; you help juggle and earn **<:kasiko_coin:1300141236841086977>${amount}** coins.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `You fumble the juggling props and the audience boos. No coins.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 25
      {
        get: () => ({
          message: `You mime a dramatic story; someone gives you popcorn 🍿 but forgets coins.`,
          delta: 0,
          result: "failure"
        })
      },
      // 26
      {
        get: () => {
          const amount = 3000 + Math.floor(Math.random() * 7001);
          const result = amount >= 6000 ? "success": "mid";
          return {
            message: `A street artist paints your portrait in exchange for **<:kasiko_coin:1300141236841086977>${amount}** coins.`,
            delta: amount,
            result
          };
        }
      },
      // 27
      {
        get: () => {
          if (Math.random() < 0.5) {
            const amount = 3000 + Math.floor(Math.random() * 7001);
            const result = amount >= 6000 ? "success": "mid";
            if (amount > 0) {
              return {
                message: `A robot on a promo gives you **<:kasiko_coin:1300141236841086977>${amount}** coins randomly.`,
                delta: amount,
                result
              };
            } else {
              return {
                message: `The robot malfunctions and gives nothing.`,
                delta: 0,
                result: "failure"
              };
            }
          } else {
            return {
              message: `The robot malfunctions and sprays you with confetti 🎉. No coins.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 28
      {
        get: () => {
          let amount = 0;
          if (Math.random() < 0.5) {
            amount = 3000 + Math.floor(Math.random() * 7001);
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `A comedian finds your plea funny and tips you **<:kasiko_coin:1300141236841086977>${amount}** coins.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `A comedian tries to roast you; you leave with no coins but some self-awareness.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 29
      {
        get: () => ({
          message: `You ask a fortune teller; they predict immense wealth but give only a free tarot reading. Cash: 0.`,
          delta: 0,
          result: "failure"
        })
      },
      // 30
      {
        get: () => {
          const amount = 3000 + Math.floor(Math.random() * 7001);
          const result = amount >= 6000 ? "success": "mid";
          return {
            message: `A jester juggles coins with you and drops **<:kasiko_coin:1300141236841086977>${amount}** at your feet.`,
            delta: amount,
            result
          };
        }
      },
      // 31
      {
        get: () => {
          // rare big win
          if (Math.random() < 0.05) {
            const big = 6000 + Math.floor(Math.random() * 4001); // 6000–10000
            return {
              message: `🎉 Jackpot! A mysterious benefactor pays you **<:kasiko_coin:1300141236841086977>${big}** coins for your performance!`,
              delta: big,
              result: "success"
            };
          } else {
            return {
              message: `No jackpot today. Better luck next time.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 32
      {
        get: () => ({
          message: `You owe a street vendor a “performance permit” fee, but you have no coins—luckily they let you off with a warning. No loss, but no gain either.`,
          delta: 0,
          result: "failure"
        })
      },
      // 33
      {
        get: () => {
          let amount = 0;
          if (Math.random() < 0.5) {
            amount = 3000 + Math.floor(Math.random() * 7001);
          }
          if (amount > 0) {
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `You recite a haiku about coins; a poet tips you **<:kasiko_coin:1300141236841086977>${amount}** coins.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `Your haiku is too abstract; nobody understands it.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      },
      // 34
      {
        get: () => ({
          message: `A mime competition starts nearby; you join but forget to ask for tips. Zero coins.`,
          delta: 0,
          result: "failure"
        })
      },
      // 35
      {
        get: () => {
          if (Math.random() < 0.8) {
            const amount = 3000 + Math.floor(Math.random() * 7001);
            const result = amount >= 6000 ? "success": "mid";
            return {
              message: `A passing merchant gives you **<:kasiko_coin:1300141236841086977>${amount}** coins for telling a silly joke.`,
              delta: amount,
              result
            };
          } else {
            return {
              message: `Your joke falls flat. No coins.`,
              delta: 0,
              result: "failure"
            };
          }
        }
      }];

    const chosen = events[Math.floor(Math.random() * events.length)].get();
    let {
      message: middleMessage,
      delta,
      result
    } = chosen;

    const oldCash = userData.cash;
    let newCash = oldCash + delta;
    if (newCash < 0) newCash = 0;
    let randomItem;
    let randomItemAmount = 0;

    try {
      if (delta > 0) {
        if (result === "success" && Math.random() > 0.5) {
          randomItem = getRandomItem(item => item?.source && item?.source.includes("beg"));
          const updates = {
            cash: newCash
          }
          randomItemAmount = 1 + Math.floor(Math.random() * 2);

          if (randomItem) {
            updates[`inventory.${randomItem.id}`] = randomItemAmount;
          }

          await updateUser(userId, updates);
        } else {
          await updateUser(userId, {
            cash: newCash
          });
        }
      }
    } catch (err) {
      console.error('Error updating user in beg command:', err);
    }

    const wrapped = `${middleMessage}`;

    const container = new ContainerBuilder()
    .addTextDisplayComponents(td =>
      td.setContent(`<:beg_outfit:1385612271128018944> **${name} makes a plea...**`))
    .addSeparatorComponents(sep => sep)
    .addTextDisplayComponents(td =>
      td.setContent(wrapped));

    if (randomItem) {
      container.addSeparatorComponents(sep => sep);
      container.addTextDisplayComponents(td =>
        td.setContent(`<:reply:1368224908307468408> 𝘠𝘰𝘶 𝘢𝘭𝘴𝘰 𝘳𝘦𝘤𝘦𝘪𝘷𝘦𝘥: ${randomItem.emoji} **${randomItem.name}** x${randomItemAmount}`));
    }

    try {
      await handleMessage(context, {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (err) {
      console.error('Error sending beg result:', err);
      return handleMessage(context, {
        content: `<:alert:EMOJI_ID> Could not send beg result.`
      });
    }
  }
};
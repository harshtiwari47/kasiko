import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "drive",
  description: "Drive a car with a specified action.",
  aliases: ["car",
    "ride"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const actions = [{
        action: "is driving down the highway 🚗💨.",
        gifUrl: 'https://gifdb.com/images/high/white-car-in-curve-road-anime-i3vcqqj1uxnlsbs9.gif' // Highway driving GIF
      },
        {
          action: "is cruising the streets 🏎️💨.",
          gifUrl: 'https://media4.giphy.com/media/feOLsVVsYft04/giphy.gif' // Cruising GIF
        },
        {
          action: "is going on a road trip 🚙!",
          gifUrl: 'https://gifdb.com/images/high/inugami-korone-driving-car-anime-pw559ojnn5ogxl4d.webp' // U: Road trip GIF
        },
        {
          action: "is racing through the city 🏁.",
          gifUrl: 'https://gifdb.com/images/high/car-racing-anime-mayqzsjnz1403msj.gif' // Racing GIF
        },
        {
          action: "is drifting like a pro 🚗💨.",
          gifUrl: 'https://gifdb.com/images/high/yellow-car-overtaking-anime-efjh35uljk61oknn.gif' // Drifting GIF
        },
        {
          action: "is enjoying a calm drive with the windows down 🌞.",
          gifUrl: 'https://gifdb.com/images/high/car-pet-inside-anime-m2s59g5c3rlnpy7g.webp' // Calm drive GIF
        },
        {
          action: "is zooming through the streets with the music blasting 🚘🎶.",
          gifUrl: 'https://gifdb.com/images/high/bored-spirited-away-car-anime-b9qw7fjh8xx5xy77.gif' // Zooming GIF
        },
        {
          action: "is cruising in style 🚗💨.",
          gifUrl: 'https://gifdb.com/images/high/red-car-approaching-anime-d8vvrepf4qvk1r3s.gif' // Stylish cruise GIF
        },
        {
          action: "is navigating tough terrain like a champ 🚜.",
          gifUrl: 'https://gifdb.com/images/high/gunsmith-cats-car-anime-cjomi7i9f7pp6rt4.gif' // Off-road GIF
        },
        {
          action: "is testing their new sports car on the track 🏎️.",
          gifUrl: 'https://gifdb.com/images/high/car-machine-anime-3o04y2uc62c5i469.gif' // Track driving GIF
        },
        {
          action: "is pulling off some crazy stunts in the car park 🚗🎢.",
          gifUrl: 'https://gifdb.com/images/high/riding-bean-car-chase-anime-am2sxbezh6ua91ee.gif' // Stunt GIF
        },
        {
          action: "is riding into the sunset 🌅.",
          gifUrl: 'https://gifdb.com/images/high/houshou-marine-gawr-gura-car-anime-36du91u55vdj9mdv.gif' // Sunset ride GIF
        },
        {
          action: "is speeding through the desert 🏜️.",
          gifUrl: 'https://gifdb.com/images/high/dragon-ball-red-car-anime-qivq64k6p302vvg4.gif' // Desert speed GIF
        },
        {
          action: "is stuck in traffic 🚦.",
          gifUrl: 'https://gifdb.com/images/high/funny-car-traffic-anime-vom4cvp23ied2q41.gif' // Traffic GIF
        },
        {
          action: "is participating in a demolition derby 🏁.",
          gifUrl: 'https://gifdb.com/images/high/fast-mode-car-anime-kqkdrzzov49j67hq.gif' // Demolition GIF
        },
      ];

      // Pick a random action from the list
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription(`**${message.author.username}** ${randomAction.action}`)
      .setFooter({
        text: `Requested by ${message.author.tag} | Gif: gifdb`
      })
      .setImage(randomAction.gifUrl); // Set the corresponding GIF for the action

      await message.channel.send({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};
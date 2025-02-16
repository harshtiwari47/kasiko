export default {
  name: "rizz",
  description: "Drop a smooth rizz line to impress someone!",
  aliases: ["flirt",
    "pickup"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const rizzLines = [
        "Are you a magician? Because whenever I look at you, everyone else disappears.",
        "Do you have a map? Because I keep getting lost in your eyes.",
        "Are you French? Because Eiffel for you.",
        "Are you made of copper and tellurium? Because you’re Cu-Te.",
        "Are you WiFi? Because I’m really feeling a connection.",
        "Do you believe in love at first sight, or should I walk by again?",
        "Are you a campfire? Because you’re hot and I want s’more.",
        "Do you like Star Wars? Because Yoda one for me.",
        "Are you a time traveler? Because I see you in my future.",
        "Are you a bank loan? Because you’ve got my interest.",
        "Are you an angle? Because you’re acute one.",
        "You must be a parking ticket, because you’ve got FINE written all over you.",
        "Are you an artist? Because you just drew me in.",
        "Do you have a Band-Aid? Because I just scraped my knee falling for you.",
        "Is your name Google? Because you have everything I’ve been searching for.",
        "Are you a keyboard? Because you’re just my type.",
        "Are you gravity? Because you’re pulling me in.",
        "Are you a shooting star? Because my wish just came true.",
        "If you were a vegetable, you’d be a ‘cute-cumber’.",
        "Do you have a sunburn, or are you always this hot?",
        "You must be made of stardust, because you shine like the entire galaxy.",
        "Are you my homework? Because I’m not doing you, but I definitely should be.",
        "Is your name Chapstick? Because you’re da balm.",
        "Do you like coffee? Because you’re brewing up some feelings in me.",
        "If you were a Transformer, you’d be Optimus Fine.",
        "Are you an electrician? Because you’re lighting up my life.",
        "Is your name Netflix? Because I could binge-watch you all day.",
        "Are you a snowflake? Because I’ve fallen for you.",
        "You must be a magician because every time I look at you, everyone else disappears.",
        "Are you a star? Because your beauty lights up the night.",
        "Are you oxygen? Because I can’t live without you.",
        "You must be a math book, because you have too many problems… but I’d still love to solve you.",
        "Are you a sunrise? Because you brighten up my day.",
        "Are you the square root of -1? Because you can’t be real.",
        "You must be WiFi, because we have a strong connection.",
        "Are you a battery? Because you’ve got my heart charged up.",
        "Is your name Venus? Because you’ve got me orbiting around you.",
        "Are you a cloud? Because you make my heart float.",
        "You must be a time traveler because every time I’m with you, I lose track of time.",
        "Are you a shooting star? Because you just made all my wishes come true.",
        "Are you a piece of art? Because I could stare at you all day.",
        "You must be a campfire, because you’re hot and I want s’more.",
        "Are you a dream? Because I never want to wake up from this moment with you.",
        "Are you a sunflower? Because you brighten my day.",
        "You must be a spellcaster because every time you talk, I’m enchanted.",
        "Are you a candle? Because you light up my life.",
        "Do you like science? Because I think we have good chemistry.",
        "Is your name Cinderella? Because your beauty is magical.",
        "Are you an earthquake? Because you just shook up my world.",
        "Are you a star? Because I feel like I’m lost in your galaxy.",
        "You must be a chef, because you’ve cooked up something special in my heart."
      ];

      const target = args.length ? args.join(" "): "you";
      const randomRizz = rizzLines[Math.floor(Math.random() * rizzLines.length)];

      await message.reply(`🔥 ${target.replace(args[0], "")}, ${randomRizz}`)
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  },
};
export default {
  name: "roast",
  description: "Roast someone with a witty comeback!",
  aliases: ["burn",
    "insult"],
  cooldown: 4000,
  category: "Fun",
  execute: async (args, message) => {
    const roasts = [
      "You're like a cloud. When you disappear, it’s a beautiful day.",
      "You're proof that even the worst players can still win the game of life.",
      "Your secrets are safe with me. I never even listen when you tell me them.",
      "You're like a software update. Whenever I see you, I hit 'remind me later.'",
      "You're like a web page that takes forever to load... useless and frustrating.",
      "I'd agree with you, but then we’d both be wrong.",
      "You're not stupid; you just have bad luck thinking.",
      "If I had a penny for every time you said something smart, I’d be broke.",
      "Your brain's on vacation, but your mouth is working overtime.",
      "You're like a broken pencil... pointless.",
      "I’d explain it to you, but I left my English-to-Dingbat dictionary at home.",
      "You bring everyone so much joy when you leave the room.",
      "You're like a cloud on a sunny day, blocking all the good vibes.",
      "If I had a nickel for every dumb thing you said, I could retire early.",
      "You're like a phone with no signal: completely useless.",
      "I’ve seen salads dressed better than you.",
      "You're like a slinky—worthless, but fun to push down the stairs.",
      "If you were any more clueless, you’d be a GPS.",
      "You're the reason the gene pool needs a lifeguard.",
      "You're not the sharpest tool in the shed, but you’re still a tool.",
      "I’d call you a tool, but that would be an insult to the tool.",
      "You're like a software bug: nobody knows how you got here, but now we all have to deal with you.",
      "If ignorance is bliss, you must be the happiest person alive.",
      "I’d say you’re one in a million, but that would imply there’s at least one other like you.",
      "You're like a phone with a cracked screen—hard to look at and even harder to use.",
      "You have the right to remain silent because whatever you say will be used against you.",
      "You're like an overcooked steak—tough, dry, and hard to chew on.",
      "You’re the human equivalent of a participation trophy.",
      "You're like a mystery novel—no one can figure you out, and everyone’s better off without you.",
      "If I wanted your opinion, I’d ask someone else.",
      "You're not the sharpest knife in the drawer, but you’re definitely the dullest.",
      "You're like a browser tab with 50 open windows—chaotic and not productive.",
      "You're the reason the word 'vacant' was invented.",
      "If I wanted to hear something as unoriginal as your ideas, I’d just listen to elevator music.",
      "You’re like a traffic jam—no one knows why you're here, but we're all stuck with you.",
      "You couldn’t pour water out of a boot if the instructions were on the heel.",
      "I’d try to explain it to you, but I'm afraid I'd be overestimating your intellectual capacity.",
      "You're like a Wi-Fi password that’s too long to remember.",
      "Your thoughts are like a lightbulb—they go out more than they come on.",
      "You're like a fire alarm in the middle of the night—loud and unnecessary.",
      "If you were any more transparent, you’d be invisible.",
      "You're like a homework assignment—always delayed and never done right.",
      "You remind me of a cloud with no silver lining.",
      "You’re like an app with no updates—stuck in the past.",
      "You're the human equivalent of a pop-up ad.",
      "You're like a pencil without lead—totally pointless.",
      "You're like an expired coupon—no longer of any value.",
      "You’re like a car without a GPS—always lost, but still moving forward.",
      "You’re proof that even the best of us can have a bad day… every day.",
      "Your sense of direction is as lost as your common sense.",
      "If being wrong was a sport, you’d be a gold medalist.",
      "You're like a mystery meat at a school cafeteria—no one’s sure what you are, and no one wants to find out.",
      "Your logic is so skewed, you could teach a course on how not to think.",
      "You’re like a black hole—everything good just gets sucked out of the room when you show up.",
      "Your ideas are like a bad movie—predictable and not worth watching.",
      "You're like a car with a flat tire—stuck, useless, and annoying to deal with.",
      "You couldn’t spell ‘smart’ if your life depended on it.",
      "You have the same effect as a broken pencil—pointless and frustrating.",
      "You're like a malfunctioning robot—awkward and no longer useful.",
      "You’re the reason ‘dumb’ is a word in the dictionary.",
      "You're like a Wi-Fi connection that drops every 5 minutes—unpredictable and unreliable.",
      "You’re a couple of fries short of a happy meal.",
      "You’re a one-person circus act, and everyone’s tired of the show.",
      "If I had a dime for every time you made me laugh, I’d be broke from all the pain.",
      "You're the kind of person who'd forget their own reflection if it wasn't for the mirror.",
      "You're like a speeding ticket—always there when you least need it."
    ];

    const target = args.length ? args.join(" "): "you";
    const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];

    await message.reply(`🔥 ${target.replace(args[0], "")}, ${randomRoast}`);
  },
};
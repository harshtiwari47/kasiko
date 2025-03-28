export default {
  name: "roast",
  description: "Roast someone with a witty comeback!",
  aliases: ["burn",
    "insult"],
  cooldown: 10000,
  category: "🧩 Fun",
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
      "You're like a speeding ticket—always there when you least need it.",
      "You're the kind of person who’d bring a fork to a soup-eating contest.",
      "You’re like a cloud — fluffy, aimless, and occasionally blocking the sun.",
      "Your secrets are safe with me. I never even listen when you tell me them.",
      "You bring everyone so much joy... when you leave the room.",
      "You’re like a WiFi signal — weak and always dropping out at crucial moments.",
      "You have something on your chin... no, the third one down.",
      "You’re proof that even the best jokes can go too far.",
      "You’re the human version of a participation trophy.",
      "You’re like a software update — nobody asked for you, and you just make things worse.",
      "Your cooking could scare Gordon Ramsay into retirement.",
      "You’re the type to set an alarm for a nap and still oversleep.",
      "You’re like a black hole — no light, no energy, just an endless void.",
      "You're living proof that natural selection takes a day off sometimes.",
      "You’re the kind of person who claps when the plane lands.",
      "You’d trip over a wireless connection.",
      "You bring everyone together... to complain about you.",
      "You’re like an expired coupon — once useful, but now just sad and forgotten.",
      "You’re so indecisive you’d struggle to pick a side in a coin toss.",
      "You’re the person who’d get lost in a one-room apartment.",
      "Your brain’s like a web browser — too many tabs open, but nothing’s loading.",
      "You’re like a vending machine that only takes coins — outdated and inconvenient.",
      "You could argue with a wall and still lose the debate.",
      "You're proof that not all ideas deserve to be tried out.",
      "You’re like a traffic cone — always in the way but not really doing anything important.",
      "You’re the reason the shampoo bottle says, ‘Do not eat.’",
      "You’re like a candle in the wind — unreliable and likely to go out at any moment.",
      "You’re the kind of person who Googles ‘how to Google.’",
      "Your talent is like Bigfoot — people talk about it, but no one’s ever seen it.",
      "You’re like a summer day in the Arctic — pointless and confusing.",
      "You’d probably fail a personality test because even it would get bored.",
      "You’re like a password hint — never helpful and often frustrating.",
      "Your jokes are so old, they’re probably collecting social security.",
      "You’re the human version of a buffering video.",
      "You’re like a balloon — full of hot air and likely to pop under pressure.",
      "Your spirit animal is a sloth on a coffee break.",
      "You’re the type to argue with Siri and still get it wrong.",
      "You’d be a great reality TV star — people love watching trainwrecks.",
      "You’re like an offline map — lost and out of date.",
      "You’re like a pen with no ink — all show, no substance.",
      "Your fashion sense is so unique, it’s almost illegal.",
      "You’re like a sneeze that won’t come out — irritating and unresolved.",
      "You’re the human equivalent of a plot hole.",
      "You’re like a firework dud — all hype, no bang.",
      "You’re like a sticky note that won’t stick — always falling off track.",
      "You have the memory of a goldfish and the attention span of a gnat.",
      "You’re the reason ‘facepalm’ was invented.",
      "You’re like a group project — everyone else does the work while you take credit.",
      "You’d make a great role model… for what not to do.",
      "You’re like a karaoke machine that’s always off-key.",
      "You’re like a pop-up ad — nobody asked for you, but here you are."
    ];

    const target = args.length ? args.join(" "): "you";
    const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];

    return message.reply(`🔥 ${target.replace(args[0], "")}, ${randomRoast}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return;
  },
};
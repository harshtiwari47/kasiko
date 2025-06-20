import {
  EmbedBuilder,
  MessageFlags,
  TextDisplayBuilder,
  ContainerBuilder
} from 'discord.js';

export default {
  name: "gif",
  description: "Greet another user with a friendly 'hi'!",
  aliases: ["gg"],
  cooldown: 10000,
  category: "🧩 Fun",
  visible: false,
  execute: async (args, message) => {
    try {
      let keyword = args[1]?.toLowerCase();
      const gifKeywords = [
        "robert",
        "love",
        "gojo",
        "saviour",
        "bye",
        "madara",
        "maura",
        "walk",
        "peaky",
        "toni",
        "spirited",
        "tokyo",
        "rubi",
        "jin",
        "solo",
        "chai",
        "coffee"
      ];

      const Container = new ContainerBuilder()


      if (keyword === "robert") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://media.discordapp.net/attachments/1346413292242866208/1346413436959064074/ezgif-34505b1d7fa1d5.gif?ex=67c818ba&is=67c6c73a&hm=395abeec562721e95fc7564342408780bca2820df6fc36ae6e6334681bffd550&`)
          )
        )
      }

      if (keyword === "love") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://media.discordapp.net/attachments/1346413292242866208/1346413437776953374/ezgif-3a6065d70e21d8.gif?ex=67c818ba&is=67c6c73a&hm=72873752acf4244f9bc7fd1875f0f556a80cfd6ed2ad163e1effecc5b3cf7364&`)
          ))}

      if (keyword === "gojo") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://media.discordapp.net/attachments/1346413292242866208/1346413437374173214/ezgif-3cfcc36dcb90d6.gif?ex=67c818ba&is=67c6c73a&hm=7446326b7215f8700068deab318d596bed61ea8ed87ae931d4870402c4df93d0&`)
          ))}

      if (keyword === "saviour") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://media.discordapp.net/attachments/1346413292242866208/1346415094879228016/ezgif-3e203e0cace377.gif?ex=67c81a45&is=67c6c8c5&hm=5345d667c54c9cbff6d6656be138fe1ecc0f3bc6d4223c563d4f5219724b8f7f&`)
          ))}

      if (keyword === "bye") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384134036922044438/ezgif-88d428092355f8.gif?ex=685152c6&is=68500146&hm=e8bfaf534dc85e7346b0f9bdefeac5584a6fc33ac5a30c9574cf00aca9b93a56&`)
          ))
      }

      if (keyword === "madara") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384750262383808562/image1.gif?ex=685390ad&is=68523f2d&hm=a56a189472c10a4f99c4d3b70e1b1ac23be3d6de54a0c81e7370828dbf50f8b0&`)
          ))}

      if (keyword === "maura") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384750262064906351/ezgif-18a8b32eae7d7.gif?ex=685390ad&is=68523f2d&hm=bdee116bc6d77e33b610e09cea1245eacbc0e3a1818f0b8cd26330a5d879d35c&`)
          ))}

      if (keyword === "walk") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384918953318682764/image0-7.gif?ex=68542dc9&is=6852dc49&hm=3421385dc4557451bca50d5dcfabc68209a667907ba3b00dadb9f5010330b3f9&`)
          ))}

      if (keyword === "peaky") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384918953695907983/image0-8.gif?ex=68542dc9&is=6852dc49&hm=3f2ae2268b77a1d1aa095e172d18c9cbbe5b5e0f99b337ba9f97ce1cc13944c2&`)
          ))}

      if (keyword === "toni") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384920060581117982/image0-10.gif?ex=68542ed1&is=6852dd51&hm=bcaeedebd3a10fc89cff29c7a59cd1ee99e968d824576a885d9dfeed2b6ea24d&`)
          ))}

      if (keyword === "spirited") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384924788992114831/image0-25.gif?ex=68543338&is=6852e1b8&hm=1c6145c0a61ab0e248e5a11f5914b6d7457927901eb02709ae5bf007fba733e7&`)
          ))
      }

      if (keyword === "tokyo") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384924789659144233/image0-17.gif?ex=68543338&is=6852e1b8&hm=468149f6af36bf4c8a44e000b2ab141ef06c4facac4219f70bf47abea9303f58&`)
          ))
      }

      if (keyword === "rubi") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1384924789336051815/image0-21.gif?ex=68543338&is=6852e1b8&hm=ab5a3ac49668a7af41a9ad2875805df9259a68d679638a7aa9915bf39d15a34c&`)
          ))
      }

      if (keyword === "solo") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1385624183601500201/solo-leveling-gourajgs.gif?ex=6856be95&is=68556d15&hm=153af384a032d5856fd4f3cac6e11b4082b4fc95a36337e84d4a6318ddb1b34d&`)
          ))
      }


      if (keyword === "jin") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1385624182842195978/solo-leveling-solo-leveling-season-2_1.gif?ex=6856be94&is=68556d14&hm=6701166be4f3e0ac0419c90ac1edc03ea3338dd480dca43bc60651cd395d7d9b&`)
          ))
      }


      if (keyword === "chai") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1385626070564343938/giphy.gif?ex=6856c056&is=68556ed6&hm=f9cee48e8e03f5921668527848371f3e7050863d88fceb2e232a73e1b237dc2b&`)
          ))
      }

      if (keyword === "coffee") {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://cdn.discordapp.com/attachments/1346413292242866208/1385626071415914638/100.webp?ex=6856c057&is=68556ed7&hm=97cfe39909faffa59d77cd0a95734ecfc2a120e27092aef12c93020fd7587463&`)
          ))
      }

      if (!keyword || !gifKeywords.includes(keyword)) {
        Container.addMediaGalleryComponents(
          media =>
          media.addItems(
            item => item.setURL(`https://media.discordapp.net/attachments/1346413292242866208/1346413436552351835/ezgif-3cb93bd190325e.gif?ex=67c818ba&is=67c6c73a&hm=4077adc9c23029b8d12fabbd8f22ff35ff101e31073bca264ee39dc8a678275a&`)
          ));
      }

      await message.channel.send({
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      })
    } catch (e) {
      console.error(e);
    }
  },
};
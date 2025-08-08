import TestCmd from "./embed-test.js";
import EditCmd from "./embed-edit.js";
import ListCmd from "./embed-list.js";
import TriggerCmd from "./embed-set.js";
import CreateCmd from "./embed-create.js";
import DeleteCmd from "./embed-delete.js";

import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  ContainerBuilder,
  MessageFlags
} from "discord.js";

export default {
  name: 'embed',
  description: 'Create or manage a container message using buttons.',
  args: false,
  aliases: ["emb"],
  category: 'server',
  emoji: '📦',
  example: [
    "embed create <Name>",
    "embed edit <Name>",
    "embed test <Name>",
    "embed delete <Name>",
    "embed list",
    "embed trigger <Name> <option>",
  ],
  cooldown: 10000,
  async execute(args, context) {
    args.shift();
    const subcmd = args[0]?.toLowerCase();
    args.shift();

    switch (subcmd) {
    case "create":
      CreateCmd.execute(["embed-create", ...args], context);
      break;

    case "edit":
      EditCmd.execute(["embed-edit", ...args], context);
      break;

    case "list":
      ListCmd.execute(["embed-list", ...args], context);
      break;

    case "delete":
      DeleteCmd.execute(["embed-delete", ...args], context);
      break;
      
    case "trigger":
      TriggerCmd.execute(["embed-trigger", ...args], context);
      break;

    case "test":
      TestCmd.execute(["embed-test", ...args], context);
      break;

    default:
      const containerReply = new ContainerBuilder()
      .addTextDisplayComponents(txt =>
        txt.setContent(
          "**📦 Embed Command Help**\n" +
          "-# Manage and customize your server embeds with the following commands:\n\n" +
          "### Examples:\n" +
          "**` embed create <Name> `** — Create a new embed.\n" +
          "**` embed edit <Name> `** — Edit an existing embed.\n" +
          "**` embed test <Name> `** — Preview how the embed looks.\n" +
          "**` embed delete <Name> `** — Remove an embed.\n" +
          "**` embed list `** — View all saved embeds.\n" +
          "**` embed trigger <Name> <option> `** — Trigger an embed for a specific event. Option — join, leave, boost, default\n"
        )
      );

      return await handleMessage(context, {
        components: [containerReply],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      break;
    }
  }
}
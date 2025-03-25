import Cash from "./cash.js";
import Badge from "./badge.js";
import Ship from "./ship.js";

export async function OwnerCommands(args, message) {
  if (message.author.id !== "1318158188822138972") {
    return
  }

  const command = args[0]?.toLowerCase();

  if (!command) return;

  switch (command) {
    case "with":
    case "withdraw":
    case "w":
      await Cash.execute(args, message);
      return;
    case "badge":
    case "emoji":
      await Badge.execute(args, message);
    case "shipcustom":
    case "ship":
      await Ship.execute(args, message);
    default:
      return;
  }
}
import Cash from "./cash.js";

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
    default:
      return;
  }
}
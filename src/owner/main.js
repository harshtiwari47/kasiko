import fs from "fs";
import path from "path";
import Cash from "./cash.js";
import Badge from "./badge.js";
import Ship from "./ship.js";
import Bio from "./bio.js";

// hierarchy levels
const ownerHierarchy = {
  superowner: 3,
  adminowner: 2,
  basicowner: 1,
};

// Default owners hard-coded in case the file doesn't exist yet
const defaultOwners = {
  "1318158188822138972": ownerHierarchy.superowner,
};

// Path for the owners JSON file
const ownersFilePath = path.join(process.cwd(), '/src/owner', 'owners.json');

// Read the owners file if it exists, otherwise return default owners.
function getBotTeam() {
  if (fs.existsSync(ownersFilePath)) {
    try {
      const data = fs.readFileSync(ownersFilePath, "utf8");
      const fileOwners = JSON.parse(data);
      // Merge defaults with file data (file data overrides defaults)
      return {
        ...defaultOwners,
        ...fileOwners
      };
    } catch (err) {
      console.error("Error reading owners file:", err);
      return {
        ...defaultOwners
      };
    }
  } else {
    return {
      ...defaultOwners
    };
  }
}

// Write the updated owners data to the file.
function updateBotTeam(updatedOwners) {
  try {
    fs.writeFileSync(ownersFilePath, JSON.stringify(updatedOwners, null, 2));
  } catch (err) {
    console.error("Error writing owners file:", err);
  }
}

export async function OwnerCommands(args, message) {
  // Get the current bot team mapping from the file (or defaults)
  const botTeam = getBotTeam();
  const ownerLevel = botTeam[message.author.id];
  if (!ownerLevel) {
    return;
  }

  const command = args[0]?.toLowerCase();
  if (!command) return;

  switch (command) {
    case "with":
    case "withdraw":
    case "w":

      if (ownerLevel === ownerHierarchy.superowner) {
        await Cash.execute(args, message);
      } else {
        message.reply("You don't have permission to withdraw.");
      }
      return;

    case "badge":
    case "emoji":
      if (ownerLevel >= ownerHierarchy.adminowner) {
        await Badge.execute(args, message);
      } else {
        message.reply("You don't have permission to manage badges.");
      }
      return;

    case "shipcustom":
    case "ship":
      if (ownerLevel >= ownerHierarchy.basicowner) {
        await Ship.execute(args, message);
      } else {
        message.reply("You don't have permission to customize the ship.");
      }
      return;

    case "bio":
      if (ownerLevel >= ownerHierarchy.basicowner) {
        await Bio.execute(args, message);
      } else {
        message.reply("You don't have permission to update bio.");
      }
      return;

    case "addowner":
      // Only the special SuperOwner can add new owners
      if (message.author.id !== "1318158188822138972") {
        message.reply("You don't have permission to add new owners.");
        return;
      }

      const newOwnerId = args[1];
      const roleStr = args[2]?.toLowerCase();
      if (!newOwnerId || !roleStr) {
        message.reply("Usage: addowner <ownerID> <role> (e.g., superowner, adminowner, basicowner)");
        return;
      }

      let newOwnerLevel;
      if (roleStr in ownerHierarchy) {
        newOwnerLevel = ownerHierarchy[roleStr];
      } else {
        message.reply("Invalid role specified. Use: superowner, adminowner, or basicowner.");
        return;
      }

      const currentTeam = getBotTeam();
      currentTeam[newOwnerId] = newOwnerLevel;
      updateBotTeam(currentTeam);
      message.reply(`Added new owner ${newOwnerId} with role ${roleStr}.`);
      return;

    default:
      message.reply("Unknown command or insufficient permissions.");
      return;
  }
}
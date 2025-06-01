import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Cash from "./cash.js";
import Deduct from "./deduct.js";
import Reward from "./reward.js";
import Badge from "./badge.js";
import Ship from "./ship.js";
import Bio from "./bio.js";
import OwnerModel from "../../models/Owner.js";

const ownerHierarchy = {
  superowner: 3,
  adminowner: 2,
  basicowner: 1,
  shipowner: 0,
};

const defaultOwners = {
  "1318158188822138972": ownerHierarchy.superowner,
};

const ownersFilePath = path.join(process.cwd(), "/src/owner", "owners.json");

export function getBotTeam() {
  if (fs.existsSync(ownersFilePath)) {
    try {
      const data = fs.readFileSync(ownersFilePath, "utf8"); const fileOwners = JSON.parse(data); return {
        ...defaultOwners,
        ...fileOwners
      };
    } catch (err) {
      console.error("Error reading owners file:", err); return {
        ...defaultOwners
      };
    }
  } else {
    return {
      ...defaultOwners
    };
  }
}

function updateBotTeam(updatedOwners) {
  try {
    fs.writeFileSync(ownersFilePath, JSON.stringify(updatedOwners, null, 2));
  } catch (err) {
    console.error("Error writing owners file:", err);
  }
}

export async function OwnerCommands(args, message) {
  const botTeam = getBotTeam();
  const ownerLevel = botTeam[message.author.id]; if (!ownerLevel) return;

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
      
    case "deduct":
    case "ded":
    case "d":
      if (ownerLevel === ownerHierarchy.superowner) {
        await Deduct.execute(args, message);
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
      if (ownerLevel >= ownerHierarchy.shipowner) {
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

    case "reward":

      if (ownerLevel === ownerHierarchy.basicowner || ownerLevel === ownerHierarchy.adminowner) {
        await Reward.execute(args, message);
      } else {
        message.reply("You don't have permission to take rewards.");
      }
      return;

    case "addowner":
      if (message.author.id !== "1318158188822138972") {
        message.reply("You don't have permission to add new owners.");
        return;
      }

      const newOwnerId = args[1];
      const roleStr = args[2]?.toLowerCase();
      if (!newOwnerId || !roleStr) {
        message.reply("Usage: addowner <ownerID> <role>");
        return;
      }

      let newOwnerLevel = ownerHierarchy[roleStr];
      if (!newOwnerLevel) {
        message.reply("Invalid role specified.");
        return;
      }

      const currentTeam = getBotTeam();
      currentTeam[newOwnerId] = newOwnerLevel;
      updateBotTeam(currentTeam);
      await OwnerModel.create({
        ownerId: newOwnerId,
        ownerType: roleStr,
        dateJoined: new Date(),
        lastRewardWithdraw: null,
        totalCashWithdrawn: 0,
        totalServersContributed: 0,
        retired: false,
      });
      message.reply(`Added new owner ${newOwnerId} with role ${roleStr}.`);
      return;

    case "removeowner":
      if (message.author.id !== "1318158188822138972") {
        message.reply("You don't have permission to remove owners.");
        return;
      }

      const removeOwnerId = args[1];
      if (!removeOwnerId) {
        message.reply("Usage: removeowner <ownerID>");
        return;
      }

      delete currentTeam[removeOwnerId];
      updateBotTeam(currentTeam);
      await OwnerModel.findOneAndUpdate(
        {
          ownerId: removeOwnerId
        },
        {
          retired: true
        },
        {
          new: true
        }
      );
      message.reply(`Removed owner ${removeOwnerId}.`);
      return;

    default:
      message.reply("Unknown command or insufficient permissions.");
      return;
  }
}
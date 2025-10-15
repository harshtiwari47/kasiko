import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import Cash from "./cash.js";
import Deduct from "./deduct.js";
import Reward from "./reward.js";
import Badge from "./badge.js";
import Bank from "./bank.js";
import Ship from "./ship.js";
import Bio from "./bio.js";
import Profile from "./profile.js";
import OwnerModel from "../../models/Owner.js";

const ownerHierarchy = {
  superowner: 99,
  adminowner: 90,
  basicowner: 80,
  shipowner: 70,
};

const defaultOwners = {
  "1318158188822138972": ownerHierarchy.superowner,
};

const ownersFilePath = path.join(process.cwd(), "/src/owner", "owners.json");

// ---------------- Utility functions ----------------

export async function getBotTeam() {
  try {
    const data = await fs.readFile(ownersFilePath, "utf8");
    const fileOwners = JSON.parse(data);
    return { ...defaultOwners, ...fileOwners };
  } catch {
    return { ...defaultOwners };
  }
}

async function updateBotTeam(updatedOwners) {
  try {
    await fs.writeFile(ownersFilePath, JSON.stringify(updatedOwners, null, 2));
  } catch (err) {
    console.error("Error writing owners file:", err);
  }
}

function noPerm(message, action) {
  message.reply(`You don't have permission to ${action}.`);
}

// ---------------- Main command handler ----------------

export async function OwnerCommands(args, message) {
  const botTeam = await getBotTeam();
  const ownerLevel = botTeam[message.author.id];
  if (ownerLevel === undefined) return;

  const command = args[0]?.toLowerCase();
  if (!command) return;

  switch (command) {
    // ---------------- Finance ----------------
    case "with":
    case "withdraw":
    case "w":
      return ownerLevel === ownerHierarchy.superowner
        ? await Cash.execute(args, message)
        : noPerm(message, "withdraw");

    case "deduct":
    case "ded":
    case "d":
      return ownerLevel === ownerHierarchy.superowner
        ? await Deduct.execute(args, message)
        : noPerm(message, "deduct cash");

    case "bank":
      return ownerLevel >= ownerHierarchy.adminowner
        ? await Bank.execute(args, message)
        : noPerm(message, "perform bank operations");

    // ---------------- Visuals ----------------
    case "banner":
    case "color":
      return ownerLevel === ownerHierarchy.superowner
        ? await Profile.execute(args, message)
        : noPerm(message, "edit profile visuals");

    // ---------------- Reward / Badge ----------------
    case "badge":
    case "emoji":
      return ownerLevel >= ownerHierarchy.adminowner
        ? await Badge.execute(args, message)
        : noPerm(message, "manage badges");

    case "reward":
      return ownerLevel >= ownerHierarchy.basicowner
        ? await Reward.execute(args, message)
        : noPerm(message, "claim rewards");

    // ---------------- Bio / Ship ----------------
    case "bio":
      return ownerLevel >= ownerHierarchy.basicowner
        ? await Bio.execute(args, message)
        : noPerm(message, "update bio");

    case "ship":
    case "shipcustom":
      return ownerLevel >= ownerHierarchy.shipowner
        ? await Ship.execute(args, message)
        : noPerm(message, "customize ships");

    // ---------------- Owner Management ----------------
    case "addowner":
      if (message.author.id !== "1318158188822138972")
        return noPerm(message, "add new owners");

      {
        const newOwnerId = String(args[1]);
        const roleStr = args[2]?.toLowerCase();

        if (!newOwnerId || !roleStr)
          return message.reply("Usage: addowner <ownerID> <role>");

        const newOwnerLevel = ownerHierarchy[roleStr];
        if (newOwnerLevel === undefined)
          return message.reply("Invalid role specified.");

        const currentTeam = await getBotTeam();
        currentTeam[newOwnerId] = newOwnerLevel;
        await updateBotTeam(currentTeam);

        await OwnerModel.create({
          ownerId: newOwnerId,
          ownerType: roleStr,
          dateJoined: new Date(),
          lastRewardWithdraw: null,
          totalCashWithdrawn: 0,
          totalServersContributed: 0,
          retired: false,
        });

        return message.reply(
          `Added new owner <@${newOwnerId}> with role **${roleStr}**.`
        );
      }

    case "removeowner":
      if (message.author.id !== "1318158188822138972")
        return noPerm(message, "remove owners");

      {
        const removeOwnerId = String(args[1]);
        if (!removeOwnerId)
          return message.reply("Usage: removeowner <ownerID>");
        if (removeOwnerId === "1318158188822138972")
          return message.reply("You cannot remove the superowner.");

        const currentTeam = await getBotTeam();
        delete currentTeam[removeOwnerId];
        await updateBotTeam(currentTeam);

        await OwnerModel.findOneAndUpdate(
          { ownerId: removeOwnerId },
          { retired: true },
          { new: true }
        );

        return message.reply(`Removed owner ${removeOwnerId}.`);
      }

    // ---------------- NEW: Reload from MongoDB ----------------
    case "reloadowners":
      if (message.author.id !== "1318158188822138972")
        return noPerm(message, "reload the owner list");

      {
        const ownersFromDB = await OwnerModel.find({ retired: false });
        const reloaded = { ...defaultOwners };

        for (const o of ownersFromDB) {
          if (o.ownerId && ownerHierarchy[o.ownerType] !== undefined) {
            reloaded[o.ownerId] = ownerHierarchy[o.ownerType];
          }
        }

        await updateBotTeam(reloaded);
        return message.reply(
          `Reloaded ${ownersFromDB.length} owners from database into local file.`
        );
      }

    default:
      return message.reply("Unknown command or insufficient permissions.");
  }
}

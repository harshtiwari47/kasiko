export function handleLocItems(gameData, location, currentZombies) {
  const items = location.items;
  const finalData = {
    "message": ""
  }

  const itemProbability = Math.random();

  items.forEach((item, index) => {
    if (item.type === "heal" && itemProbability >= 0.80) {
      gameData.health += item.value;
      finalData.message += `\n${item.message}`
    }

    if (item.type === "damage" && itemProbability >= 0.6 && itemProbability <= 0.85) {

      if (currentZombies > 0) {
        gameData.zombiesKilled += currentZombies;
        currentZombies = 0;
        finalData.message += `\n${item.message}`
      } else if (gameData.zombiesKilled < gameData.ZombiesToKill) {
        gameData.zombiesKilled += item.kills;
        gameData.ZombiesToKill = Math.max(0, gameData.ZombiesToKill - item.kills);
        finalData.message += `\n${item.message}`
      }

    }
  });

  finalData.gameData = gameData;
  finalData.currentZombies = currentZombies;

  return finalData;
}
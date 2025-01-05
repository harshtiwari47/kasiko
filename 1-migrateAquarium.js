import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import FishCollection from './models/Fish.js';
import * as DB from './database.js';

dotenv.config(); // Loads .env if you have MONGO_URI or similar

(async function migrateAquarium() {
  try {

    // 2) Query all users
    const users = await User.find();

    // 3) For each user, transform aquaCollection into an array of animals
    for (const user of users) {
      const aquaData = user.toJSON().aquaCollection;
      if (!aquaData) {
        continue; // no aquaCollection to migrate
      }

      // Convert the subdocument structure to an array
      const animalsArray = [];
      for (const fishKey of Object.keys(aquaData)) {
        if (fishKey === "_id") continue;
        console.log(fishKey)
        const fishDetail = aquaData[fishKey];
        if (!fishDetail || !fishDetail.name) {
          continue;
        }
        animalsArray.push({
          name: fishDetail.name,
          level: fishDetail.level,
          animals: fishDetail.animals,
          food: fishDetail.food
        });
      }

      console.log(animalsArray.length)
      let newData;
      // Only create a new Aquarium doc if there's something to store
      if (animalsArray.length > 0) {
        newData = new FishCollection( {
          userId: user.id,
          fishes: animalsArray,
          aquarium: user.aquarium,
          rods: {
            Bamboo: 1,
            Fiberglass: 0,
            Carbon: 0,
            Titanium: 0,
            Neptune: 0
          }
        });
        await newData.save();
      }
    }

    console.log('✅  Aquarium migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌  Error migrating aquarium data:', err);
    process.exit(1);
  }
})();
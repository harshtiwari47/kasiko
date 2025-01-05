import FishCollection from "../../../models/Fish.js";
import redisClient from "../../../redis.js";

export const getUserFishData = async (userId) => {
  try {
    // Attempt to retrieve from Redis cache
    const cachedUser = await redisClient.get(`user:${userId}:fishes`);

    if (cachedUser) {
      // Return a Mongoose document from the cached data
      const userObject = JSON.parse(cachedUser);
      const user = new FishCollection(userObject);
      return user;
    }

    // Fetch from MongoDB
    const user = await FishCollection.findOne({
      userId
    });

    if (user) {
      // Cache the user data in Redis
      await redisClient.set(`user:${userId}:fishes`, JSON.stringify(user.toObject()), {
        EX: 60, // Cache for 1 minute
      });
      return user;
    }

    // If user doesn't exist, create a new one
    const createdUserData = new FishCollection( {
      userId: user.id,
      fishes: [],
      aquarium: [],
      rods: {
        Bamboo: 0,
        Fiberglass: 0,
        Carbon: 0,
        Titanium: 0,
        Neptune: 0
      }
    });

    if (createdUserData) {
      return createdUserData;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const updateFishUser = async (userId, userData) => {
  try {
    if (!userData || !userData.isModified) {
      console.error('Invalid user fish data provided for update.');
      return null;
    }

    // Collect modified fields
    const updates = {};
    userData.modifiedPaths().forEach((path) => {
      updates[path] = userData[path];
    });

    if (Object.keys(updates).length === 0) {
      // No changes to update
      return userData;
    }

    // Perform atomic update using $set
    const updatedUser = await FishCollection.findByIdAndUpdate(
      userData._id,
      {
        $set: updates
      },
      {
        new: true
      }
    );

    if (updatedUser) {
      // Update Redis cache
      await redisClient.set(`user:${userId}:fishes`, JSON.stringify(updatedUser.toObject()), {
        EX: 60, // Cache for 1 minute
      });
    }

    return updatedUser; // Return the updated user
  } catch (error) {
    console.error('Error updating user fish:', error);
    return null;
  }
};

export const getUserData = async (userId) => {
  try {
    // Check external Redis cache
    const cachedUser = await redisClient.get(`user:${userId}`);
    if (cachedUser) {
      const user = User.hydrate(JSON.parse(cachedUser));
      return user;
    }

    // Fetch from the database
    const user = await User.findOne({
      id: userId
    });
    let createdUserData = {
      success: true
    };

    if (!user) {
      createdUserData = await createUser(userId);
    }

    if (!createdUserData.success) {
      console.error('Failed creating new user');
      return null;
    }

    // Cache user data in external Redis
    if (user) {
      await redisClient.set(`user:${userId}`, JSON.stringify(user.toObject()), {
        EX: 180
      }); // Cache for 3 min
    }

    return user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};
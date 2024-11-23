import mongoose from "mongoose";

// Define the Pet Schema
const PetSchema = new mongoose.Schema({
  name: {
    type: String, required: true
  },
  type: {
    type: String, required: true
  },
  level: {
    type: Number, default: 1
    },
    feed: {
      type: Number, default: 0
    },
    lastFeed: {
      type: Number, default: null
    },
    lastWalkTime: {
      type: Number, default: null
    },
    lastExercise: {
      type: Number, default: null
    }, // For tracking exercise times
    lastPlay: {
      type: Number, default: null
    }, // For tracking play times
    exp: {
      type: Number, default: 50
    }, // Experience points
  });

  // Define the UserPet Schema which will contain the user data and their pets
  const UserPetSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        required: true,
      },
      pets: {
        type: [PetSchema], // Array of pets (each pet is an instance of PetSchema)
      default: [{
          name: "kitty", // Default pet name
          type: "cat", // Default pet type
          level: 1,
          feed: 0,
          lastFeed: null,
          lastWalkTime: null,
          lastPatTime: null,
          lastExercise: null,
          exp: 50, // Initial experience points
        },
        ],
      },
      food: {
        type: Number,
      default: 10, // Default food available to the user
      },
      lastFeed: {
        type: Number,
      default: null, // Tracks the time the user last fed a pet
      },
      active: {
        type: Number,
      default: 0,
      }
    },
    {
      timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
    }
  );

  // Create and export the model for UserPets
  const UserPet = mongoose.model('UserPet', UserPetSchema);

  export default UserPet;
import fs from 'fs';
import path from 'path';

const userDatabasePath = path.join(process.cwd(), 'database', 'user.json');

// Ensure the data file exists and is initialized
if (!fs.existsSync(userDatabasePath)) {
    fs.writeFileSync(userDatabasePath, JSON.stringify({}, null, 2));
}

// Helper function to read data from the JSON file
const readUserData = () => {
    const data = fs.readFileSync(userDatabasePath, 'utf-8');
    return JSON.parse(data);
};

// Helper function to write data to the JSON file
const writeUserData = (data) => {
    fs.writeFileSync(userDatabasePath, JSON.stringify(data, null, 2));
};

// Create a new user profile
export const createUser = (userId) => {
    const data = readUserData();
    
    if (data[userId]) {
        return "User already exist!"
    }
    
    const userData = {
        cash: 1000,
        networth: 1000,
        cars: [],
        houses: [],
        joined: new Date().toISOString(),
        dailyReward: null,
        charity: 0,
        trust: 0,
        verified: false
    };
    
    data[userId] = userData;
    writeUserData(data);
    return userData;
};

// Get user data
export const getUserData = (userId) => {
    const data = readUserData();
    
    if (!data[userId]) {
        createUser(userId);
    }
    
    return data[userId];
};

// Update user data (partial update)
export const updateUser = (userId, newData) => {
    const data = readUserData();
    
    if (!data[userId]) {
        createUser(userId);
    }
    
    if (newData.cash < 0) {
      newData.cash = 0;
    } else if (newData.networth < 0) {
      newData.networth = 0;
    }
    
    const updatedData = { ...data[userId], ...newData };
    data[userId] = updatedData;
    writeUserData(data);
    return updatedData;
};

// Delete user data
export const deleteUser = (userId) => {
    const data = readUserData();
    
    if (data[userId]) {
        delete data[userId];
        writeUserData(data);
        return true;
    }
    return false;
};

// Check if user exists
export const userExists = (userId) => {
    const data = readUserData();
    return data.hasOwnProperty(userId);
};
import {
  getUserData,
  updateUser
} from '../../../database.js';

// Function to open a bank account for a user
export const openBankAccount = async (userId) => {
  let userData = await getUserData(userId);

  if (!userData) return null;
  if (userData.bankAccount && !userData.bankAccount.open) {
    if (userData.cash > 1000) {
      userData.cash -= 1000;
      userData.bankAccount.open = true;

      await userData.save();
    }
  }
};

// Function to get a user's bank account details
export const getUserBankDetails = async (userId) => {
  let userData = await getUserData(userId);

  if (!userData) return null;
  if (userData.bankAccount && userData.bankAccount.open) {
    return userData.bankAccount;
  }
  return null;
};

// Function to update a user's bank account details
export const updateBankDetails = async (userId, fields = {}) => {
  let userData = await getUserData(userId);

  if (!userData || !userData.bankAccount || !userData.bankAccount.open) {
    return null;
  }

  // Update the fields in the bankAccount object, only if they are valid
  const allowedFields = ["level",
    "deposit",
    "interest",
    "shield"];
  for (let key of Object.keys(fields)) {
    if (allowedFields.includes(key)) {
      userData.bankAccount[key] = fields[key];
    }
  }

  await userData.save();

  // Return the updated bank account
  return userData.bankAccount;
};
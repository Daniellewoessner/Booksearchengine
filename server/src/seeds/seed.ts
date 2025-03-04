import db from "../config/connection.js";
import cleanDB from "./cleanDB.js";
import User from "../models/User.js";

import bookData from './bookData.json' with {type: "json"};
import userData from './userData.json' with {type: "json"};

db.once('open', async () => {
  try {
    // Clean the User collection
    await cleanDB('User');

    // Insert initial user data
    console.log('Seeding users...');
    const createdUsers = await User.insertMany(userData);
    
    // Add books to each user's savedBooks array
    console.log('Adding books to users...');
    const updatePromises = createdUsers.map(async (user) => {
      // Assign different books to different users (for variety)
      const startIndex = Math.floor(Math.random() * Math.max(1, bookData.length - 3));
      const userBooks = bookData.slice(startIndex, startIndex + 3);
      
      // Update the user with some saved books
      return User.findByIdAndUpdate(
        user._id,
        { $set: { savedBooks: userBooks } },
        { new: true }
      );
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log('Data seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
});
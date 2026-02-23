#!/usr/bin/env node
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Use same connection string as the app (or set MONGO_URI env var)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://yashpawar12122004:KaeUSgv4Letln7rX@crushsphere-location-se.zu98e.mongodb.net/?retryWrites=true&w=majority&appName=crushsphere-location-service';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const col = db.collection('users');

  const cursor = col.find({ $or: [{ uid: { $exists: false } }, { uid: null }] });
  const users = await cursor.toArray();
  console.log('Users needing uid:', users.length);

  for (const u of users) {
    const newUid = uuidv4();
    try {
      await col.updateOne({ _id: u._id }, { $set: { uid: newUid } });
      console.log('Updated user', u._id.toString());
    } catch (err) {
      console.error('Failed to update', u._id.toString(), err.message);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

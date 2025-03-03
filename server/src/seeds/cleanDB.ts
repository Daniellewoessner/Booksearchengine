import models from '../models/index.js';
import db from '../config/connection.js';

export default async (_modelName: keyof typeof models, collectionName: string) => {
    try {
        // Access the database connection directly through db
        if (!db.db) {
            throw new Error('Database connection is not established');
        }
        let modelExists = await db.db.listCollections({
            name: collectionName
        }).toArray();

        if (modelExists.length) {
            await db.dropCollection(collectionName);
            console.log(`Collection ${collectionName} dropped`);
        }
    } catch (err) {
        console.error(`Error cleaning ${collectionName} collection:`, err);
        throw err;
    }
}
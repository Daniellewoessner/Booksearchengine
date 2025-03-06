import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async () => {
  try {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();
    console.log('Apollo Server started successfully');

    const PORT = process.env.PORT || 3001;
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    // Add GraphQL middleware
    app.use('/graphql', expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }) as unknown as express.RequestHandler);

    // Serve static assets in both production and development
    app.use(express.static(path.join(__dirname, '../../client/dist')));
    
    // Handle React routing, return the index.html for all page requests
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });

    // Set up MongoDB connection
    console.log('Connecting to MongoDB...');
    const db = mongoose.connection;
    
    // Handle connection errors
    db.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1); // Exit with failure
    });

    // Start server only after database connection is established
    db.once('open', () => {
      console.log('MongoDB connected successfully');
      
      // Start Express server
      app.listen(PORT, () => {
        console.log(`🌍 API server running on port ${PORT}!`);
        console.log(`📊 Use GraphQL at http://localhost:${PORT}/graphql`);
        console.log(`🖥️ React app available at http://localhost:${PORT}`);
      });
    });

    // Attempt to connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/googlebooks', {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Call the async function to start the server
startApolloServer();
import express, { Request } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define context type
interface ContextType {
  token?: string | undefined;
}

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async (): Promise<void> => {
  try {
    // Initialize Apollo Server first
    const server = new ApolloServer<ContextType>({
      typeDefs,
      resolvers,
    });

    await server.start();
    console.log('Apollo Server started successfully');

    const PORT = process.env.PORT || 3001;
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    // Add GraphQL middleware with proper TypeScript support
    app.use('/graphql', expressMiddleware(server, {
      context: async ({ req }: { req: Request }): Promise<ContextType> => ({ 
        token: req.headers.token as string | undefined 
      }),
    }));

    // Connect to MongoDB first
    console.log('Connecting to MongoDB...');
    try {
      const MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      await mongoose.connect(MONGODB_URI);
      
      console.log('MongoDB connected successfully');
      
      // Log the directory structure to debug path issues
      console.log('Current directory:', __dirname);
      console.log('Static files path:', path.join(__dirname, '../../client/dist'));
      
      // First check if the client/dist directory exists
      try {
        const staticPath = path.join(__dirname, '../../client/dist');
        console.log('Attempting to serve static files from:', staticPath);
        
        // Serve static assets with explicit Cache-Control headers
        app.use(express.static(staticPath, {
          maxAge: '1h',
          setHeaders: (res, filePath) => {
            // Set appropriate cache headers
            if (filePath.endsWith('.html')) {
              // Don't cache HTML files
              res.setHeader('Cache-Control', 'no-cache');
            } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico)$/)) {
              // Cache JS/CSS/image files
              res.setHeader('Cache-Control', 'public, max-age=3600');
            }
          }
        }));
        
        // Handle React routing with explicit content type
        app.get('*', (_req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.sendFile(path.join(staticPath, 'index.html'));
        });
      } catch (err) {
        console.error('Error serving static files:', err);
      }
      
      // Start Express server
      app.listen(PORT, () => {
        console.log(`🌍 API server running on port ${PORT}!`);
        console.log(`📊 Use GraphQL at http://localhost:${PORT}/graphql`);
        console.log(`🖥️ React app available at http://localhost:${PORT}`);
      });
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Call the async function to start the server
startApolloServer();
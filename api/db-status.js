// Direct MongoDB connection check API
import mongoose from 'mongoose';

export default async function handler(req, res) {
  // Set CORS headers to allow access from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      return res.status(500).json({
        success: false,
        message: 'MongoDB URI is not configured',
        timestamp: new Date().toISOString()
      });
    }

    // Mask sensitive information in the connection string
    const maskedUri = mongoUri.replace(/(\/\/[^:]+:)[^@]+(@)/, '$1*****$2');
    
    // Get current connection status
    let connectionState = 'disconnected';
    if (mongoose.connection.readyState) {
      connectionState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
    }

    // If already connected, return the status
    if (mongoose.connection.readyState === 1) {
      return res.status(200).json({
        success: true,
        message: 'Already connected to MongoDB',
        connectionState,
        maskedUri,
        timestamp: new Date().toISOString()
      });
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    // Get database information
    const dbName = mongoose.connection.db.databaseName;
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to MongoDB',
      data: {
        connectionState: 'connected',
        maskedUri,
        dbName,
        collections: collections.map(c => c.name),
        stats: {
          collections: collections.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB',
      error: {
        message: error.message,
        code: error.code,
        name: error.name
      },
      timestamp: new Date().toISOString()
    });
  } finally {
    // Close the connection if it was opened in this request
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

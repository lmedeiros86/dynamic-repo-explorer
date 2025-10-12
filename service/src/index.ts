// Import the Express app instance from app.ts
import { app } from './app.js';
// Import dotenv for environment variable configuration
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set the server port from environment variables or default to 3000
const PORT = process.env.PORT || 3001;

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
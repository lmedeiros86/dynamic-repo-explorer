import { cleanEnv, str, num, makeValidator, type CleanOptions } from 'envalid';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Debug log environment variables
console.log('Loaded environment variables:');
console.log({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '***' : 'Not set',
  CACHE_TTL: process.env.CACHE_TTL
});

// Custom validator for comma-separated origins
const origins = makeValidator((s) => {
  if (!s) return [];
  const origins = s.split(',').map(origin => origin.trim());
  if (origins.some(origin => !origin)) {
    throw new Error('Invalid origin format. Use comma-separated URLs');
  }
  return origins;
});

let env;

try {
  env = cleanEnv(process.env, {
    // Server Configuration
    NODE_ENV: str({
      choices: ['development', 'test', 'production'],
      default: 'development',
      desc: 'Node environment',
    }),
    PORT: num({
      default: 3001,
      desc: 'Port to run the server on',
    }),
    
    // CORS Configuration
    ALLOWED_ORIGINS: origins({
      default: ['http://localhost:3000'],
      desc: 'Comma-separated list of allowed origins',
    }),
    
    // GitHub API Configuration
    GITHUB_TOKEN: str({
      desc: 'GitHub Personal Access Token with repo and user scopes',
      docs: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
    }),
    
    // Cache Configuration
    CACHE_TTL: num({
      default: 300, // 5 minutes
    }),
  });
} catch (error) {
  console.error('Error validating environment variables:', error);
  process.exit(1);
}

export default env!;

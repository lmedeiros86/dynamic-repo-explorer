import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const testGitHub = async () => {
  const owner = 'facebook';
  const token = process.env.GITHUB_TOKEN;
  
  console.log('Testing GitHub API access...');
  console.log('GITHUB_TOKEN:', token ? '*** (exists)' : 'NOT FOUND');
  
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'dynamic-repo-explorer'
    };
    
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    const url = `https://api.github.com/users/${owner}/repos?per_page=1`;
    console.log('Making request to:', url);
    
    const response = await axios.get(url, { 
      headers,
      validateStatus: () => true // Don't throw on HTTP errors
    });
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    
    if (response.headers['x-ratelimit-remaining']) {
      console.log('\nRate Limit Info:');
      console.log('Remaining requests:', response.headers['x-ratelimit-remaining']);
      console.log('Limit:', response.headers['x-ratelimit-limit']);
      console.log('Reset time:', new Date(response.headers['x-ratelimit-reset'] * 1000).toLocaleString());
    }
    
    if (response.status === 200) {
      console.log('\nSuccess! First repository:', response.data[0]?.name);
    } else {
      console.log('\nError Response:', response.data);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testGitHub();

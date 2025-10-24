import express from 'express';
import fetch from 'node-fetch';
const app = express();
const PORT = 3001;
import {callServiceWithCircuitBreaker} from './circuitBreaker.js';

const PROFILE_SERVICE_URL = 'http://localhost:3000';

app.get('/post/:id', async (req, res) => {
  try {
    const post = { 
      id: req.params.id, 
      title: 'My Awesome Post', 
      authorId: '123' 
    };
   
    const fetchProfile = async () => {
      console.log('Attempting to call Profile Service...');
      const response = await fetch(`http://localhost:3000/profile/${post.authorId}`);
      if (!response.ok) {
   
        throw new Error(`Profile Service returned status ${response.status}`);
      }
      return response.json();
    };


    const profile = await callServiceWithCircuitBreaker('profileService', fetchProfile);

    res.json({ ...post, authorName: profile.name });
  } catch (error) {
    console.error('Final error handler:', error.message);
    res.status(503).json({ 
        error: 'Service temporarily unavailable.', 
        reason: error.message 
    });
  }
});

app.listen(PORT, () => console.log(`Post Service listening on port ${PORT}`));
import express from 'express';
import fetch from 'node-fetch';
const app = express();
const PORT = 3001;

const PROFILE_SERVICE_URL = 'http://localhost:3000';

app.get('/post/:id', async (req, res) => {
  try {
    console.log(`Post Service: Fetching post ${req.params.id}`);
    const post = {
      id: req.params.id,
      title: 'A Great Post',
      content: 'Some interesting content here.',
      authorId: '123',
    };

    console.log('Post Service: Calling Profile Service for author info...');
    const profileResponse = await fetch(`${PROFILE_SERVICE_URL}/profile/${post.authorId}`);

    if (!profileResponse.ok) {
        throw new Error('Profile Service returned an error.');
    }

    const profile = await profileResponse.json();

 
    res.json({ ...post, authorName: profile.name });

  } catch (error) {
    console.error('Post Service: Error fetching post or profile:', error.message);
    res.status(500).json({ error: 'Failed to get post details.' });
  }
});

app.listen(PORT, () => {
  console.log(`Post Service listening on port ${PORT}`);
});
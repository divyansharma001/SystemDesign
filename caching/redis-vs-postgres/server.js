import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { client, connectRedis } from './redis.js';
import { postgresDB } from './postgres.js';

const app = express();

app.use(express.json());


await connectRedis();


app.post('/cache', async (req, res)=>{
    const  {key, value} = req.body;

    try {
        const startTime = Date.now();
        await client.set(key, value);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`key-value pair cached successfully in ${duration}ms`);
        
        return res.status(200).json({
            message: 'Key-value pair cached successfully',
            timing: `${duration}ms`
        })
    } catch (error) {
        throw new Error('Error caching key-value pair: ' + error.message);        
    }
})

app.get('/cache/:key', async (req, res) => {
  const { key } = req.params;

  if (!key) {
    return res.status(400).json({ error: 'Key parameter is required.' });
  }

  try {
    const startTime = Date.now();
    const value = await client.get(key);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (value !== null) {
      console.log(`Redis GET for key="${key}", value="${value}" in ${duration}ms`);
      return res.status(200).json({
        message: 'Key found',
        value: value,
        timing: `${duration}ms`
      });
    } else {
      console.log(`Redis GET for key="${key}" returned null in ${duration}ms`);
      return res.status(404).json({
        message: 'Key not found',
        timing: `${duration}ms`
      });
    }
  } catch (error) {
    console.error('Error retrieving key from Redis:', error);
    return res.status(500).json({ error: 'Error retrieving key' });
  }
});



app.post('/users', async(req, res)=>{
    try {

        const {name, email} = req.body; // Added email to destructuring

        if(!name || !email){ // Added email validation
           throw new Error(`All fields are required`)
        }

        const startTime = Date.now();
        const newUsers = await postgresDB`
        INSERT INTO users(name, email)
        VALUES(${name}, ${email})
        RETURNING *`
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`User created in database in ${duration}ms`);

        res.json({
            user: newUsers[0],
            message: "User created in the database",
            dbTiming: `${duration}ms`
        })
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            error: "Failed to create user"
        })
    }
})

app.get('/users/:id', async(req, res)=>{
    try {
        const userId = parseInt(req.params.id);
        
        const startTime = Date.now();
        const users = await postgresDB`SELECT * FROM users WHERE id=${userId}`
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if(users.length==0){
            console.log(`User not found in  database in ${duration}ms`);
            return res.status(404).json({
                error: "User not found",
                dbTiming: `${duration}ms`
            })
        }

        console.log(`User retrieved from database in ${duration}ms`);
        
        res.status(200).json({
            user: users[0],
            message: "Read data from database",
            dbTiming: `${duration}ms`
        })
    } catch (error) {
        console.error("Error getting user", error)
        res.status(500).json({
            error: "Failed to get users"
        })
    }
})

app.get('/health', (req, res)=>{
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString()
    });
})

app.listen(3000, ()=>{
    console.log('Server is running on port 3000');
})
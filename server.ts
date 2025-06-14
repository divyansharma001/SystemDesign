import express from 'express';
import { Pool } from 'pg';
import postgres from 'postgres';
import { masterDB, replicaDB } from './db';

const app = express();
app.use(express.json());

interface User{
    id: number;
    name: string;
    email: string;
}

//read operations (for this we'll use the replica database)

app.get('/users', async(req, res)=>{
    try {
        console.log('Reading from replica database');
        const users = await replicaDB`SELECT * FROM users`;
        res.status(200).json({
            users,
            message:"Read data from Replica Database"
        })
    } catch (error) {
        console.error("Error getting users", error);
        res.status(500).json({
            error: "Failed to get users"
        })
    }
})

app.get('/users/:id', async(req, res)=>{
    try {
        console.log("Reading from Replica database");
        const userId = parseInt(req.params.id);
        const users = await replicaDB`SELECT * FROM users WHERE id=${userId}`
        if(users.length==0){
             res.status(404).json({
                error: "User not found"
            })
        }

       res.status(200).json({
            user: users[0],
            message: "Read data from replica database"
        })
    } catch (error) {
        console.error("Error getting user", error)
        res.status(500).json({
            error: "Failed to get users"
        })
    }
})


//Write operations - For this we'll use Master Database

app.post('/users', async(req, res)=>{
    try {
        console.log("Writing to Master database");

        const {name, email} = req.body;

        if(!name || !email){
           throw new Error(`All fields are required`)
        }

        const newUsers = await masterDB`
        INSERT INTO users(name, email)
        VALUES(${name}, ${email})
        RETURNING *
        `

        res.json({
            user: newUsers[0],
            message: "User created in the database"
        })
    } catch (error) {
        
    }
})


app.put('/users/:id', async (req, res) => {
  try {
    console.log('Writing to MASTER database')
    const userId = parseInt(req.params.id)
    const { name, email } = req.body
    
    if (!name || !email) {
      throw new Error("Name and email are required")
    }
    
    const updatedUsers = await masterDB`
      UPDATE users 
      SET name = ${name}, email = ${email} 
      WHERE id = ${userId} 
      RETURNING *
    `
    
    if (updatedUsers.length === 0) {
      throw new Error("User not found")
    }
    
    res.json({
      user: updatedUsers[0],
      message: 'User updated in MASTER database'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

app.delete('/users/:id', async (req, res) => {
  try {
    console.log('Writing to MASTER database')
    const userId = parseInt(req.params.id)
    
    const deletedUsers = await masterDB`
      DELETE FROM users 
      WHERE id = ${userId} 
      RETURNING *
    `
    
    if (deletedUsers.length === 0) {
      throw new Error("No users to delete")
    }
    
    res.json({
      message: 'User deleted from MASTER database',
      deletedUser: deletedUsers[0]
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

app.get('/health', async (req, res) => {
  try {
    //Test master connection
    await masterDB`SELECT 1 as test`
    console.log('Master DB connected')
    
    //Test replica connection
    await replicaDB`SELECT 1 as test`
    console.log('Replica DB connected')
    
    res.json({
      status: 'healthy',
      master: 'connected',
      replica: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(500).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('Read operations use REPLICA database')
  console.log('Write operations use MASTER database')
})

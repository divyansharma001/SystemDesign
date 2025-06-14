import express from 'express';
import { Pool } from 'pg';
import postgres from 'postgres';
import { replicaDB } from './db';

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




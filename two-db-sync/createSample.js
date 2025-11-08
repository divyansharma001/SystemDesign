//The purpose of this file is to create sample schema and seed data to MASTER database

import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const {Client} = pkg;

async function main(){

    const client = new Client({
        connectionString: process.env.DATABASE_URL_MASTER,
    })

    try{
        await client.connect();
        console.log('Connected to MASTER database');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
            )`)

        await client.query(`
            CREATE TABLE IF NOT EXISTS posts(
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) on DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            body TEXT,
            created_at TIMESTAMP DEFAULT NOW()
            );`)

        await client.query(`
            INSERT INTO users (name, email)
            VALUES
            ('Divyansh', 'connectwithdivyansharma@gmail.com'),
            ('User', 'user@gmail.com')
            ON CONFLICT DO NOTHING;
            `);

       await client.query(`
            INSERT INTO posts (user_id, title, body)
            VALUES
            ( (SELECT id FROM users WHERE email='connectwithdivyansharma@gmail.com'), 'Hello', 'First post by Divyansh' ),
            ( (SELECT id FROM users WHERE email='user@gmail.com'), 'Hi', 'First post by User' )
            ON CONFLICT DO NOTHING;
            `);

     console.log('Sample schema and data created in MASTER database');


    }catch(err){
        console.error('Error executing query', err.stack);
    }

}

main();
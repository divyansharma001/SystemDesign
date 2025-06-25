import postgres from 'postgres'
import dotenv from 'dotenv'
dotenv.config()

const postgesConnectionString = process.env.POSTGRES_DATABASE_URL

if(!postgesConnectionString) {
  throw new Error('POSTGRES_DATABASE_URL environment variable is not set')
}

export const postgresDB = postgres(postgesConnectionString)
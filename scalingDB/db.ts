import postgres from 'postgres'
import dotenv from 'dotenv'
dotenv.config()

const masterConnectionString = process.env.MASTER_DATABASE_URL
if (!masterConnectionString) {
  throw new Error('MASTER_DATABASE_URL environment variable is not set')
}
export const masterDB = postgres(masterConnectionString)


const replicaConnectionString = process.env.REPLICA_DATABASE_URL

if(!replicaConnectionString) {
  throw new Error('REPLICA_DATABASE_URL environment variable is not set')
}

export const replicaDB = postgres(replicaConnectionString)





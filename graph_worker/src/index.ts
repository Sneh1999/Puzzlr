import dotenv from "dotenv";
import { GraphListener } from "./GraphListener";

dotenv.config();

if (!process.env.SUBGRAPH_URL) {
  console.error(`Missing environment variable: SUBGRAPH_URL`);
  process.exit(1);
}

if (!process.env.HASURA_URL) {
  console.error(`Missing environment variable: HASURA_URL`);
  process.exit(1);
}

if (!process.env.HASURA_ADMIN_SECRET) {
  console.error(`Missing environment variable: HASURA_ADMIN_SECRET`);
  process.exit(1);
}

if (!process.env.POLL_INTERVAL) {
  console.error(`Missing environment variable: POLL_INTERVAL`);
  process.exit(1);
}

if (!process.env.PIECE_FACTORY_ADDRESS) {
  console.error(`Missing environment variable: PIECE_FACTORY_ADDRESS`);
  process.exit(1);
}

if (!process.env.PRIZE_FACTORY_ADDRESS) {
  console.error(`Missing environment variable: PRIZE_FACTORY_ADDRESS`);
  process.exit(1);
}

const graphListener = new GraphListener("db.json");

console.log("Starting graphListener");

graphListener.poll();

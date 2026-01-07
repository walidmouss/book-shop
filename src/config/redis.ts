import Redis from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL);

/////// this is just for testing purposes and will be removed//////
await redis.set("test", "Hello Redis");
const value = await redis.get("test");
console.log(value); // Should print "Hello Redis"
//////////////////////////////////////////////////////////////////

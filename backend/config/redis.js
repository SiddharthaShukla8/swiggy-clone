const { Redis } = require("@upstash/redis");
const dotenv = require("dotenv");

dotenv.config();

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const connectRedis = async () => {
    try {
        // Upstash Redis is stateless (HTTP), so "connecting" is just verifying
        const ping = await redis.ping();
        if (ping === "PONG") {
            console.log("Redis connected successfully via Upstash !!");
        }
    } catch (error) {
        console.error("Redis connection FAILED ", error);
    }
};

module.exports = {
    redis,
    connectRedis
};

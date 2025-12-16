if (process.env.NODE_ENV === 'test') {
    const store = new Map();
    const timeouts = new Map();

    const redisMock = {
        async set(key, value, mode, duration) {
            // support set(key, value) and set(key, value, 'EX', seconds)
            store.set(key, String(value));
            if (mode === 'EX' && duration) {
                if (timeouts.has(key)) clearTimeout(timeouts.get(key));
                const t = setTimeout(() => store.delete(key), duration * 1000);
                timeouts.set(key, t);
            }
            return 'OK';
        },
        async get(key) {
            return store.has(key) ? store.get(key) : null;
        },
        async del(key) {
            return store.delete(key) ? 1 : 0;
        },
        async expire(key, seconds) {
            if (!store.has(key)) return 0;
            if (timeouts.has(key)) clearTimeout(timeouts.get(key));
            const t = setTimeout(() => store.delete(key), seconds * 1000);
            timeouts.set(key, t);
            return 1;
        },
        on() {},
    };

    module.exports = redisMock;
} else {
    const { Redis } = require('ioredis');

    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    });

    redis.on('connect', () => {
        console.log('Connected to Redis');
    });

    module.exports = redis;
}
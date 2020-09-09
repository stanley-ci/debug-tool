
const redis = require('ioredis');
require('dotenv').config();

const { REDIS_HOST, REDIS_PORT, REDIS_TRANS_TOKEN_KEY } = process.env;


const redisCli = new redis.Cluster(
    [
        {
            host: REDIS_HOST,
            port: REDIS_PORT,
        },
    ],
    {
        dnsLookup: (address, callback) => callback(null, address),
        redisOptions: {
            tls: !process.env.REDIS_TLS ? null : {},
            password: process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD : null,
        },
    }
);

redisCli.on("error", function (error) {
    console.error({ title: 'redis error', error: error.stack });
});

redisCli.on('connect', function () {
    redisCli.connected = false;
    const tId = setTimeout(() => {
        console.error({ title: 'redis connecting failed!' });
    }, 1000);

    redisCli.ping(err => {
        clearTimeout(tId);
        if (err) {
            console.error({ title: 'redis connecting error!' });
            return;
        }
        redisCli.connected = true;
        console.info({ title: 'redis connected successfully!' });
        command();
    });
});

function command() {
    const cmd = process.argv[2];
    console.log("您输入的命令:", cmd);
    if (cmd === 'show') {
        keys();
    } else if (cmd === 'clear') {
        clearRedis();
    }
    process.exit(0);
}

function keys() {
    if (!redisCli.connected) {
        console.error('redis disconnectied!');
        return false;
    }
    redisCli.keys('PAY*', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('keys PAY*', data);
    });


    redisCli.lrange(REDIS_TRANS_TOKEN_KEY, 0, -1, (err, data) => {
        if (err || data.length < 3) {
            console.error({ title: 'redis token get error:', err, data });
            return;
        }

        const [, expires_in, created, desc] = data;
        const isExpired = Date.now() / 1000 - created > expires_in - 60;
        console.log({ title: 'access token', isExpired, expires_in, created, desc })
    });

}

function clearRedis() {
    if (!redisCli.connected) {
        console.error('redis disconnectied!');
        return false;
    }
    redisCli.del(REDIS_TRANS_TOKEN_KEY, (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log('keys PAY*');
    });
}

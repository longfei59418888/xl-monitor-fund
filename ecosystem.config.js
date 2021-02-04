module.exports = {
    apps: [{
        name: 'monitor-fund',
        script: './www/index.js',
        watch: '.',
        env_production: {
            NODE_ENV: 'production'
        },
    }],
    deploy: {
        production: {
            user: 'root',
            host: '42.192.156.205',
            ref: 'origin/master',       //Git远程/分支
            repo: 'git@github.com:longfei59418888/xl-monitor-fund.git',
            path: '/home/items/monitor-fund',
            "post-deploy": 'npm install && pm2 startOrRestart ecosystem.config.js'
        }
    },
}

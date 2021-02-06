const Koa = require('koa')
const path = require('path')
const views = require('koa-views')
const staticFiles = require('koa-static')
const router = require('koa-router')()
const BodyParser = require('koa-bodyparser');
const {run, refresh} = require('../libs/funds.js')
const nhg = require('../libs/nhg.js')

const bodyparser = new BodyParser();
const app = new Koa()

app.use(bodyparser);
app.use(staticFiles(path.resolve(__dirname, "../public/")))

// 加载模板引擎
app.use(views(path.join(__dirname, '../tpl'), {
    extension: 'ejs',
}))

// 列表信息展示
router.get('/list', async (ctx, next) => {
    const data = await run()
    await ctx.render('list', {
        ...data
    })
})

router.get('/nhg', async (ctx, next) => {
    const list = await nhg.getList()
    await ctx.render('nhg', {
        list
    })
})
router.post('/nhg/:option', async (ctx, next) => {
    const {params, body} = ctx.request
    const {option} = params;
    const {price, time} = body;
    if (option === 'del') await nhg.delList({
        time,
        price
    })
    if (option === 'add') await nhg.addList({
        time,
        price
    })
    ctx.set("Content-Type", "application/json")
    ctx.body = JSON.stringify({})
})

router.post('/refresh/:code', async (ctx, next) => {
    const {params} = ctx.request
    const {code} = params;
    await refresh(code)
    ctx.set("Content-Type", "application/json")
    ctx.body = JSON.stringify({})
})

app.use(router.routes(), router.allowedMethods())
app.listen(8001, () => {
    console.log('start')
})

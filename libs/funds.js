const axios = require('axios')
const cheerio = require('cheerio')
const schedule = require('node-schedule');

const option = function (value, fmt) {
    if (!value) return ''
    try {
        if (type === 'filter') value = value.replace(/-/g, '/')
        const date = new Date(value)
        const o = {
            'M+': date.getMonth() + 1, // 月份
            'd+': date.getDate(), // 日
            'h+': date.getHours(), // 小时
            'm+': date.getMinutes(), // 分
            's+': date.getSeconds(), // 秒
            'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
            'S': date.getMilliseconds() // 毫秒
        }
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
        }
        for (const k in o) {
            if (new RegExp('(' + k + ')').test(fmt)) {
                // eslint-disable-next-line
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
            }
        }
        return fmt
    } catch (e) {
        return ''
    }
}

let CACHE = {}
let LENGTH = 200
schedule.scheduleJob({hour: 0, minute: 1, dayOfWeek: [1, 2, 3, 4, 5]}, function () {
    CACHE = {}
    run()
});

async function run() {
    if (CACHE[LENGTH]) return CACHE[LENGTH]
    const date = option(new Date(), 'YYYY-MM-dd')
    const time = Math.random()
    const url = `http://fund.eastmoney.com/data/rankhandler.aspx?op=ph&dt=kf&ft=gp&rs=&gs=0&sc=3yzf&st=desc&sd=${date}&ed=${date}&qdii=&tabSubtype=,,,,,&pi=1&pn=${LENGTH}&dx=1&v=${time}`
    let data = await getList(url)
    if (data) {
        data = await getMap(data)
        let totals = {}, scales = {}
        data.forEach(item => {
            const {total, list} = item
            if (list && list.length > 0) {
                list.forEach(current => {
                    const {target, scale} = current
                    if (!scales[target]) {
                        scales[target] = parseFloat(scale + '')
                    } else {
                        scales[target] += parseFloat(scale + '')
                    }
                    if (!totals[target]) {
                        totals[target] = parseFloat(scale + '') * parseFloat(total)
                    } else {
                        totals[target] += parseFloat(scale + '') * parseFloat(total)
                    }
                })
            }
        })
        const totalList = []
        for (let item in totals) {
            totalList.push({
                name: item,
                value: totals[item].toFixed(2)
            })
        }
        const scaleList = []
        for (let item in scales) {
            scaleList.push({
                name: item,
                value: scales[item].toFixed(2)
            })
        }

        function sort(a) {
            let b = null
            for (let i = 0; i < a.length; i++) {
                for (let j = 0; j < a.length; j++) {
                    if (a[j + 1] && parseFloat(a[j].value) < parseFloat(a[j + 1].value)) {
                        b = a[j]
                        a[j] = a[j + 1]
                        a[j + 1] = b
                    }
                }
            }
        }

        sort(totalList)
        sort(scaleList)
        CACHE[LENGTH] = {
            totalList,
            scaleList
        }
        return {
            totalList,
            scaleList
        }
    }
    return {
        totalList: [],
        scaleList: []
    }

}

async function getList(url) {
    return axios({
        url,
        method: "get",
        headers: {
            'Cookie': 'em_hq_fls=js; intellpositionL=927px; cowminicookie=true; emshistory=%5B%22(300562)(%E4%B9%90%E5%BF%83%E5%8C%BB%E7%96%97)%22%2C%22002812%22%2C%22000338%22%2C%22%E5%9B%BD%E9%99%85%E5%8C%BB%E5%AD%A6%22%2C%22(600089)(%E7%89%B9%E5%8F%98%E7%94%B5%E5%B7%A5)%22%2C%22%E4%B8%AD%E5%85%AC%E6%95%99%E8%82%B2%22%2C%22600371%22%5D; HAList=a-sz-300059-%u4E1C%u65B9%u8D22%u5BCC%2Ca-sh-600745-%u95FB%u6CF0%u79D1%u6280%2Ca-sz-002812-%u6069%u6377%u80A1%u4EFD%2Ca-sh-600585-%u6D77%u87BA%u6C34%u6CE5%2Ca-sz-002607-%u4E2D%u516C%u6559%u80B2%2Ca-sz-000516-%u56FD%u9645%u533B%u5B66%2Ca-sz-000338-%u6F4D%u67F4%u52A8%u529B%2Ca-sh-600089-%u7279%u53D8%u7535%u5DE5%2Ca-sh-601012-%u9686%u57FA%u80A1%u4EFD%2Ca-sz-000998-%u9686%u5E73%u9AD8%u79D1%2Ca-sh-600371-%u4E07%u5411%u5FB7%u519C; intellpositionT=2955px; qgqp_b_id=32105e1e6977ea818f64289341d1b597; waptgshowtime=202124; st_si=19704302060477; st_asi=delete; _adsame_fullscreen_16928=1; ASP.NET_SessionId=hhqva5yjkxc5idzcwfuv2oh1; st_pvi=50417320194642; st_sp=2020-06-01%2011%3A43%3A52; st_inirUrl=http%3A%2F%2Ffinance.eastmoney.com%2Fa%2F202005311503985557.html; st_sn=8; st_psi=20210204111911608-0-1611325173',
            'Referer': 'http://fund.eastmoney.com/data/fundranking.html',
            'Host': 'fund.eastmoney.com',
            'Accept': '*/*',
        }
    }).then((rst) => {
        eval(rst.data)
        if (rankData) {
            return rankData.datas
        }
        return null
    })
}


async function getMap(data) {

    let index = 0
    const list = []
    while (data[index]) {
        let item = data[index]
        item = item.split(',')
        const code = item[0]
        const name = item[1]
        const extra = await getInfo(code)
        list.push({
            ...extra,
            code,
            name
        })
        index++
    }
    return list
}

async function getInfo(code) {
    return axios.get(`http://fund.eastmoney.com/${code}.html`).then(rst => {
        const $ = cheerio.load(rst.data);
        let total = $('.infoOfFund tbody tr:first-child td:nth-child(2)').text().split('：')[1] || ''
        total = (new RegExp('^((\d|.)+?)((亿元)|元).+')).exec(total)
        if (total) total = total[1]
        const list = []
        $('#position_shares .ui-table-hover tbody tr').each((index, item) => {
            let target = $(item).find('td:first-child a')
            let scale = $(item).find('td:nth-child(2)')
            if (target) {
                target = target.text()
                scale = scale.text()
            }
            if (target) {
                list.push({
                    target,
                    scale
                })
            }
        })
        return {
            total,
            list
        }
    })
}

module.exports = {
    run,
    refresh: async (value) => {
        if (value) LENGTH = parseInt(value)
        CACHE = {}
    },
}

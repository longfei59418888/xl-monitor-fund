const axios = require('axios')
const cheerio = require('cheerio')
const schedule = require('node-schedule');
const LIST = require('../configs/metals')
run()

async function run() {
    let index = 0;
    const results = []
    while (LIST[index]) {
        const {code, name, list} = LIST[index]
        const lists = await getList(`http://app.ometal.cn/data/month_data.asp?pid=${code}`)
        const rst = deal(lists)
        if (rst) {
            const html = `http://app.ometal.cn/data/month_data.asp?pid=${code}`
            console.log(name, list, html, JSON.stringify(rst))
            results.push({
                name,
                rst,
                list,
                html
            })
        }
        index++
    }
    return results
}

async function getList(url) {
    return axios({
        url,
        method: "get",
    }).then((rst) => {
        const $ = cheerio.load(rst.data);
        const tableTr = $('table[cellpadding="4"] tr') || []
        const list = []
        tableTr.each((index, item) => {
            if (index != 0) {
                const td = $(item).find('td')[2]
                const value = td.firstChild.nodeValue
                list.push(value)
            }
        })
        return list
    })
}

function deal(list) {
    const rst = []
    list = [...list].reverse()
    while (list.length > 1) {
        const today = parseFloat(list.shift())
        const item = parseFloat(list[0])
        rst.push(parseFloat(((today - item) * 100 / item).toFixed(2)))
    }
    if (rst[0] > 0 && rst[1] > 0 && rst[2] > 0 && (rst[0] + rst[1] + rst[2]) > 2) return rst
    else return null
}

module.exports = run

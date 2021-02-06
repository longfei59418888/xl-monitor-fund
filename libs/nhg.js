const fs = require('fs-extra')
const path = require('path')

async function getList() {
    let featureList = []
    const lists = await fs.readJson(path.join(__dirname, '../data/nhg.json'))
    for (let item in lists) {
        const time = new Date(item).getTime()
        if (time > new Date().getTime() - 24 * 60 * 60 * 1000) {
            const total = lists[item].reduce((a, b) => a / 1 + b / 1, 0)
            featureList.unshift({
                time,
                item,
                total,
                value: lists[item]
            })
        }
    }
    sort(featureList)
    return featureList
}

async function delList(param) {
    const {time, price} = param
    const lists = await fs.readJson(path.join(__dirname, '../data/nhg.json'))
    if (price) {
        const index = lists[time].indexOf(price)
        lists[time].splice(index, 1)
    } else {
        delete lists[time]
    }
    await fs.writeJson(path.join(__dirname, '../data/nhg.json'), lists)
    return true
}

async function addList(param) {
    const {time, price} = param
    let lists = await fs.readJson(path.join(__dirname, '../data/nhg.json'))
    if (!lists[time]) lists[time] = [price]
    else lists[time].push(price)
    await fs.writeJson(path.join(__dirname, '../data/nhg.json'), lists)
    return true
}

function sort(a) {
    let b = null
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a.length; j++) {
            if (a[j + 1] && parseFloat(a[j].time) > parseFloat(a[j + 1].time)) {
                b = a[j]
                a[j] = a[j + 1]
                a[j + 1] = b
            }
        }
    }
}

module.exports = {
    getList,
    addList,
    delList
}

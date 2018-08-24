const hitbtc = require('hitbtc-node-api/src/WebsocketClient')
const other = require('../other')
const sqlExport = require('../sqlExport')
const client = new hitbtc.webSocket()
const exchange = 'hitbtc'
let sql = ''
let nodetime = ''

function connect(sqlclient){
    sql = sqlclient
    client.connect();
}
let massOfAsks = []
let massOfBids = []

client.on('open', ()=>{
    client.subscribeTrades('BTCUSD')
    client.subscribeOrderBook('BTCUSD')
})

client.on('message', (data)=>{
    if (data.method === 'updateTrades') {
        data.params.data.forEach((trade)=>{
            let tradeOb = {
                ticker: 'BTCUSD',
                price: trade.price,
                amount: trade.quantity,
                type: trade.side.toUpperCase()
            }
            let nodetime = new Date().toISOString()
            sqlExport.sendTrade(tradeOb, sql, exchange, nodetime)
        })
    }
    if (data.method === 'snapshotOrderbook') {
        for (let i=0; i<=100; i++){
            massOfAsks.push({
                ticker: 'BTCUSD',
                price: data.params.ask[i].price,
                amount: data.params.ask[i].size,
                type: 'SELL',
                number: 0
            })
            massOfBids.push({
                ticker: 'BTCUSD',
                price: data.params.bid[i].price,
                amount: data.params.bid[i].size,
                type: 'BUY',
                number: 0
            })
        }
    }
    if (data.method === 'updateOrderbook') {
        data.params.ask.forEach((elem)=> {
            if (elem.size === 0) {
                massOfAsks = massOfAsks.filter((el) => el.price !== elem.price)
            } else {
                let found = massOfAsks.filter((el) => el.price === elem.price)
                if (found.length !== 0) {
                    found[0].amount = elem.size

                    massOfAsks = massOfAsks.filter((el) => el.price !== found[0].price)
                    massOfAsks.push({
                        ticker: 'BTCUSD',
                        price: found[0].price,
                        amount: found[0].amount,
                        type: 'SELL',
                        number: 0
                    })
                }
                else {
                    massOfAsks.push({
                        ticker: 'BTCUSD',
                        price: elem.price,
                        amount: elem.size,
                        type: 'SELL',
                        number: 0
                    })
                }
            }
        })
        data.params.bid.forEach((elem)=> {
            if (elem.size === 0) {
                massOfBids = massOfBids.filter((el) => el.price !== elem.price)
            } else {
                let found = massOfBids.filter((el) => el.price === elem.price)
                if (found.length !== 0) {
                    found[0].amount = elem.size

                    massOfBids = massOfBids.filter((el) => el.price !== found[0].price)
                    massOfBids.push({
                        ticker: 'BTCUSD',
                        price: found[0].price,
                        amount: found[0].amount,
                        type: 'BUY',
                        number: 0
                    })
                }
                else {
                    massOfBids.push({
                        ticker: 'BTCUSD',
                        price: elem.price,
                        amount: elem.size,
                        type: 'BUY',
                        number: 0
                    })
                }
            }
        })
        massOfBids.sort(sortAlgRevert)
        massOfAsks.sort(sortAlg)
        massOfBids = massOfBids.slice(0, 26)
        massOfAsks = massOfAsks.slice(0, 26)
        nodetime = new Date().toISOString()
        Object.keys(massOfBids).forEach((key)=>{
            massOfBids[key].number = parseInt(key) + 1
            sqlExport.sendOrderbook(massOfBids[key], sql, exchange, nodetime)
        })
        Object.keys(massOfAsks).forEach((key)=>{
            massOfAsks[key].number = parseInt(key) + 1
            sqlExport.sendOrderbook(massOfAsks[key], sql, exchange, nodetime)
        })
    }
})

client.on('close',() => {
    other.makeLog('hitbtc ws disconnect')
    client.connect();
})

function sortAlg(a, b) {
    if (a.price > b.price) return 1;
    if (a.price < b.price) return -1;
}

function sortAlgRevert(a, b) {
    if (a.price > b.price) return -1;
    if (a.price < b.price) return 1;
}

module.exports.connect = connect



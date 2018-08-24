
const BFX = require('bitfinex-api-node');
const other = require('../other')
const sqlExport = require('../sqlExport')

const bfx = new BFX();
const ws = bfx.ws(2)

const exchange = 'bitfinex'

let client = ''
let massOfAsks = []
let massOfBids = []

function connect(sqlCilent){
    client = sqlCilent
    ws.open()
    getOrderBookAndTrade()
}

function getOrderBookAndTrade() {
    ws.on('open', () => {
        console.log('connected to ws')
        ws.subscribeOrderBook('tBTCUSD')
        ws.subscribeTrades('tBTCUSD')
    })

    ws.onTradeEntry({ pair: 'BTCUSD' }, (trade) => {
        try {
            let nodetime = new Date().toISOString()
            for (let i = 0; i < trade.length; i++) {
                let tradeOb = {
                    ticker: 'BTCUSD',
                    price: trade[i][3],
                    amount: trade[i][2] > 0 ? trade[i][2] : -trade[i][2],
                    type: trade[i][2] > 0 ? 'BUY' : 'SELL'
                }
                sqlExport.sendTrade(tradeOb, client, exchange, nodetime)
            }
        }
        catch (e) {
            other.makeLog(e)
        }
    })

    ws.onOrderBook({symbol: 'tBTCUSD'}, (ob) => {
        try {
            if (ob.length >= 48) {
                for (let i = 0; i < ob.length; i++) {
                    if (i>=25){
                        massOfAsks.push({
                            ticker: 'BTCUSD',
                            price: ob[i][0],
                            amount: -ob[i][2],
                            type: 'SELL',
                            number: 0
                        })
                    } else {
                        massOfBids.push({
                            ticker: 'BTCUSD',
                            price: ob[i][0],
                            amount: ob[i][2],
                            type: 'BUY',
                            number: 0
                        })
                    }
                }
            } else {
                if (ob[1] === 0 && ob[2] === -1) {
                    massOfAsks = massOfAsks.filter((el) => el.price !== ob[0])
                } else if (ob[1] === 0 && ob[2] === 1) {
                    massOfBids = massOfBids.filter((el) => el.price !== ob[0])
                } else if (ob[2] < 0) {
                    let found = massOfAsks.filter((el) => el.price === ob[0])
                    if (found.length !== 0) {
                        found[0].amount = -ob[2]

                        massOfAsks = massOfAsks.filter((el) => el.price !== found[0].price)
                        massOfAsks.push({
                            ticker: 'BTCUSD',
                            price: found[0].price,
                            amount: found[0].amount,
                            type: 'SELL',
                            number: 0
                        })
                    } else {
                        massOfAsks.push({
                            ticker: 'BTCUSD',
                            price: ob[0],
                            amount: -ob[2],
                            type: 'SELL',
                            number: 0
                        })
                    }
                    massOfAsks.sort(sortAlg);
                    let nodetime = new Date().toISOString()
                    Object.keys(massOfAsks).forEach((key) => {
                        massOfAsks[key].number = parseInt(key) + 1
                        sqlExport.sendOrderbook(massOfAsks[key], client, exchange, nodetime)
                    })
                } else if (ob[2] > 0){
                    let found = massOfBids.filter((el) => el.price === ob[0])
                    if (found.length !== 0) {
                        found[0].amount = ob[2]

                        massOfBids = massOfBids.filter((el) => el.price !== found[0].price)
                        massOfBids.push({
                            ticker: 'BTCUSD',
                            price: found[0].price,
                            amount: found[0].amount,
                            type: 'BUY',
                            number: 0
                        })
                    } else {
                        massOfBids.push({
                            ticker: 'BTCUSD',
                            price: ob[0],
                            amount: ob[2],
                            type: 'BUY',
                            number: 0
                        })
                    }
                    massOfBids.sort(sortAlgRevert);
                    let nodetime = new Date().toISOString()
                    Object.keys(massOfBids).forEach((key) => {
                        massOfBids[key].number = parseInt(key) + 1
                        sqlExport.sendOrderbook(massOfBids[key], client, exchange, nodetime)
                    })

                }

            }
        }
        catch (e) {
            other.makeLog(e)
        }
    })
}

function sortAlg(a, b) {
    if (a.price > b.price) return 1;
    if (a.price < b.price) return -1;
}

function sortAlgRevert(a, b) {
    if (a.price > b.price) return -1;
    if (a.price < b.price) return 1;
}

module.exports.connect = connect
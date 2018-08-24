const OKEX = require('okex-api-node');
const sqlExport = require('../sqlExport')
const exchange = 'Okex'
const okex = new OKEX({
    apiKey: '10a00812-a8f6-4fb3-8e0c-395dca470aa5',
    secretKey: '99F6976955E15D25611E16061F1BC0FC',
    ws: {}
});
let massOfAsks = []
let massOfBids = []
let client = ''

function dealsHandler(event){
    if (event.data[0]) {
        event.data.forEach((elem)=>{
            let tradeOb = {
                ticker: 'BTCUSD',
                price: elem[1],
                amount: elem[2],
                type: elem[4] === 'bid' ? 'SELL' : 'BUY'
            }
            let nodetime = new Date().toISOString()
            sqlExport.sendTrade(tradeOb, client, exchange, nodetime)
        })
    }
}

function depthHandler(event){
    if (event.data.timestamp) {
        event.data.bids = event.data.bids.slice(0, 26)
        event.data.asks = event.data.asks.reverse().slice(0, 26)
        event.data.bids.forEach((elem)=> {

            if (elem[1] === '0') {
                massOfBids = massOfBids.filter((el) => el.price !== elem[0])
            } else {
                let found = massOfBids.filter((el) => el.price === elem[0])
                if (found.length !== 0) {
                    found[0].amount = elem[1]

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
                        price: elem[0],
                        amount: elem[1],
                        type: 'BUY',
                        number: 0
                    })
                }
            }
        })
        event.data.asks.forEach((elem)=> {

            if (elem[1] === '0') {
                massOfAsks = massOfAsks.filter((el) => el.price !== elem[0])
            } else {
                let found = massOfAsks.filter((el) => el.price === elem[0])
                if (found.length !== 0) {
                    found[0].amount = elem[1]

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
                        price: elem[0],
                        amount: elem[1],
                        type: 'SELL',
                        number: 0,
                        nodetime: new Date().toISOString()
                    })
                }
            }
        })
        massOfBids.sort(sortAlgRevert)
        massOfAsks.sort(sortAlg)
        let nodetime = new Date().toISOString()
        Object.keys(massOfBids).forEach((key)=>{
            massOfBids[key].number = parseInt(key) + 1
            sqlExport.sendOrderbook(massOfBids[key], client, exchange, nodetime)
        })
        Object.keys(massOfAsks).forEach((key)=>{
            massOfAsks[key].number = parseInt(key) + 1
            sqlExport.sendOrderbook(massOfAsks[key], client, exchange, nodetime)
        })
    }
}

function connect(sqlClient) {
    client = sqlClient
    okex.onSpot('BTC_USDT', 'deals', dealsHandler)
    okex.onSpot('BTC_USDT', 'depth', depthHandler)
    okex.start()
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





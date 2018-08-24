const sqlExport = require('../sqlExport')
const other = require('../other')
const exchange = 'binance'
const binance = require('node-binance-api')().options({
    APIKEY: '<key>',
    APISECRET: '<secret>',
    useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
    test: true // If you want to use sandbox mode where orders are simulated
});
var client = ''


function connect(sqlClient){
    client = sqlClient;
    binance.websockets.trades(['BTCUSDT'], (trades) => {
        let nodetime = new Date().toISOString()
        try {
            let tradeOb = {
                ticker: 'BTCUSD',
                price: trades.p,
                amount: trades.q,
                type: trades.m ? 'SELL' : 'BUY'
            }
            sqlExport.sendTrade(tradeOb, sqlClient, exchange, nodetime)
        }
        catch (e) {
            other.makeLog(e)
        }
    });
    binance.websockets.depthCache(['BTCUSDT'], (symbol, depth) => {
        let nodetime = new Date().toISOString()
        let massOfKeys = Object.keys(depth.asks)
        for (let i=0; i<25; i++){
            let orderbook = {
                ticker: 'BTCUSD',
                price: massOfKeys[i],
                amount: depth.asks[massOfKeys[i]],
                type: 'SELL',
                number: i+1
            }
            sqlExport.sendOrderbook(orderbook, sqlClient, exchange, nodetime)
        }
        let massOfBids = Object.keys(depth.bids)
        for (let i=0; i<25; i++){
            let orderbook = {
                ticker: 'BTCUSD',
                price: massOfBids[i],
                amount: depth.bids[massOfBids[i]],
                type: 'BUY',
                number: i+1
            }
            sqlExport.sendOrderbook(orderbook, sqlClient, exchange, nodetime)
        }

    });
}
module.exports.connect = connect
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
let marketsArray = []

let retry = 0;
let oldLength = 0;
let stopthis = 0;
function connect(sqlClient, massOfCurrency){
    binance.websockets.miniTicker(markets => {

            if (marketsArray.length === oldLength) {
                retry++;
                console.log('ret ' + retry)
            } else {
                retry = 0;
            }
        oldLength = marketsArray.length;
            if (retry > 15 && stopthis === 0) {
                console.log('started')
                stopthis = 1;
                binance.websockets.terminate('!miniTicker@arr'); // for prevday
                makeConnect(sqlClient, marketsArray)
            }
        Object.keys(markets).forEach((el) => {
            if (markets[el].quoteVolume < 500 && markets[el].quoteVolume > 10 && markets[el].close>0.00000200 && ~el.indexOf('BTC')) {
                if (el !== 'DASHBTC' && el !== 'STRATBTC' && el !== 'BCHBTC' && el !== 'BTGBTC' && el !== 'XVGBTC'  && el !== 'ETHBTC' && el !== 'BCHBTC') {
                    marketsArray = marketsArray.filter((elem) => elem !== el)
                    marketsArray.push(el)
                }
            }
        })
        console.log(marketsArray.length)

    });

}

function makeConnect(sqlClient, massOfCurrency) {
    client = sqlClient;

        binance.websockets.trades(massOfCurrency, (trades) => {
            let nodetime = new Date().toISOString()
            try {
                let tradeOb = {
                    ticker: trades.s,
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
        // Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        binance.websockets.candlesticks(massOfCurrency, "2h", (candlesticks) => {
            let nodetime = new Date().toISOString()
            let {k:ticks } = candlesticks;
            let { h:high, l:low, q:quoteVolume, s:ticker } = ticks;
            try {
                let candle1min = {
                    ticker: ticker,
                    high: high,
                    low: low,
                    amount: quoteVolume
                }
                sqlExport.send1Min(candle1min, sqlClient, exchange, nodetime)
            }
            catch (e) {
                other.makeLog(e)
            }
        });
        // Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        binance.websockets.candlesticks(massOfCurrency, "30m", (candlesticks) => {
            let nodetime = new Date().toISOString()
            let {k:ticks } = candlesticks;
            let {h:high, l:low, q:quoteVolume, s:ticker} = ticks;
            let candle30min = {
                ticker: ticker,
                high: high,
                low: low,
                amount: quoteVolume
            }
            sqlExport.send30Min(candle30min, sqlClient, exchange, nodetime)
        });

    //     binance.websockets.depthCache([massOfCurrency[j]], (symbol, depth) => {
    //         let nodetime = new Date().toISOString()
    //         let massOfKeys = Object.keys(depth.asks)
    //         for (let i = 0; i < 25; i++) {
    //             let orderbook = {
    //                 ticker: massOfCurrency[j],
    //                 price: massOfKeys[i],
    //                 amount: depth.asks[massOfKeys[i]],
    //                 type: 'SELL',
    //                 number: i + 1
    //             }
    //             sqlExport.sendOrderbook(orderbook, sqlClient, exchange, nodetime)
    //         }
    //         let massOfBids = Object.keys(depth.bids)
    //         for (let i = 0; i < 25; i++) {
    //             let orderbook = {
    //                 ticker: massOfCurrency[j],
    //                 price: massOfBids[i],
    //                 amount: depth.bids[massOfBids[i]],
    //                 type: 'BUY',
    //                 number: i + 1
    //             }
    //             sqlExport.sendOrderbook(orderbook, sqlClient, exchange, nodetime)
    //         }
    //
    //     });
    // }
}
module.exports.connect = connect
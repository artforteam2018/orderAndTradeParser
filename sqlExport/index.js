const { Client } = require('pg')
const other = require('../other')

function ConnectBase(host, port, user, password, database) {
    return new Promise(function (resolve, reject) {

        let client = new Client({
            host: host,
            port: port,
            user: user,
            password: password,
            database: database
        })
        client.connect()
            .then(() => resolve(client))
            .catch(e => {
                other.makeLog('Ошибка подключения к ' + database);
                other.makeLog(e)
                reject('Ошибка подключения')
            })
    })
}

function sendTrade(tradeOb, client, exchange, nodetime){
    let query = {
        text: 'INSERT INTO trades(exchange, ticker, price, amount, type, nodetime) VALUES($1, $2, $3, $4, $5, $6)',
        values: [exchange, tradeOb.ticker, parseFloat(tradeOb.price).toFixed(8), parseFloat(tradeOb.amount).toFixed(8), tradeOb.type, nodetime],
    }
    client.query(query)
    .catch(e => other.makeLog(e))
}


function send30Min(tradeOb, client, exchange, nodetime){
    let query = {
        text: 'INSERT INTO candle30min(exchange, ticker, high, low, amount, nodetime) VALUES($1, $2, $3, $4, $5, $6)',
        values: [exchange, tradeOb.ticker, parseFloat(tradeOb.high).toFixed(8), parseFloat(tradeOb.low).toFixed(8), parseFloat(tradeOb.amount).toFixed(8), nodetime],
    }
    client.query(query)
        .catch(e => other.makeLog(e))
}

function send1Min(tradeOb, client, exchange, nodetime){
    let query = {
        text: 'INSERT INTO candle1min(exchange, ticker, high, low, amount, nodetime) VALUES($1, $2, $3, $4, $5, $6)',
        values: [exchange, tradeOb.ticker, parseFloat(tradeOb.high).toFixed(8), parseFloat(tradeOb.low).toFixed(8), parseFloat(tradeOb.amount).toFixed(8), nodetime],
    }
    client.query(query)
        .catch(e => other.makeLog(e))
}

function sendOrderbook(orderbook, client, exchange, nodetime){
    let query = {
        text: 'INSERT INTO orderbook(exchange, ticker, price, amount, type, number, nodetime) VALUES($1, $2, $3, $4, $5, $6, $7)',
        values: [exchange, orderbook.ticker, parseFloat(orderbook.price).toFixed(8), parseFloat(orderbook.amount).toFixed(8), orderbook.type, orderbook.number, nodetime],
    }
    client.query(query)
    .catch(e => other.makeLog(e))
}

module.exports.sendTrade = sendTrade
module.exports.sendOrderbook = sendOrderbook
module.exports.ConnectBase = ConnectBase
module.exports.send1Min = send1Min
module.exports.send30Min = send30Min
const bitfinex = require('./bitfinex')
const binance = require('./binance')
const okex = require('./okex')
const hitbtc = require('./hitbtc')
const sqlExport = require ('./sqlExport')
const other = require ('./other')

const host = 'localhost'
const port = '5432'
const user = 'postgres'
const pass = '88228228'
const database = 'saver'



sqlExport.ConnectBase(host, port, user, pass, database)
    .then(
        result => {
            const client = result
            binance.connect(client, ['GTOBTC', 'LOOMBTC'])
        })
    .catch(
        e => other.makeLog(e)
    )




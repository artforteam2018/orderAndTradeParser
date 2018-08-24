
const fs = require('fs')

function makeLog(e){
    console.log(getDate() + ' ' + e)
    fs.readFile('./logs/errors.txt', 'utf8', (err, result)=>{
        fs.writeFile('./logs/errors.txt', result + getDate() + '\r\n' + e + '\r\n' , (err)=> {

            fs.readFile('../logs/errors.txt', 'utf8', (err, result)=>{
                fs.writeFile('../logs/errors.txt', result + getDate() + '\r\n' + e + '\r\n' , (err)=> {
                    err!=null?console.log(err):false
                })
            })

        })
    })



    setTimeout(makeLog, 60000)
}

function getDate(){
    var date = new Date()
    return "" +  date.getFullYear() +
        "." + (date.getMonth()+1<10 ? '0' + (date.getMonth()+1): (date.getMonth()+1)) +
        "." + (date.getDate()<10 ? '0' + date.getDate(): date.getDate()) +
        " " + (date.getHours()<10 ? '0' + date.getHours(): date.getHours()) +
        ":" + (date.getMinutes()<10 ? '0' + date.getMinutes(): date.getMinutes()) +
        ":" + (date.getSeconds()<10 ? '0' + date.getSeconds(): date.getSeconds())
}

module.exports.makeLog = makeLog
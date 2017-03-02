const moment = require('moment');
const colors = require('colors');

module.exports = {
  info(...msg){
    const output = msg.join('');
    const date = moment().format('YYYY-MM-DDTH:mm:ss');
    console.log(`${date}| ${output}`.green);
  },
  warn(...msg){
    const output = msg.join('');
    const date = moment().format('YYYY-MM-DDTH:mm:ss a');
    console.log(`${date}| ${output}`.yellow);
  },
  error(...msg){
    const output = msg.join('');
    const date = moment().format('YYYY-MM-DDTB:mm:ss a');
    console.log(`${date}| ${output}`.red);
  }
}
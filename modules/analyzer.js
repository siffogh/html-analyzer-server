const cheerio = require('cheerio');
const rp = require('request-promise');
const logger = require('./logger');
const _ = require('lodash/fp');


module.exports = (link) => {
  const options = {
    uri: link,
    transform: function (body) {
        return cheerio.load(body);
    }
  };

  return rp(options).then( $ => {
      const doctype = $.html().toLowerCase();
      console.log(doctype);
      return $.html();
    });
}
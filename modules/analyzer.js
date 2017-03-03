const cheerio = require('cheerio');
const rp = require('request-promise');
const logger = require('./logger');
const utils = require('./utils');


module.exports = (link) => {
  const options = {
    uri: link,
    transform(body) {
      return cheerio.load(body);
    },
  };

  return rp(options).then(($) => {
    const htmlVersion = utils.getHtmlVersion($);
    const title = utils.getTitle($);
    const headings = utils.getHeadings($);
    const hasLoginForm = utils.hasForm($);
    return utils.getLinks($, link).then(links => ({
      htmlVersion,
      title,
      headings,
      links,
      hasLoginForm,
    }));
  });
};

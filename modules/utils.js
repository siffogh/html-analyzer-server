const _ = require('lodash/fp');
const Promise = require('bluebird');
const rp = require('request-promise');
const htmlVersions = require('../static/htmlVersions');
const logger = require('./logger');


const linkRegex = new RegExp(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);

const isAccessibleLink = (el) => {
  const href = el.attribs.href;
  const options = {
    timeout: 10000,
    uri: href,
  };
  return rp(options).catch(() => Promise.resolve(0));
};

const countAccessibleLinks = els => _.pipe(
    _.map(isAccessibleLink),
    promises => Promise.all(promises).catch(console.log),
    finalPromise => finalPromise.then(results => (
      _.filter(res => res !== 0)(results)
    ))
  )(els);
const isExternalLink = (el, pageHost) => {
  const href = el.attribs.href;
  if (!href) {
    return false;
  }
  const linkProps = href.match(linkRegex);

  // means that the link is refereing to an internal element
  if (!linkProps || linkProps.length < 2) {
    return false;
  }
  return (linkProps[2] !== pageHost);
};


module.exports = {
  getHtmlVersion($) {
    // get doctype
    const doctype = _.pipe(
        _.find(({ name }) => name === '!doctype'),
        ({ data }) => data.toLowerCase()
    )($.root().contents());

    // match html version based on doctype expression
    return _.pipe(
      _.find(({ expression }) => doctype.includes(expression)),
      res => (res ? res.version : '')
    )(htmlVersions);
  },
  getTitle($) {
    return $('title').text();
  },
  getHeadings($) {
    const headings = {};
    for (let i = 1; i <= 6; i++) {
      const count = $(`h${i}`).length;
      if (count) {
        headings[`h${i}`] = count;
      }
    }
    return headings;
  },
  getLinks($, link) {
    const pageHost = link.match(linkRegex)[2];
    const anchors = $(':root').find('a');
    let externalLinks = 0;
    let internalLinks = 0;
    let inaccessibleLinks = 0;
    return _.pipe(
      _.filter(el => isExternalLink(el, pageHost)),
      (res) => {
        if (res) {
          externalLinks = res.length;
          console.log('externalLinks: ', _.map(l => l.attribs.href)(res));
        }
        internalLinks = anchors.length - externalLinks;
        return res;
      },
      externals => countAccessibleLinks(externals).then((validLinks) => {
        logger.info('Done counting accessible links!');
        inaccessibleLinks = externals.length - validLinks.length;
        return ({
          externalLinks,
          internalLinks,
          inaccessibleLinks,
        });
      })
    )(anchors);
  },
  hasForm($) {
    console.log($(':root').find('form').length);
    return $(':root').find('form').length !== 0;
  },
};

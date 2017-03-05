const _ = require('lodash/fp');
const Promise = require('bluebird');
const rp = require('request-promise');
const Joi = require('joi');
const Boom = require('boom');
const jwt = require('jsonwebtoken');

const config = require('../config')
const htmlVersions = require('../static/htmlVersions');
const logger = require('./logger');
const User = require('../models/User')

const linkRegex = new RegExp(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);

const isAccessibleLink = (el) => {
  const timeout = 30000;
  const href = el.attribs.href;
  const timeoutPromise = Promise.delay(timeout).then(() => Promise.resolve(0));
  return Promise.race([timeoutPromise, rp(href).catch(() => Promise.resolve(0))]);
};

const countAccessibleLinks = els => _.pipe(
    _.map(isAccessibleLink),
    promises => Promise.all(promises).catch(logger.error),
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
    return $(':root').find('form').length !== 0;
  },
  validateUserSchema: Joi.object({
    username: Joi.string().alphanum().min(2).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  verifyUniqueUser(req, reply) {
    User.findOne({
      $or: [
        { email: req.payload.email },
        { username: req.payload.username }
      ]
    }, (err, user) => {
      // Check whether the username or email
      // is already taken and error out if so
      if (user) {
        if (user.username === req.payload.username) {
          return reply(Boom.badRequest('Username taken'));
        }
        if (user.email === req.payload.email) {
          return reply(Boom.badRequest('Email taken'));
        }
      }
      // If everything checks out, send the payload through
      // to the route handler
      return reply(req.payload);
    });
  },
  createToken(user) {
    return jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      config.secret,
      {
        algorithm: 'HS256',
        expiresIn: '1h',
      }
    );
  },
  verifyCredentials(req, reply) {
    const password = req.payload.password;

    User.findOne({
      $or: [
        { email: req.payload.user },
        { username: req.payload.user },
      ],
    }, (err, user) => {
      if (user) {
        if (user.validPassword(password)) {
          return reply(user);
        }
        return reply(Boom.badRequest('Incorrect password!'));
      }
      return reply(Boom.badRequest('Incorrect username or email!'));
    });
  },
};

const Joi = require('joi');
const Boom = require('boom');

const logger = require('./modules/logger');
const analyzer = require('./modules/analyzer');
const User = require('./models/User');
const utils = require('./modules/utils');
// postAnalyze

const postAnalyzeHandler = (req, reply) => {
  const link = req.payload.link;
  logger.info(`link: ${link}`);
  analyzer(link)
  .then((content) => {
    reply({ content });
  })
  .catch((err) => {
    logger.error(err);
    reply(Boom.notFound('Invalid URL'));
  });
};

const postAnalyzeConfig = {
  handler: postAnalyzeHandler,
  validate: {
    payload: {
      link: Joi.string(),
    },
  },
};

// signup

const signupHandler = (req, reply) => {
  const user = new User();
  user.email = req.payload.email;
  user.username = req.payload.username;
  user.password = user.generateHash(req.payload.password);
  user.save((err, savedUser) => {
    if (err) {
      throw Boom.badRequest(err);
    }
    // If the user is saved successfully, issue a JWT
    reply({ id_token: utils.createToken(savedUser) }).code(201);
  });
};

const signupConfig = {
  pre: [
    { method: utils.verifyUniqueUser },
  ],
  handler: signupHandler,
  validate: {
    payload: utils.validateUserSchema,
  },
};

// login

const loginHandler = (req, reply) => (
  reply({ id_token: utils.createToken(req.pre.user) }).code(201)
);

const loginConfig = {
    // Check the user's password against the DB
  pre: [
    { method: utils.verifyCredentials, assign: 'user' },
  ],
  handler: loginHandler,
};

module.exports = (
[
  {
    method: 'GET',
    path: '/',
    handler: (req, reply) => reply('hello world'),
  },
  {
    method: 'POST',
    path: '/api/analyze',
    config: postAnalyzeConfig,
  },
  {
    method: 'POST',
    path: '/api/signup',
    config: signupConfig,
  },
  {
    method: 'POST',
    path: '/api/login',
    config: loginConfig,
  },
]
);

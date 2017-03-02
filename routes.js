const Joi = require('joi');
const logger = require('./modules/logger');
const analyzer = require('./modules/analyzer');
const Boom = require('boom');

const postAnalyzeHandler = (req, reply) => {
  const link = req.payload.link;
  logger.info(`link: ${link}`);
  analyzer(link)
  .then(html => {
    // logger.info(`html: ${html}`);
    reply('success');
  })
  .catch(err => {
    logger.error(err);
    reply(Boom.notFound('Invalid URL'));
  });

};

const postAnalyzeConfig = {
  handler: postAnalyzeHandler,
  validate: {
    payload: {
      link: Joi.string()
    }
  }
}


module.exports =  (
  [
    {
      method: 'GET',
      path:'/',
      handler: (req, reply) => reply('hello world')
    },
    {
      method: 'POST',
      path: '/api/analyze',
      config: postAnalyzeConfig
    }
  ]
)
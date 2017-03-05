const Hapi = require('hapi');
const mongoose = require('mongoose');

const logger = require('./modules/logger');
const routes = require('./routes');
const config = require('./config');

const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: config.port,
  routes: { cors: true },
});

server.register(require('hapi-auth-jwt'), () => {
  server.auth.strategy('jwt', 'jwt', {
    key: config.secret,
    verifyOptions: { algorithms: ['HS256'] },
  });
  // Add the routes
  routes.map(route => server.route(route));
});


server.start((err) => {
  if (err) {
    logger.error(err);
  }
  mongoose.connect(config.mongoUrl, {}, (e) => {
    if (e) {
      logger.error(e);
    }
    logger.info('Mongodb connection established successfully');
    logger.info('Server running at port: ', server.info.port);
  });
});

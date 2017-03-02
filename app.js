'use strict';

const Hapi = require('hapi');
const logger = require('./modules/logger');
const routes = require('./routes');

const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

// Add the routes
routes.map(route => server.route(route))

server.start((err) => {

    if (err) {
        logger.error(err);
    }
    logger.info('Server running at port: ', server.info.port);
});
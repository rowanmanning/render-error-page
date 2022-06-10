'use strict';

const createHttpError = require('http-errors');
const httpRequest = require('axios');
const path = require('path');
const renderErrorPage = require('../../../lib/render-error-page');

module.exports = async function createTestApp(expressModule) {
	const express = require(expressModule);

	// Create an Express app
	const app = express();
	app.set('view engine', 'hbs');
	app.set('views', path.join(__dirname, 'view'));

	// Add a route to generate errors
	app.get(/^\/(\d+)$/, (request, response, next) => {
		const status = parseInt(request.params[0], 10);
		next(createHttpError(status));
	});

	// Add an error handler
	app.use(renderErrorPage({
		errorLoggingFilter: () => false
	}));

	// Start the server and get the application address
	const server = await start(app);
	const address = `http://localhost:${server.address().port}`;

	/**
	 * Stop the application.
	 */
	function stop() {
		server.close();
	}

	/**
	 * Method to make a GET request to the test application.
	 *
	 * @param {string} requestPath
	 *     The path to make a request to.
	 * @returns {httpRequest.AxiosResponse}
	 *     Returns an HTTP response object.
	 */
	function get(requestPath) {
		return httpRequest({
			url: `${address}${requestPath}`,
			validateStatus() {
				return true;
			}
		});
	}

	// Return the two methods that we need
	return {
		get,
		stop
	};
};

/**
 * Start the application.
 *
 * @param {import('express').Application} app
 *     The Express application to start.
 * @returns {Promise<import('http').Server>}
 *     Returns the started HTTP server.
 */
function start(app) {
	return new Promise((resolve, reject) => {
		const server = app.listen(undefined, error => {
			if (error) {
				return reject(error);
			}
			resolve(server);
		});
	});
}

'use strict';

const { getErrorHttpStatus } = require('@rowanmanning/get-error-http-status');
const { STATUS_CODES } = require('node:http');

/**
 * @import { Options, renderErrorPage } from '.'
 */

/** @type {Required<Options>} */
const defaultOptions = {
	errorView: 'error',
	includeErrorStack: process.env.NODE_ENV !== 'production'
};

/** @type {renderErrorPage} */
exports.renderErrorPage = function renderErrorPage(options) {
	const { errorView, includeErrorStack } = Object.assign({}, defaultOptions, options);
	/** @type {import('express').ErrorRequestHandler} */
	return function renderErrorPageMiddleware(error, _request, response, next) {
		// If headers have been sent, offload onto the default error handler
		// which can terminate the request
		if (response.headersSent) {
			return next(error);
		}

		const statusCode = getErrorHttpStatus(error);
		const { code, message, name } = error;
		const stack = includeErrorStack ? error.stack : null;

		// Create a render context to be passed to the view
		const renderContext = {
			error: {
				code,
				message,
				name,
				stack,
				status: statusCode,
				statusCode,
				statusMessage: STATUS_CODES[statusCode]
			}
		};

		// Set the response status
		response.status(renderContext.error.statusCode);

		// Attempt to render the page
		response.render(errorView, renderContext, (renderError, html) => {
			if (renderError) {
				return response.send(renderFallbackPage(renderContext, renderError));
			}
			response.send(html);
		});
	};
};

/**
 * @param {object} renderContext
 * @param {object} renderContext.error
 * @param {string} renderContext.error.message
 * @param {string} renderContext.error.stack
 * @param {number} renderContext.error.statusCode
 * @param {Error} renderError
 * @returns {string}
 */
function renderFallbackPage(renderContext, renderError) {
	return `
		<h1>Error ${renderContext.error.statusCode}</h1>
		<p>${renderContext.error.message}</p>
		${renderContext.error.stack ? `<pre>${renderContext.error.stack}</pre>` : ''}
		<hr/>
		<p>There was also an issue rendering the error page:<br/>${renderError.message}</p>
		${renderContext.error.stack ? `<pre>${renderError.stack}</pre>` : ''}
	`.replace(/\t/g, '');
}

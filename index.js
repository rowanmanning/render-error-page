'use strict';

const getErrorHttpStatus = require('@rowanmanning/get-error-http-status');
const { STATUS_CODES } = require('node:http');

/**
 * @typedef {object} Options
 * @property {string} [errorView]
 *     The name of the view to render when an error occurs.
 * @property {boolean} [includeErrorStack]
 *     Whether to include the error stack in the render context.
 *     Defaults to `false` when the `NODE_ENV` environment variable is "production",
 *     or `true` if not.
 */

/**
 * @type {Required<Options>}
 */
const defaultOptions = {
	errorView: 'error',
	includeErrorStack: process.env.NODE_ENV !== 'production'
};

/**
 * Create a middleware function to render error pages.
 *
 * @public
 * @param {Options} [options]
 *     An options object used to configure the returned middleware.
 * @returns {import('express').ErrorRequestHandler}
 *     Returns a middleware function.
 */
function renderErrorPage(options) {
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
}

/**
 * Render a fallback page.
 *
 * @private
 * @param {object} renderContext
 *     The render context containing error details.
 * @param {object} renderContext.error
 *     The error.
 * @param {string} renderContext.error.message
 *     The error message.
 * @param {string} renderContext.error.stack
 *     The error stack.
 * @param {number} renderContext.error.statusCode
 *     The error status code
 * @param {Error} renderError
 *     The error that occurred during rendering.
 * @returns {string}
 *     Returns the fallback HTML page.
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

/** @type {renderErrorPage} */
module.exports = renderErrorPage;
module.exports.default = module.exports;

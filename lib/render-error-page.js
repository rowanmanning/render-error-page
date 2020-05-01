/**
 * @rowanmanning/render-error-page module
 * @module @rowanmanning/render-error-page
 */
'use strict';

/**
 * Create a middleware function to render error pages.
 *
 * @access public
 * @param {Object} [options={}]
 *     An options object used to configure the returned middleware.
 * @param {Number} [options.defaultStatusCode=500]
 *     The status code sent when the error to render has no `statusCode` or `status` property.
 * @param {Function} [options.errorLogger=console.error]
 *     A function which accepts an error and logs it.
 * @param {String} [options.errorView='error']
 *     The name of the view to render when an error occurs.
 * @param {Boolean} [options.includeErrorStack]
 *     Whether to include the error stack in the render context.
 *     Defaults to `false` when the `NODE_ENV` environment variable is "production",
 *     or `true` if not.
 * @returns {ExpressMiddleware}
 *     Returns a middleware function.
 */
module.exports = function renderErrorPage(options) {
	options = applyDefaultOptions(options);
	return (error, request, response, next) => { // eslint-disable-line no-unused-vars
		options.errorLogger(error);

		// Get a status code from the error
		let statusCode = error.statusCode || error.status || options.defaultStatusCode;
		if (statusCode < 100 || statusCode >= 600) {
			statusCode = 500;
		}

		// Create a render context to be passed to the view
		const renderContext = {
			error: {
				statusCode,
				message: error.message,
				stack: (options.includeErrorStack ? error.stack : null)
			}
		};

		// Set the response status
		response.status(renderContext.error.statusCode);

		// Attempt to render the page
		response.render(options.errorView, renderContext, (renderError, html) => {
			if (renderError) {
				// Nope, let's use a fallback
				options.errorLogger(renderError);
				return response.send(renderFallbackPage(renderContext, renderError));
			}
			response.send(html);
		});

	};
};

/**
 * A middleware function.
 *
 * @callback ExpressMiddleware
 * @param {Object} request
 *     An Express Request object.
 * @param {Object} response
 *     An Express Response object.
 * @param {ExpressMiddlewareCallback} next
 *     A callback function.
 * @returns {undefined}
 *     Returns nothing.
 */

/**
 * A callback function.
 *
 * @callback ExpressMiddlewareCallback
 * @param {Error} error
 *     An HTTP error.
 * @returns {undefined}
 *     Returns nothing.
 */

/**
 * Render a fallback page.
 *
 * @access private
 * @param {Object} renderContext
 *     The render context containing error details.
 * @param {Error} renderError
 *     The error that occurred during rendering.
 * @returns {String}
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

/**
 * Apply default values to a set of user-provided options.
 * Used internally by {@link renderErrorPage}.
 *
 * @access private
 * @param {Object} [userOptions={}]
 *     Options to add on top of the defaults. See {@link renderErrorPage}.
 * @returns {Object}
 *     Returns the defaulted options.
 */
function applyDefaultOptions(userOptions) {
	return Object.assign({}, module.exports.defaultOptions, userOptions);
}

/**
 * Default options to be used when creating the middleware.
 *
 * @access private
 * @type {Object}
 */
module.exports.defaultOptions = {
	defaultStatusCode: 500,
	errorLogger: console.error,
	errorView: 'error',
	includeErrorStack: (process.env.NODE_ENV !== 'production')
};

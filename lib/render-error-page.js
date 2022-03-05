/**
 * @rowanmanning/render-error-page module
 * @module @rowanmanning/render-error-page
 */
'use strict';

/**
 * Create a middleware function to render error pages.
 *
 * @access public
 * @param {Options} [options={}]
 *     An options object used to configure the returned middleware.
 * @returns {ExpressMiddleware}
 *     Returns a middleware function.
 */
module.exports = function renderErrorPage(options) {
	options = applyDefaultOptions(options);
	return (error, request, response, next) => { // eslint-disable-line no-unused-vars
		if (options.errorLoggingFilter(error)) {
			options.errorLogger(options.errorLoggingSerializer(error));
		}

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
				options.errorLogger(options.errorLoggingSerializer(renderError));
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
 * @param {Options} [userOptions={}]
 *     Options to add on top of the defaults. See {@link renderErrorPage}.
 * @returns {Options}
 *     Returns the defaulted options.
 */
function applyDefaultOptions(userOptions) {
	return Object.assign({}, module.exports.defaultOptions, userOptions);
}

/**
 * Default options to be used when creating the middleware.
 *
 * @access private
 * @type {Options}
 */
module.exports.defaultOptions = {
	defaultStatusCode: 500,
	errorLogger: console.error,
	errorLoggingFilter: () => true,
	errorLoggingSerializer: error => error,
	errorView: 'error',
	includeErrorStack: (process.env.NODE_ENV !== 'production')
};

/**
 * @typedef {Object} Options
 * @property {Number} [defaultStatusCode=500]
 *     The status code sent when the error to render has no `statusCode` or `status` property.
 * @property {Function} [errorLogger=console.error]
 *     A function which accepts an error and logs it.
 * @property {Function<Boolean>} [errorLoggingFilter=()=>true]
 *     A function which determines whether an error should be logged.
 *     Defaults to a function which always returns `true`.
 * @property {Function<*>} [errorLoggingSerializer=(error)=>error]
 *     A function which serializes an error object prior to logging.
 *     Defaults to a function which always returns the unmodified error object.
 * @property {String} [errorView='error']
 *     The name of the view to render when an error occurs.
 * @property {Boolean} [includeErrorStack]
 *     Whether to include the error stack in the render context.
 *     Defaults to `false` when the `NODE_ENV` environment variable is "production",
 *     or `true` if not.
 */

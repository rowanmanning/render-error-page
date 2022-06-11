/**
 * @module @rowanmanning/render-error-page
 */
'use strict';

/**
 * Create a middleware function to render error pages.
 *
 * @access public
 * @param {Options} [options={}]
 *     An options object used to configure the returned middleware.
 * @returns {import('express').Handler}
 *     Returns a middleware function.
 */
module.exports = function renderErrorPage(options) {
	const defaultedOptions = applyDefaultOptions(options);
	return (error, request, response, next) => { // eslint-disable-line no-unused-vars
		if (defaultedOptions.errorLoggingFilter?.(error)) {
			defaultedOptions.errorLogger?.(
				defaultedOptions.errorLoggingSerializer?.(error),
				request
			);
		}

		// Get a status code from the error
		let statusCode = error.statusCode || error.status || defaultedOptions.defaultStatusCode;
		if (statusCode < 100 || statusCode >= 600) {
			statusCode = 500;
		}

		// Create a render context to be passed to the view
		const renderContext = {
			error: {
				statusCode,
				message: error.message,
				stack: (defaultedOptions.includeErrorStack ? error.stack : null)
			}
		};

		// Set the response status
		response.status(renderContext.error.statusCode);

		// Attempt to render the page
		response.render(defaultedOptions.errorView, renderContext, (renderError, html) => {
			if (renderError) {
				// Nope, let's use a fallback
				defaultedOptions.errorLogger?.(
					defaultedOptions.errorLoggingSerializer?.(renderError),
					request
				);
				return response.send(renderFallbackPage(renderContext, renderError));
			}
			response.send(html);
		});

	};
};

/**
 * Render a fallback page.
 *
 * @access private
 * @param {object} renderContext
 *     The render context containing error details.
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
	errorLogger: error => console.error(error),
	errorLoggingFilter: () => true,
	errorLoggingSerializer: error => error,
	errorView: 'error',
	includeErrorStack: (process.env.NODE_ENV !== 'production')
};

/**
 * @typedef {object} Options
 * @property {number} [defaultStatusCode=500]
 *     The status code sent when the error to render has no `statusCode` or `status` property.
 * @property {ErrorLogger} [errorLogger=console.error]
 *     A function which accepts an error and an Express Request object and logs it.
 * @property {ErrorLoggingFilter} [errorLoggingFilter=()=>true]
 *     A function which determines whether an error should be logged.
 *     Defaults to a function which always returns `true`.
 * @property {ErrorLoggingSerializer} [errorLoggingSerializer=(error)=>error]
 *     A function which serializes an error object prior to logging.
 *     Defaults to a function which always returns the unmodified error object.
 * @property {string} [errorView='error']
 *     The name of the view to render when an error occurs.
 * @property {boolean} [includeErrorStack]
 *     Whether to include the error stack in the render context.
 *     Defaults to `false` when the `NODE_ENV` environment variable is "production",
 *     or `true` if not.
 */

/**
 * @callback ErrorLogger
 * @param {any} error
 *     The error to log.
 * @param {import('express').Request} request
 *     The request which resulted in the error.
 */

/**
 * @callback ErrorLoggingFilter
 * @param {Error} error
 *     The error to filter.
 * @returns {(boolean | undefined)}
 *     Returns whether the error should be logged.
 */

/**
 * @callback ErrorLoggingSerializer
 * @param {Error} error
 *     The error to serialize.
 * @returns {any}
 *     Returns a serialized error for logging.
 */

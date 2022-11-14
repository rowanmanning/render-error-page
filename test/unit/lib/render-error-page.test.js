'use strict';

const {assert} = require('chai');
const td = require('testdouble');

describe('lib/render-error-page', () => {
	let renderErrorPage;

	beforeEach(() => {
		td.replace(console, 'error');
		renderErrorPage = require('../../../lib/render-error-page');
	});

	describe('renderErrorPage(options)', () => {
		let middleware;
		let originalNodeEnv;
		let options;

		beforeEach(() => {
			originalNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'test';
			options = {
				defaultStatusCode: 567,
				errorLogger: td.func(),
				errorLoggingFilter: td.func(),
				errorLoggingSerializer: td.func(),
				errorView: 'mock-error',
				includeErrorStack: true
			};
			Object.assign = td.func();
			td.when(Object.assign(), {ignoreExtraArgs: true}).thenReturn(options);
			td.when(options.errorLoggingFilter(), {ignoreExtraArgs: true}).thenReturn(true);
			middleware = renderErrorPage(options);
		});

		afterEach(() => {
			process.env.NODE_ENV = originalNodeEnv;
		});

		it('defaults the user options', () => {
			td.verify(Object.assign({}, renderErrorPage.defaultOptions, options), {times: 1});
		});

		it('returns a middleware function', () => {
			assert.isFunction(middleware);
		});

		describe('middleware(error, request, response, next)', () => {
			let error;
			let returnValue;
			let request;
			let response;
			let next;

			beforeEach(() => {
				error = new Error('mock error');
				request = {
					isMockRequest: true
				};
				response = {
					render: td.func(),
					send: td.func(),
					status: td.func()
				};

				// Note this has to be non-async for the purposes of
				// testing because of the way Express works
				td.when(response.render(
					td.matchers.anything(),
					td.matchers.anything()
				)).thenCallback(null, 'mock html');

				td.when(options.errorLoggingSerializer(error)).thenReturn('mock-serialized-error');

				next = td.func();
				returnValue = middleware(error, request, response, next);
			});

			it('responds with the default status code', () => {
				td.verify(response.status(567), {times: 1});
			});

			it('renders the expected error view with error details and a callback', () => {
				td.verify(response.render('mock-error', {
					error: {
						statusCode: 567,
						message: 'mock error',
						stack: error.stack
					}
				}, td.matchers.isA(Function)), {times: 1});
			});

			it('responds with the rendered HTML', () => {
				td.verify(response.send('mock html'), {times: 1});
			});

			it('does not call `next`', () => {
				td.verify(next(), {
					ignoreExtraArgs: true,
					times: 0
				});
			});

			it('returns nothing', () => {
				assert.isUndefined(returnValue);
			});

			it('calls the `errorLoggingFilter` function with the error', () => {
				td.verify(options.errorLoggingFilter(error), {times: 1});
			});

			it('calls the `errorLoggingSerializer` function with the error', () => {
				td.verify(options.errorLoggingSerializer(error), {times: 1});
			});

			it('logs the serialized error using `options.errorLogger`', () => {
				td.verify(options.errorLogger('mock-serialized-error', request), {times: 1});
			});

			describe('when `response.render` calls back with an error', () => {
				let renderError;

				beforeEach(() => {
					renderError = new Error('mock render error');
					response.status = td.func();
					response.send = td.func();
					td.when(response.render(
						td.matchers.anything(),
						td.matchers.anything()
					)).thenCallback(renderError);
					td.when(options.errorLoggingSerializer(renderError)).thenReturn('mock-serialized-render-error');
					returnValue = middleware(error, request, response, next);
				});

				it('responds with the default status code', () => {
					td.verify(response.status(567), {times: 1});
				});

				it('responds with fallback HTML', () => {
					td.verify(response.send(td.matchers.isA(String)), {times: 1});
					td.verify(response.send(td.matchers.contains('Error 567')), {times: 1});
					td.verify(response.send(td.matchers.contains('mock error')), {times: 1});
					td.verify(response.send(td.matchers.contains('There was also an issue rendering the error page')), {times: 1});
					td.verify(response.send(td.matchers.contains('<pre>')), {times: 1}); // Indicates that stacks are present
				});

				it('returns nothing', () => {
					assert.isUndefined(returnValue);
				});

				it('calls the `errorLoggingSerializer` function with the render error', () => {
					td.verify(options.errorLoggingSerializer(renderError), {times: 1});
				});

				it('logs the serialized render error using `options.errorLogger`', () => {
					td.verify(options.errorLogger('mock-serialized-render-error', request), {times: 1});
				});

			});

			describe('when `error` has a `statusCode` property', () => {

				beforeEach(() => {
					response.status = td.func();
					error.statusCode = 568;
					returnValue = middleware(error, request, response, next);
				});

				it('responds with the specified status code', () => {
					td.verify(response.status(568), {times: 1});
				});

				it('renders the expected error view with error details and a callback', () => {
					td.verify(response.render('mock-error', {
						error: {
							statusCode: 568,
							message: 'mock error',
							stack: error.stack
						}
					}, td.matchers.isA(Function)), {times: 1});
				});

			});

			describe('when `error` has a `status` property', () => {

				beforeEach(() => {
					response.status = td.func();
					error.status = 568;
					returnValue = middleware(error, request, response, next);
				});

				it('responds with the specified status code', () => {
					td.verify(response.status(568), {times: 1});
				});

				it('renders the expected error view with error details and a callback', () => {
					td.verify(response.render('mock-error', {
						error: {
							statusCode: 568,
							message: 'mock error',
							stack: error.stack
						}
					}, td.matchers.isA(Function)), {times: 1});
				});

			});

			describe('when `error` has a `statusCode` property less than 100', () => {

				beforeEach(() => {
					response.status = td.func();
					error.status = 99;
					returnValue = middleware(error, request, response, next);
				});

				it('responds with a 500 status code', () => {
					td.verify(response.status(500), {times: 1});
				});

				it('renders the expected error view with error details and a callback', () => {
					td.verify(response.render('mock-error', {
						error: {
							statusCode: 500,
							message: 'mock error',
							stack: error.stack
						}
					}, td.matchers.isA(Function)), {times: 1});
				});

			});

			describe('when `error` has a `statusCode` property greater than 599', () => {

				beforeEach(() => {
					response.status = td.func();
					error.status = 600;
					returnValue = middleware(error, request, response, next);
				});

				it('responds with a 500 status code', () => {
					td.verify(response.status(500), {times: 1});
				});

				it('renders the expected error view with error details and a callback', () => {
					td.verify(response.render('mock-error', {
						error: {
							statusCode: 500,
							message: 'mock error',
							stack: error.stack
						}
					}, td.matchers.isA(Function)), {times: 1});
				});

			});

			describe('when `options.errorLoggingFilter` returns `false`', () => {

				beforeEach(() => {
					options.errorLogger = td.func();
					options.errorLoggingFilter = td.func();
					td.when(options.errorLoggingFilter(), {ignoreExtraArgs: true}).thenReturn(false);
					middleware = renderErrorPage(options);
					returnValue = middleware(error, request, response, next);
				});

				it('calls the `errorLoggingFilter` function with the error', () => {
					td.verify(options.errorLoggingFilter(error), {times: 1});
				});

				it('does not log the error details', () => {
					td.verify(options.errorLogger(error, request), {times: 0});
				});

			});

			describe('when `options.includeErrorStack` is `false`', () => {

				beforeEach(() => {
					options.includeErrorStack = false;
					middleware = renderErrorPage(options);
					returnValue = middleware(error, request, response, next);
				});

				it('renders the expected error view with error details and a callback, not including the error stack', () => {
					td.verify(response.render('mock-error', {
						error: {
							statusCode: 567,
							message: 'mock error',
							stack: null
						}
					}, td.matchers.isA(Function)), {times: 1});
				});

				describe('when `response.render` calls back with an error', () => {
					let renderError;

					beforeEach(() => {
						renderError = new Error('mock render error');
						response.status = td.func();
						response.send = td.func();
						td.when(response.render(
							td.matchers.anything(),
							td.matchers.anything()
						)).thenCallback(renderError);
						returnValue = middleware(error, request, response, next);
					});

					it('responds with fallback HTML containing no error stacks', () => {
						td.verify(response.send(td.matchers.isA(String)), {times: 1});
						td.verify(response.send(td.matchers.contains('<pre>')), {times: 0}); // Indicates that stacks are not present
					});

				});

			});

		});

	});

	describe('.defaultOptions', () => {

		describe('.defaultStatusCode', () => {
			it('is set to `500`', () => {
				assert.strictEqual(renderErrorPage.defaultOptions.defaultStatusCode, 500);
			});
		});

		describe('.errorLogger', () => {
			it('is set to a function that calls `console.error`', () => {
				assert.isFunction(renderErrorPage.defaultOptions.errorLogger);
				td.verify(console.error('mock-error'), {times: 0});
				renderErrorPage.defaultOptions.errorLogger('mock-error');
				td.verify(console.error('mock-error'), {times: 1});
			});
		});

		describe('.errorLoggingFilter', () => {
			it('is set to a function that returns true', () => {
				assert.instanceOf(renderErrorPage.defaultOptions.errorLoggingFilter, Function);
				assert.isTrue(renderErrorPage.defaultOptions.errorLoggingFilter());
			});
		});

		describe('.errorLoggingSerializer', () => {
			it('is set to a function that returns the first input argument', () => {
				assert.instanceOf(renderErrorPage.defaultOptions.errorLoggingSerializer, Function);
				assert.strictEqual(renderErrorPage.defaultOptions.errorLoggingSerializer('mock-error'), 'mock-error');
			});
		});

		describe('.errorView', () => {
			it('is set to `"error"`', () => {
				assert.strictEqual(renderErrorPage.defaultOptions.errorView, 'error');
			});
		});

		describe('.includeErrorStack', () => {
			it('is set to a boolean', () => {
				assert.strictEqual(renderErrorPage.defaultOptions.includeErrorStack, (process.env.NODE_ENV !== 'production'));
			});
		});

	});

	describe('.default', () => {
		it('aliases the module exports', () => {
			assert.strictEqual(renderErrorPage, renderErrorPage.default);
		});
	});

});

'use strict';

const assert = require('proclaim');
const sinon = require('sinon');

describe('lib/render-error-page', () => {
	let express;
	let renderErrorPage;

	beforeEach(() => {
		express = require('../mock/npm/express');
		renderErrorPage = require('../../../lib/render-error-page');
	});

	describe('renderErrorPage(options)', () => {
		let middleware;
		let options;
		let originalNodeEnv;
		let userOptions;

		beforeEach(() => {
			originalNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'test';
			sinon.spy(Object, 'assign');
			userOptions = {
				defaultStatusCode: 567,
				errorLogger: sinon.stub(),
				errorLoggingFilter: sinon.stub().returns(true),
				errorView: 'mock-error',
				includeErrorStack: true
			};
			middleware = renderErrorPage(userOptions);

			// Sneakily grab the options object used by the
			// middleware so that we can make changes
			options = Object.assign.firstCall.returnValue;
		});

		afterEach(() => {
			process.env.NODE_ENV = originalNodeEnv;
		});

		it('defaults the user options', () => {
			assert.calledOnce(Object.assign);
			assert.isObject(Object.assign.firstCall.args[0]);
			assert.strictEqual(Object.assign.firstCall.args[1].defaultStatusCode, 500);
			assert.strictEqual(Object.assign.firstCall.args[1].errorLogger, console.error);
			assert.isFunction(Object.assign.firstCall.args[1].errorLoggingFilter);
			assert.isTrue(Object.assign.firstCall.args[1].errorLoggingFilter());
			assert.strictEqual(Object.assign.firstCall.args[1].errorView, 'error');
			assert.strictEqual(Object.assign.firstCall.args[1].includeErrorStack, (process.env.NODE_ENV !== 'production'));
			assert.strictEqual(Object.assign.firstCall.args[2], userOptions);
		});

		it('returns a middleware function', () => {
			assert.isFunction(middleware);
		});

		describe('middleware(error, request, response, next)', () => {
			let error;
			let returnValue;
			let response;
			let next;

			beforeEach(() => {
				error = new Error('mock error');
				response = express.mockResponse;

				// Note this has to be non-async for the purposes of
				// testing because of the way Express works
				response.render.yields(null, 'mock html');

				next = sinon.spy();
				returnValue = middleware(error, {}, response, next);
			});

			it('responds with the default status code', () => {
				assert.calledOnce(response.status);
				assert.calledWithExactly(response.status, 567);
			});

			it('renders the expected error view with error details and a callback', () => {
				assert.calledOnce(response.render);
				assert.calledWith(response.render, 'mock-error');
				assert.deepEqual(response.render.firstCall.args[1], {
					error: {
						statusCode: 567,
						message: 'mock error',
						stack: error.stack
					}
				});
				assert.isFunction(response.render.firstCall.args[2]);
			});

			it('responds with the rendered HTML', () => {
				assert.calledOnce(response.send);
				assert.calledWithExactly(response.send, 'mock html');
			});

			it('does not call `next`', () => {
				assert.notCalled(next);
			});

			it('returns nothing', () => {
				assert.isUndefined(returnValue);
			});

			it('calls the `errorLoggingFilter` function with the error', () => {
				assert.calledOnce(options.errorLoggingFilter);
				assert.calledWithExactly(options.errorLoggingFilter, error);
			});

			it('logs the error using `options.errorLogger`', () => {
				assert.calledOnce(userOptions.errorLogger);
				assert.calledWithExactly(userOptions.errorLogger, error);
			});

			describe('when `response.render` calls back with an error', () => {
				let renderError;

				beforeEach(() => {
					userOptions.errorLogger.reset();
					response.send.reset();
					response.status.reset();
					renderError = new Error('mock render error');
					response.render.yields(renderError);
					next = sinon.spy();
					returnValue = middleware(error, {}, response, next);
				});

				it('responds with the default status code', () => {
					assert.calledOnce(response.status);
					assert.calledWithExactly(response.status, 567);
				});

				it('responds with fallback HTML', () => {
					assert.calledOnce(response.send);
					const html = response.send.firstCall.args[0];
					assert.include(html, 'Error 567');
					assert.include(html, 'mock error');
					assert.include(html, 'mock render error');
					assert.include(html, 'There was also an issue rendering the error page');
					assert.include(html, '<pre>'); // Indicates that stacks are present
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

				it('returns nothing', () => {
					assert.isUndefined(returnValue);
				});

				it('logs the error and the render error using `options.errorLogger`', () => {
					assert.calledTwice(userOptions.errorLogger);
					assert.calledWithExactly(userOptions.errorLogger, error);
					assert.calledWithExactly(userOptions.errorLogger, renderError);
				});

			});

			describe('when `error` has a `statusCode` property', () => {

				beforeEach(() => {
					response.render.reset();
					response.status.reset();
					error.statusCode = 568;
					returnValue = middleware(error, {}, response, next);
				});

				it('responds with the specified status code', () => {
					assert.calledOnce(response.status);
					assert.calledWithExactly(response.status, 568);
				});

				it('renders the expected error view with error details and a callback', () => {
					assert.calledOnce(response.render);
					assert.deepEqual(response.render.firstCall.args[1], {
						error: {
							statusCode: 568,
							message: 'mock error',
							stack: error.stack
						}
					});
				});

			});

			describe('when `error` has a `status` property', () => {

				beforeEach(() => {
					response.render.reset();
					response.status.reset();
					error.status = 568;
					returnValue = middleware(error, {}, response, next);
				});

				it('responds with the specified status code', () => {
					assert.calledOnce(response.status);
					assert.calledWithExactly(response.status, 568);
				});

				it('renders the expected error view with error details and a callback', () => {
					assert.calledOnce(response.render);
					assert.deepEqual(response.render.firstCall.args[1], {
						error: {
							statusCode: 568,
							message: 'mock error',
							stack: error.stack
						}
					});
				});

			});

			describe('when `error` has a `statusCode` property less than 100', () => {

				beforeEach(() => {
					response.render.reset();
					response.status.reset();
					error.statusCode = 99;
					returnValue = middleware(error, {}, response, next);
				});

				it('responds with a 500 status code', () => {
					assert.calledOnce(response.status);
					assert.calledWithExactly(response.status, 500);
				});

				it('renders the expected error view with error details and a callback', () => {
					assert.calledOnce(response.render);
					assert.deepEqual(response.render.firstCall.args[1], {
						error: {
							statusCode: 500,
							message: 'mock error',
							stack: error.stack
						}
					});
				});

			});

			describe('when `error` has a `statusCode` property greater than 599', () => {

				beforeEach(() => {
					response.render.reset();
					response.status.reset();
					error.statusCode = 600;
					returnValue = middleware(error, {}, response, next);
				});

				it('responds with a 500 status code', () => {
					assert.calledOnce(response.status);
					assert.calledWithExactly(response.status, 500);
				});

				it('renders the expected error view with error details and a callback', () => {
					assert.calledOnce(response.render);
					assert.deepEqual(response.render.firstCall.args[1], {
						error: {
							statusCode: 500,
							message: 'mock error',
							stack: error.stack
						}
					});
				});

			});

			describe('when `options.errorLoggingFilter` returns `false`', () => {

				beforeEach(() => {
					userOptions.errorLogger.resetHistory();
					options.errorLoggingFilter = sinon.stub().returns(false);
					returnValue = middleware(error, {}, response, next);
				});

				it('calls the `errorLoggingFilter` function with the error', () => {
					assert.calledOnce(options.errorLoggingFilter);
					assert.calledWithExactly(options.errorLoggingFilter, error);
				});

				it('does not log the error details', () => {
					assert.notCalled(userOptions.errorLogger);
				});

			});

			describe('when `options.includeErrorStack` is `false`', () => {

				beforeEach(() => {
					response.render.reset();
					options.includeErrorStack = false;
					returnValue = middleware(error, {}, response, next);
				});

				it('renders the expected error view with error details and a callback, not including the error stack', () => {
					assert.calledOnce(response.render);
					assert.deepEqual(response.render.firstCall.args[1], {
						error: {
							statusCode: 567,
							message: 'mock error',
							stack: null
						}
					});
				});

				describe('when `response.render` calls back with an error', () => {

					beforeEach(() => {
						response.send.reset();
						response.render.yields(new Error('mock render error'));
						returnValue = middleware(error, {}, response, next);
					});

					it('responds with fallback HTML containing no error stacks', () => {
						assert.calledOnce(response.send);
						const html = response.send.firstCall.args[0];
						assert.include(html, 'Error 567');
						assert.include(html, 'mock error');
						assert.include(html, 'mock render error');
						assert.include(html, 'There was also an issue rendering the error page');
						assert.doesNotInclude(html, '<pre>'); // Indicates that stacks are present
					});

				});

			});

		});

	});

});

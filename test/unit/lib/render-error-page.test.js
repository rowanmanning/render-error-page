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
				defaultStatusCode: 1234,
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
			assert.deepEqual(Object.assign.firstCall.args[1], {
				defaultStatusCode: 500,
				errorView: 'error',
				includeErrorStack: (process.env.NODE_ENV !== 'production')
			});
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
				assert.calledWithExactly(response.status, 1234);
			});

			it('renders the expected error view with error details and a callback', () => {
				assert.calledOnce(response.render);
				assert.calledWith(response.render, 'mock-error');
				assert.deepEqual(response.render.firstCall.args[1], {
					error: {
						statusCode: 1234,
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

			describe('when `response.render` calls back with an error', () => {

				beforeEach(() => {
					response.send.reset();
					response.status.reset();
					response.render.yields(new Error('mock render error'));
					next = sinon.spy();
					returnValue = middleware(error, {}, response, next);
				});

				it('responds with the default status code', () => {
					assert.calledOnce(response.status);
					assert.calledWithExactly(response.status, 1234);
				});

				it('responds with fallback HTML', () => {
					assert.calledOnce(response.send);
					const html = response.send.firstCall.args[0];
					assert.include(html, 'Error 1234');
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

			});

			describe('when `error` has a `statusCode` property', () => {

				beforeEach(() => {
					response.render.reset();
					response.status.reset();
					error.statusCode = 5678;
					returnValue = middleware(error, {}, response, next);
				});

				it('responds with the specified status code', () => {
					assert.calledOnce(response.status);
					assert.calledWithExactly(response.status, 5678);
				});

				it('renders the expected error view with error details and a callback', () => {
					assert.calledOnce(response.render);
					assert.deepEqual(response.render.firstCall.args[1], {
						error: {
							statusCode: 5678,
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
					error.status = 5678;
					returnValue = middleware(error, {}, response, next);
				});

				it('responds with the specified status code', () => {
					assert.calledOnce(response.status);
					assert.calledWithExactly(response.status, 5678);
				});

				it('renders the expected error view with error details and a callback', () => {
					assert.calledOnce(response.render);
					assert.deepEqual(response.render.firstCall.args[1], {
						error: {
							statusCode: 5678,
							message: 'mock error',
							stack: error.stack
						}
					});
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
							statusCode: 1234,
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
						assert.include(html, 'Error 1234');
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

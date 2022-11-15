'use strict';

const {assert} = require('chai');
const td = require('testdouble');

const {initMock: initExpressMock} = require('../mock/npm/express.mock');
const {initMock: initGetErrorHttpStatusMock} = require('../mock/npm/@rowanmanning/get-error-http-status.mock');

describe('lib/render-error-page', () => {
	let express;
	let getErrorHttpStatus;
	let renderErrorPage;

	beforeEach(() => {
		express = initExpressMock();
		getErrorHttpStatus = td.replace('@rowanmanning/get-error-http-status', initGetErrorHttpStatusMock());
		renderErrorPage = require('../../../lib/render-error-page');
	});

	describe('renderErrorPage(options)', () => {
		let middleware;

		beforeEach(() => {
			process.env.NODE_ENV = 'development';
			middleware = renderErrorPage({
				errorView: 'mock-error',
				includeErrorStack: true
			});
		});

		it('returns a middleware function', () => {
			assert.isFunction(middleware);
		});

		describe('middleware(error, request, response, next)', () => {
			let error;
			let returnValue;

			beforeEach(() => {
				error = new Error('mock error');
				td.when(getErrorHttpStatus(error)).thenReturn(456);
				returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
			});

			it('gets the status code from the error', () => {
				td.verify(getErrorHttpStatus(error), {times: 1});
			});

			it('sets the response status code to the returned HTTP status', () => {
				td.verify(express.mockResponse.status(456), {times: 1});
			});

			it('renders the expected error view with error details and a callback', () => {
				td.verify(express.mockResponse.render('mock-error', {
					error: {
						statusCode: 456,
						message: 'mock error',
						stack: error.stack
					}
				}, td.matchers.isA(Function)), {times: 1});
			});

			it('responds with the rendered HTML', () => {
				td.verify(express.mockResponse.send('mock html'), {times: 1});
			});

			it('does not call `next`', () => {
				td.verify(express.mockNext(), {
					ignoreExtraArgs: true,
					times: 0
				});
			});

			it('returns nothing', () => {
				assert.isUndefined(returnValue);
			});

			describe('when `response.render` calls back with an error', () => {
				let renderError;

				beforeEach(() => {
					renderError = new Error('mock render error');
					express = initExpressMock();
					td.when(express.mockResponse.render(
						td.matchers.anything(),
						td.matchers.anything()
					)).thenCallback(renderError);
					returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
				});

				it('responds with the original error status code', () => {
					td.verify(express.mockResponse.status(456), {times: 1});
				});

				it('responds with fallback HTML', () => {
					td.verify(express.mockResponse.send(td.matchers.isA(String)), {times: 1});
					td.verify(express.mockResponse.send(td.matchers.contains('Error 456')), {times: 1});
					td.verify(express.mockResponse.send(td.matchers.contains('mock error')), {times: 1});
					td.verify(express.mockResponse.send(td.matchers.contains('There was also an issue rendering the error page')), {times: 1});
					td.verify(express.mockResponse.send(td.matchers.contains('<pre>')), {times: 1}); // Indicates that stacks are present
				});

				it('returns nothing', () => {
					assert.isUndefined(returnValue);
				});

			});

			describe('when `options.errorView` is not set', () => {

				beforeEach(() => {
					middleware = renderErrorPage({
						includeErrorStack: true
					});
					returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
				});

				it('renders the default error view', () => {
					td.verify(express.mockResponse.render(
						'error',
						td.matchers.isA(Object),
						td.matchers.isA(Function)
					), {times: 1});
				});

			});

			describe('when `options.includeErrorStack` is `false`', () => {

				beforeEach(() => {
					middleware = renderErrorPage({
						errorView: 'mock-error',
						includeErrorStack: false
					});
					returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
				});

				it('renders the expected error view with error details and a callback, not including the error stack', () => {
					td.verify(express.mockResponse.render('mock-error', {
						error: {
							statusCode: 456,
							message: 'mock error',
							stack: null
						}
					}, td.matchers.isA(Function)), {times: 1});
				});

				describe('when `response.render` calls back with an error', () => {
					let renderError;

					beforeEach(() => {
						renderError = new Error('mock render error');
						express = initExpressMock();
						td.when(express.mockResponse.render(
							td.matchers.anything(),
							td.matchers.anything()
						)).thenCallback(renderError);
						returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
					});

					it('responds with fallback HTML containing no error stacks', () => {
						td.verify(express.mockResponse.send(td.matchers.isA(String)), {times: 1});
						td.verify(express.mockResponse.send(td.matchers.contains('<pre>')), {times: 0}); // Indicates that stacks are not present
					});

				});

			});

			describe('when `options.includeErrorStack` is not set', () => {

				describe('when `process.env.NODE_ENV` is not "production"', () => {

					beforeEach(() => {
						td.reset();
						process.env.NODE_ENV = 'development';
						express = initExpressMock();
						getErrorHttpStatus = td.replace('@rowanmanning/get-error-http-status', initGetErrorHttpStatusMock());
						td.when(getErrorHttpStatus(error)).thenReturn(456);
						renderErrorPage = require('../../../lib/render-error-page');

						middleware = renderErrorPage({
							errorView: 'mock-error'
						});
						returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
					});

					it('renders the expected error view with error details and a callback', () => {
						td.verify(express.mockResponse.render('mock-error', {
							error: {
								statusCode: 456,
								message: 'mock error',
								stack: error.stack
							}
						}, td.matchers.isA(Function)), {times: 1});
					});

					describe('when `response.render` calls back with an error', () => {
						let renderError;

						beforeEach(() => {
							renderError = new Error('mock render error');
							express = initExpressMock();
							td.when(express.mockResponse.render(
								td.matchers.anything(),
								td.matchers.anything()
							)).thenCallback(renderError);
							returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
						});

						it('responds with fallback HTML including error stacks', () => {
							td.verify(express.mockResponse.send(td.matchers.contains('<pre>')), {times: 1}); // Indicates that stacks are present
						});

					});

				});

				describe('when `process.env.NODE_ENV` is "production"', () => {

					beforeEach(() => {
						td.reset();
						process.env.NODE_ENV = 'production';
						express = initExpressMock();
						getErrorHttpStatus = td.replace('@rowanmanning/get-error-http-status', initGetErrorHttpStatusMock());
						td.when(getErrorHttpStatus(error)).thenReturn(456);
						renderErrorPage = require('../../../lib/render-error-page');

						middleware = renderErrorPage({
							errorView: 'mock-error'
						});
						returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
					});

					it('renders the expected error view with error details and a callback, not including the error stack', () => {
						td.verify(express.mockResponse.render('mock-error', {
							error: {
								statusCode: 456,
								message: 'mock error',
								stack: null
							}
						}, td.matchers.isA(Function)), {times: 1});
					});

					describe('when `response.render` calls back with an error', () => {
						let renderError;

						beforeEach(() => {
							renderError = new Error('mock render error');
							express = initExpressMock();
							td.when(express.mockResponse.render(
								td.matchers.anything(),
								td.matchers.anything()
							)).thenCallback(renderError);
							returnValue = middleware(error, express.mockRequest, express.mockResponse, express.mockNext);
						});

						it('responds with fallback HTML containing no error stacks', () => {
							td.verify(express.mockResponse.send(td.matchers.isA(String)), {times: 1});
							td.verify(express.mockResponse.send(td.matchers.contains('<pre>')), {times: 0}); // Indicates that stacks are not present
						});

					});

				});

			});

		});

	});

	describe('.default', () => {
		it('aliases the module exports', () => {
			assert.strictEqual(renderErrorPage, renderErrorPage.default);
		});
	});

});

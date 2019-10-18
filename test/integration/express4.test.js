'use strict';

const assert = require('proclaim');
const createTestApp = require('./fixture/create-test-app');

describe('Express 4', () => {
	let app;

	before(async () => {
		app = await createTestApp('express4');
	});

	after(() => {
		app.stop();
	});

	describe('GET /404', () => {
		let response;

		beforeEach(async () => {
			response = await app.get('/404');
		});

		it('responds with a 404 status', () => {
			assert.strictEqual(response.statusCode, 404);
		});

		it('responds with the rendered view', () => {
			assert.strictEqual(response.body, [
				'STATUS: 404',
				'MESSAGE: Not Found',
				''
			].join('\n'));
		});

	});

	describe('GET /500', () => {
		let response;

		beforeEach(async () => {
			response = await app.get('/500');
		});

		it('responds with a 500 status', () => {
			assert.strictEqual(response.statusCode, 500);
		});

		it('responds with the rendered view', () => {
			assert.strictEqual(response.body, [
				'STATUS: 500',
				'MESSAGE: Internal Server Error',
				''
			].join('\n'));
		});

	});

});

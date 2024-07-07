'use strict';

const { after, before, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert');
const createTestApp = require('./fixture/create-test-app');

describe('Express 5', () => {
	let app;

	before(async () => {
		app = await createTestApp('express5');
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
			assert.strictEqual(response.status, 404);
		});

		it('responds with the rendered view', () => {
			assert.strictEqual(response.body, 'STATUS: 404\nMESSAGE: Not Found\n');
		});
	});

	describe('GET /500', () => {
		let response;

		beforeEach(async () => {
			response = await app.get('/500');
		});

		it('responds with a 500 status', () => {
			assert.strictEqual(response.status, 500);
		});

		it('responds with the rendered view', () => {
			assert.strictEqual(response.body, 'STATUS: 500\nMESSAGE: Internal Server Error\n');
		});
	});
});

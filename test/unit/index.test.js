'use strict';

const assert = require('proclaim');

describe('index', () => {
	let index;
	let renderErrorPage;

	beforeEach(() => {
		index = require('../../index');
		renderErrorPage = require('../../lib/render-error-page');
	});

	it('aliases `lib/render-error-page`', () => {
		assert.strictEqual(index, renderErrorPage);
	});

});

'use strict';

const td = require('testdouble');

exports.initMock = () => {
	const express = {
		mockRequest: {},
		mockResponse: {
			render: td.func(),
			send: td.func(),
			status: td.func()
		},
		mockNext: td.func()
	};

	// Note this has to be non-async for the purposes of
	// testing because of the way Express works
	td.when(express.mockResponse.render(
		td.matchers.anything(),
		td.matchers.anything()
	)).thenCallback(null, 'mock html');

	return express;
};

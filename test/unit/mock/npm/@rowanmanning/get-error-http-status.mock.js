'use strict';

const td = require('testdouble');

exports.initMock = () => {
	const getErrorHttpStatus = td.func('@rowanmanning/get-error-http-status');
	td.when(getErrorHttpStatus(), { ignoreExtraArgs: true }).thenReturn(500);
	return getErrorHttpStatus;
};

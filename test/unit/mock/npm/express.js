'use strict';

const sinon = require('sinon');

const mockResponse = {
	render: sinon.stub().yields(),
	send: sinon.stub(),
	status: sinon.stub()
};

module.exports = {mockResponse};

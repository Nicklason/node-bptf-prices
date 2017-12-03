'use strict';

var Pricer = require('../index.js');

Pricer.prototype._apiCall = function(httpMethod, method, version, input, callback) {
	if (!this.apiKey) {
		callback(new Error("No API-Key set (yet)"));
		return;
	}

	var face = 'classifieds';
	if (typeof method === 'object') {
		face = method.face;
		method = method.method;
	}

	var options = {
		"uri": `https://backpack.tf/api/${face}/${method}/v${version}`,
		"json": true,
		"method": httpMethod,
		"gzip": true
	};

	input = input || {};
	input.key = this.apiKey;
	options[httpMethod == 'GET' ? 'qs' : 'form'] = input;

	this.httpRequest(options, function(err, response, body) {
		if (err) {
			callback(err);
			return;
		}

		if (!body || typeof body != 'object') {
			callback(new Error("Invalid API response"));
			return;
		}

		callback(null, body);
	});
};
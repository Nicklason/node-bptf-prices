'use strict';

var Pricer = require('../index.js');

Pricer.prototype.httpRequest = function(uri, options, callback) {
	if (typeof uri === 'object') {
		callback = options;
		options = uri;
		uri = options.url || options.uri;
	} else if (typeof options === 'function') {
		callback = options;
		options = {};
	}

	options.url = options.uri = uri;

	if (this._httpRequestConvenienceMethod) {
		options.method = this._httpRequestConvenienceMethod;
		delete this._httpRequestConvenienceMethod;
	}

	var self = this;

	self.request(options, function(err, response, body) {
		var hasCallback = !!callback;
		var httpError = options.checkHttpError !== false && self._checkHttpError(err, response, callback, body)
		var jsonError = options.json && options.checkJsonError !== false && !body ? new Error("Malformed JSON response") : null;

		if (hasCallback && !(httpError || jsonError)) {
			if (jsonError) {
				callback.call(self, jsonError, response);
			} else {
				callback.apply(self, arguments);
			}
		}
	});
};

Pricer.prototype.httpRequestGet = function() {
	this._httpRequestConvenienceMethod = "GET";
	return this.httpRequest.apply(this, arguments);
};

Pricer.prototype.httpRequestPost = function() {
	this._httpRequestConvenienceMethod = "POST";
	return this.httpRequest.apply(this, arguments);
};

Pricer.prototype._checkHttpError = function(err, response, callback, body) {
	if (err) {
		callback(err, response, body);
		return err;
	}

	if (response.statusCode == 429) {
		err = new Error("Too Many Requests");
		err.retryAfter = parseInt(response.headers['retry-after']) || this.retryTime;
		callback(err, response, body);
		return err;
	}

	if (response.statusCode > 299 || response.statusCode < 199) {
		err = new Error("HTTP error " + response.statusCode);
		err.code = response.statusCode;
		callback(err, response, body);
		return err;
	}

	return false;
};
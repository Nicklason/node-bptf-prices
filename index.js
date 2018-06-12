'use strict';

const Request = require('request');

const Helpers = require('./lib/helpers.js');

module.exports = Pricer;

require('util').inherits(Pricer, require('events').EventEmitter);

function Pricer(options) {
	this.apiKey = options.apiKey;
	this.retryTime = options.retryTime || 2000;
	this.pollTime = options.pollTime || 5000;
	this.keyPriceCheckTime = options.keyPriceCheckTime || 30 * 60 * 1000;
	this.trusted = options.trusted || [];
	this.ready = false;

	this.request = Request;
}

Pricer.prototype.init = function(callback) {
	var self = this;
	self.updateKeyTimer = setInterval(Pricer.prototype.getKeyPrice.bind(self), self.keyPriceCheckTime);
	self.getKeyPrice(function(err, price) {
		if (err) {
			if (callback) {
				callback(err);
			}
			return;
		}

		self.ready = true;
		self.emit("ready");
		if (callback) {
			callback(null);
		}
	});
};

require('./lib/http.js');
require('./lib/webapi.js');
require('./lib/listings.js');
require('./lib/price.js');
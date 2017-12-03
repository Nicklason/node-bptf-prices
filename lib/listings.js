'use strict';

var Pricer = require('../index.js');

var Helpers = require('./helpers.js');

Pricer.prototype.getListingsWithOptions = function(options, callback) {

	var search = {
		item: options.item_name,
		quality: options.quality,
		craftable: options.craftable == true ? 1 : -1,
		tradeable: 1,
		australium: options.australium == true ? 1 : -1,
		killstreak_tier: options.killstreak,
		page_size: 20
	};

	if (search.quality == 5 && options.effect) {
		search.effect = options.effect;
	}

	var self = this;
	self._apiCall("GET", "search", 1, search, function(err, body) {
		if (err) {
			if (err.retryAfter) {
				setTimeout(Pricer.prototype.getListingsWithOptions.bind(self, options, callback), err.retryAfter * 1000);
			} else {
				callback(err);
			}
			return;
		}

		var response = {
			buy: body.buy.listings,
			sell: body.sell.listings
		};

		callback(null, response);
	});
};

Pricer.prototype.findValidListings = function(listings) {
	var valid = [];

	for (var i = 0; i < listings.length; i++) {
		if (this.isValidListing(listings[i])) {
			valid.push(listings[i]);
		}
	}

	return valid;
};

Pricer.prototype.isValidListing = function(listing) {
	// Only trusted users and updated listings may go through.
	return _isTrusted(this.trusted, listing.steamid) && _isUpdated(listing.bump);
};

function _isUpdated(time) {
	// Last time bumped in seconds since epoch.
	return time + 60 * 60 >= Helpers.epoch();
}

function _isTrusted(trusted, steamid64) {
	if (trusted.length === 0) {
		return true;
	}

	for (var i = 0; i < trusted.length; i++) {
		if (trusted[i] == steamid64) {
			return true;
		}
	}
	return false;
}
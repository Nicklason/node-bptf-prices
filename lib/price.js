'use strict';

var Pricer = require('../index.js');

const Helpers = require('./helpers.js');

Pricer.prototype.convertToCurrencies = function(valueInScrap, getKeys = true) {
	if (getKeys) {
		var keys = Math.floor(valueInScrap / this.keyValue);
		var scrap = valueInScrap - (keys * this.keyValue);
		return {
			keys: keys,
			metal: Helpers.scrapToRefined(scrap)
		};
	}

	return {
		keys: 0,
		metal: Helpers.scrapToRefined(valueInScrap)
	};
};

Pricer.prototype.getPrice = function(options, callback) {
	var self = this;
	self.getListingsWithOptions(options, function(err, listings, count) {
		if (err) {
			callback(err);
			return;
		}

		var validListings = {
			buy: self.findValidListings(listings.buy),
			sell: self.findValidListings(listings.sell)
		};

		if (validListings.buy.length === 0 || (validListings.buy.length === 0 && validListings.sell.length === 0)) {
			callback(new Error('Not enough valid listings'));
			return;
		}

		var price = self.makePrice(validListings);

		callback(null, price);
	});
};

Pricer.prototype.makePrice = function(listings) {
	var average = {
		buy: this.getAveragePrice(listings.buy),
		sell: this.getAveragePrice(listings.sell)
	};

	var best = {
		buy: this.getBestPrice(listings.buy, 0),
		sell: this.getBestPrice(listings.sell, 1)
	};

	if (listings.sell.length === 0 && listings.buy.length > 0) {
		console.log(listings.buy.length);
		// Since a lot of bots are buying for the same price, we will use that as the buy price.
		if (listings.buy.length >= 5) {
			return Helpers.ensureProfit({
				buy: best.buy,
				sell: Math.ceil(best.buy * 1.01)
			});
		}
		// Only buy listings
		return Helpers.ensureProfit({
			buy: Math.ceil((4 * best.buy + average.buy) / 5),
			sell: Math.ceil(((4 * best.buy + average.buy) / 5) * 1.01)
		});
	} else if (best.buy > best.sell) {
		// Best buy price is larger than the best sell price
		return Helpers.ensureProfit({
			buy: Math.floor((2 * average.buy + best.sell ) / 3),
			sell: Math.ceil((2 * average.sell + average.buy) / 3)
		});
	} else if (best.sell > best.buy && best.sell * 1.01 > best.buy) {
		// Best sell price is larger than the best buy price, and there is a gap that is greater than 1% between them
		return Helpers.ensureProfit({
			buy: best.buy,
			sell: best.sell
		});
	} else {
		// None of the above returned true
		return Helpers.ensureProfit({
			buy: Math.floor((average.buy + best.buy) / 2),
			sell: Math.ceil((average.sell + best.sell) / 2)
		});
	}
};

Pricer.prototype.getAveragePrice = function(listings) {
	var total = 0;
	var count = 0;

	for (var i = 0; i < listings.length; i++) {
		count++;
		total += this.getAsked(listings[i].currencies);
	}

	var average = total / count;
	return Math.round(average); // Only whole integers.
};

Pricer.prototype.getAsked = function(currencies) {
	var asked = 0;
	if (currencies.metal !== undefined) {
		asked += Helpers.refinedToScrap(currencies.metal);
	}
	if (currencies.keys !== undefined) {
		asked += this.keyValue * currencies.keys;
	}
	return asked;
};

Pricer.prototype.getBestPrice = function(listings, intent) {
	// intent - 1 = sell, 0 = buy
	if (listings.length === 0) {
		return null;
	}

	var best = null;

	if (intent == 1) {
		for (var i = 0; i < listings.length; i++) {
			var price = this.getAsked(listings[i].currencies);
			if (price < best || best === null) {
				best = price;
			}
		}
	} else if (intent == 0) {
		for (var i = 0; i < listings.length; i++) {
			var price = this.getAsked(listings[i].currencies);
			if (price > best || best === null) {
				best = price;
			}
		}
	}

	return best;
};

Pricer.prototype.getKeyPrice = function(callback) {
	var options = {
		item_name: "Mann Co. Supply Crate Key",
		quality: 6,
		craftable: true,
		australium: false,
		killstreak: 0
	};

	var self = this;
	self.getPrice(options, function(err, price) {
		if (err && callback) {
			callback(err);
			return;
		}

		var value = Math.floor((price.buy + price.sell) / 2);
		if (self.keyValue != value) {
			self.emit('key', Helpers.scrapToRefined(value));
		}
		self.keyValue = value;
		if (callback) {
			callback(null, value);
		}
	});
};
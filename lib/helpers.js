exports.refinedToScrap = function(refined) {
	var scrap = parseInt(Math.ceil(refined * 9));
      return scrap;
};

exports.scrapToRefined = function(scrap) {
	var refined = parseFloat((scrap / 9).toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]);
      return refined;
};

exports.epoch = function() {
	var seconds = parseInt(Math.round(new Date().getTime() / 1000));
      return seconds;
};

exports.ensureProfit = function(price) {
	if (price.buy >= price.sell) {
		price.sell = price.buy + 1;
	}

	return price;
}
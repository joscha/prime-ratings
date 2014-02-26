(function($) {
	'use strict';

	var isDebug = false;
	var $body = $('body');

	function addRating(results) {
		
		var $box = $('.dp-rating-box');
		var hasImdbRating = $box.find('.imdb-rating').length > 0;

		$.each(results, function(index, result) {
			if(result.type === 'imdb' && hasImdbRating) {
				// don't add a second IMDb
				return;
			}
			var $list = $('<span>', {
					'class': 'imdb-rating',
					'title': result.details || ''
				});
			$list.append('<i class="'+result.type+'-logo-small">'+result.label+'</i>');
			$list.append('<strong>'+result.rating+'</strong>/'+result.maxRating);
			$list.appendTo($box);
		});
	}

	// shamelessly taken from http://stackoverflow.com/questions/4292320
	function htmlNumericEntityUnescape(string) {
		return string.replace(/&#([^\s]*);/g, function(match, match2) {return String.fromCharCode(Number(match2));});
	}

	var annotate = function(data) {
		var result = [];
		if(data.imdbID && data.imdbRating !== 'N/A') {
			result.push({
				type: 'imdb',
				label: 'IMDb',
				rating: +data.imdbRating,
				maxRating: 10,
				details: null
			});
		}
		if(data.tomatoMeter !== 'N/A') {
			result.push({
				type: 'rotten',
				label: 'Rotten Tomatoes',
				rating: +data.tomatoMeter,
				maxRating: 100,
				details: data.tomatoConsensus !== 'N/A' ? htmlNumericEntityUnescape(data.tomatoConsensus) : null
			});
		}

		addRating(result);
	};

	var queries = [];

	function getReleaseInfo() {
		return {
			year: +$.trim($('#aiv-content-title .release-year').text())
		};
	}

	function getMovieDescription() {
		var title = $('#aiv-content-title').clone();
		title.find('*').remove();
		return $.trim(title.text());
	}

	var description = getMovieDescription();
	var year = getReleaseInfo().year;
	if(description && year) {
		queries.push(function() {
			return {
				t:			description,
				y:			year,
				tomatoes:	true
			};			
		});
	}

	if (description) {
		queries.push(function() {
			return {
				t:			description,
				tomatoes:	true
			};
		});
	}

	if(isDebug) {
		window.console.log('queries:', queries.length);
	}

	function fallbackQuery() {
		var curFn = queries.shift();
		if(typeof curFn === 'function') {
			var query = curFn();
			if(isDebug) {
				window.console.log('query', query);
			}
			$body.trigger('ratings.load', [query]);
		} else {
			window.console.error('Could not find any data');
		}
	}	

	$body.on('ratings.return', function(e, data) {
		if(data.Response === 'True') {
			if(isDebug) {
				window.console.debug('success', data);
			}
			annotate(data);
		} else {
			if(isDebug && data.Error) {
				window.console.debug('error', data.Error);
			}
			fallbackQuery(queries);
		}
	});

	if (queries.length > 0) {
		fallbackQuery();
	}

})(window.jQuery);
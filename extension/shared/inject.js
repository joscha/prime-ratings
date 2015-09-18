(function($) {
	'use strict';

	var isDebug = false;
	var $body = $('body');
	var lastTitle = "";

	//Taken from http://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
	function observeDOM() {
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		var eventListenerSupported = window.addEventListener;

		return function(obj, callback) {
			if (MutationObserver) {
				// define a new observer
				var obs = new MutationObserver(function(mutations, observer) {
				if (mutations[0].addedNodes.length || mutations[0].removedNodes.length)
					callback();
				});
				// have the observer observe foo for changes in children
				obs.observe(obj, { childList:true, subtree:true });
			} else if (eventListenerSupported) {
				obj.addEventListener('DOMNodeInserted', callback, false);
				obj.addEventListener('DOMNodeRemoved', callback, false);
			}
		};
	}

	function addRating(results) {
		//Check if hover window is available
		var $hoverbox = $('#universal-hover');
		var $box;
		if ($hoverbox.length) {
			if (isDebug) {
				window.console.debug("Hover div detected");
			}
			$box = $('#uh-starRating').append($('<div>', {
				'class': 'star-rating'
			}));
		} else {
			if (isDebug) {
				window.console.debug("No hover div detected");
			}
			$box = $('.dp-rating-box');
		}

		var hasImdbRating = $box.find('.imdb-rating').length > 0;

		$.each(results, function(index, result) {
			if (result.type === 'imdb' && hasImdbRating) {
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
		if (data.imdbID && data.imdbRating !== 'N/A') {
			result.push({
				type: 'imdb',
				label: 'IMDb',
				rating: +data.imdbRating,
				maxRating: 10,
				details: null
			});
		}
		if (data.tomatoMeter !== 'N/A') {
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
	function addQueries(description, year) {
		if (description && year) {
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
		if (isDebug) {
			window.console.log('queries:', queries.length);
		}
		//Get Ratings and stuff
		if (queries.length > 0) {
			fallbackQuery();
		}
	}

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

	function fallbackQuery() {
		var curFn = queries.shift();
		if (typeof curFn === 'function') {
			var query = curFn();
			if (isDebug) {
				window.console.log('query', query);
			}
			$body.trigger('ratings.load', [query]);
		} else {
			window.console.error('Could not find any data');
		}
	}

	$body.on('ratings.return', function(e, data) {
		if (data.Response === 'True') {
			queries = []; // we got a hit, so reset queries
			if (isDebug) {
				window.console.debug('success', data);
			}
			annotate(data);
		} else {
			if (isDebug && data.Error) {
				window.console.debug('error', data.Error);
			}
			fallbackQuery(queries);
		}
	});

	var description = getMovieDescription();
	var year = getReleaseInfo().year;
	addQueries(description, year);

	// Observe a specific DOM element if it exists:
	var $content = $('#content');
	if ($content.length) {
		if (isDebug) {
			window.console.log('Found content node', $content);
		}
		observeDOM()($content.get(0), function() {
			if (isDebug) {
				window.console.log('Content changed');
			}
			//check if hover div exists
			var $hoverbox = $('#universal-hover');
			if ($hoverbox.length === 0) {
				return;
			}

			// Get movie data from hover div
			var description = $hoverbox.find("#uh-title").text();
			var year = $hoverbox.find("#uh-releaseDate").text();

			if (description === lastTitle) {
				return;
			}
			lastTitle = description;
			addQueries(description, year);
		});
	}

})(window.jQuery);

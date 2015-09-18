(function($) {
	'use strict';

	var isDebug = false;
	var $body = $('body');
	var lastTitle = "";

	function addRating(results) {
		//Check if hover window is available
		var $hoverbox = $('#universal-hover');
		if ($hoverbox.length){
			if (isDebug) window.console.debug("Hover Div detected");
			$box = $('#uh-starRating');
		}
		else{
			if (isDebug) window.console.debug("No hover Div detected");
			var $box = $('.dp-rating-box');
		}
		
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
			var $hoverbox = $('#universal-hover');
			var $errorText = $("<span>Could not retrieve IMDB and Rotten Tomatoes Ratings!</span>");
			if ($hoverbox.length) $errorText.appendTo($('#uh-starRating'));
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
	

	//Get Ratings and stuff
	if (queries.length > 0) {
		fallbackQuery();
	}
	//Taken from http://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
	var observeDOM = (function(){
	    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
		eventListenerSupported = window.addEventListener;

	    return function(obj, callback){
		if( MutationObserver ){
		    // define a new observer
		    var obs = new MutationObserver(function(mutations, observer){
			if( mutations[0].addedNodes.length || mutations[0].removedNodes.length )
			    callback();
		    });
		    // have the observer observe foo for changes in children
		    obs.observe( obj, { childList:true, subtree:true });
		}
		else if( eventListenerSupported ){
		    obj.addEventListener('DOMNodeInserted', callback, false);
		    obj.addEventListener('DOMNodeRemoved', callback, false);
		}
	    }
	})();

	// Observe a specific DOM element if it exists:
	if (document.getElementById('content') != null)	observeDOM( document.getElementById('content') ,function(){ 
		//check if hover div exists
		var $hoverbox = $('#universal-hover');
		if ($hoverbox == null) return;
		
		//Get Movie data from hover div
		var description = $("#header a:first").text();
		var year = $("#uh-releaseDate").text();
		
		if (description == lastTitle) return;
		
		lastTitle = description;
		
		if(description && year) {
			queries.push(function() {
				return {
					t:			description,
					y:			year,
					tomatoes:	true
				};			
			});
		}

		else if (description) {
			queries.push(function() {
				return {
					t:			description,
					tomatoes:	true
				};
			});
		}
	   
		window.console.log("Requested:"+description);

	   
	   //Get Ratings and stuff
		if (queries.length > 0) {
			fallbackQuery();
		}
	});

})(window.jQuery);
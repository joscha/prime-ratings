(function($) {
	'use strict';
	
	var $body = $('body');
	$body.on('ratings.load',function(e, query) {
		$.getJSON('https://www.omdbapi.com/', query, function(data) {
			query.t = query.t
				.replace('[dt./OV]', '')
				.replace('[OV]', '')
				.replace('[OV/OmU]', '');

			$body.trigger('ratings.return', [data]);
		});
	});
})(window.jQuery);
(function($) {
	'use strict';
	
	var $body = $('body');
	$body.on('ratings.load',function(e, query) {
		query.t = query.t
				.replace('[dt./OV]', '')
				.replace('[OV]', '')
				.replace('[OV/OmU]', '');

		$.getJSON('https://www.omdbapi.com/', query, function(data) {
			$body.trigger('ratings.return', [data]);
		});
	});
})(window.jQuery);
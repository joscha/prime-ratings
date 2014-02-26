(function($) {
	'use strict';
	
	var $body = $('body');

	$body.on('ratings.load',function(e, query) {
		self.port.emit('ratings.load', query);
	});

	self.port.on('ratings.return', function(data) {
		$body.trigger('ratings.return', [data]);
	});
})(window.jQuery);
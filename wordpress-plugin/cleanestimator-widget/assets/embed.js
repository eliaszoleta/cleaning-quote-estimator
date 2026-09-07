/**
 * Resizes any [cleanestimator_widget] iframe on the page as the visitor
 * moves through the calculator's steps. A single delegated listener
 * handles every iframe the shortcode has rendered on this page, matched
 * by contentWindow rather than a per-instance binding, so multiple
 * embeds on one page each resize independently and correctly.
 */
(function () {
	function onMessage(event) {
		if (!event || !event.data || event.data.type !== 'cleancalc-resize') {
			return;
		}
		var iframes = document.querySelectorAll('.cleanestimator-widget-iframe');
		for (var i = 0; i < iframes.length; i++) {
			if (iframes[i].contentWindow === event.source) {
				iframes[i].style.height = Math.max(event.data.height, 300) + 'px';
				break;
			}
		}
	}
	window.addEventListener('message', onMessage);
})();

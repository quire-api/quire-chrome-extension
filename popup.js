(function () {
//use old version since gtag.js unable to disable checkProtocolTask
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){	
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),	
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)	
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'G-VDRZSEZ5M5', 'auto');
ga('set', 'checkProtocolTask', null);
ga('send', 'pageview', '/ge/popup'); //GA reject url like chrome-extension://...

	$.ajaxSetup({
		headers: {"Quire-Agent": "Chrome-Extension 0.9.31"}
	});

	var URL = 'https://quire.io',
		RESET_BADGE = 'quire.rt.bg';

	var bgPage = chrome.extension.getBackgroundPage();

	window.onload = function() {
		var unitSelector = '.arrow-dropdown-menu';
		extensionInit(unitSelector);
		openNotification();

		$(unitSelector)
		.off('click', 'li') //remove original listener first (which is registered in pack.js)
		.on('click', 'a', onClickLink)
		.on('click', 'li', onClickLink);

		chrome.runtime.sendMessage({type: RESET_BADGE}, function(response) {}); //background.js receives it and clear badge text immediately
	}

	function onClickLink(evt) {
		var $target = $(evt.currentTarget);
		var targetPath = $target.data('url') || $target.attr('href'); //target may be li or a
		if (targetPath) {
			if (targetPath == '/')
				bgPage.checkChromeTabs(null);
			else
				bgPage.checkChromeTabs(URL + targetPath);
		}

		evt.stopPropagation();
		evt.preventDefault();
	}
})()

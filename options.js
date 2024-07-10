(function () {
//use old version since gtag.js unable to disable checkProtocolTask
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){	
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),	
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)	
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'G-VDRZSEZ5M5', 'auto');
ga('set', 'checkProtocolTask', null);
ga('send', 'pageview', '/ge/options'); //GA reject url like chrome-extension://...

	$.ajaxSetup({
		headers: {"Quire-Agent": "Chrome-Extension 0.9.32"}
	});

	var $period = $('#period'),
		$turnon = $('#turnon'),
		$turnoff = $('#turnoff'),
		$save = $('#save');

	var PUSH_NOTIFICATION_PERIOD = 'quire.upd.itv';

	$turnon.on('click', function () {
		$period[0].disabled = false;
		disableSaveBtn();
	});
	$turnoff.on('click', function () {
		$period[0].disabled = true;
		disableSaveBtn();
	});
	$period.on('change', function () {
		disableSaveBtn();
	});

	function disableSaveBtn() {
		var period = $period[0].value,
			turnon = $turnon[0].checked,
			turnoff = $turnoff[0].checked,
			isDirty = true;

		chrome.storage.sync.get({period: 900000, turnon: true, turnoff: false}, function(items) {
			if (period == items.period && turnon == items.turnon && turnoff == items.turnoff) {
				isDirty = false;
			}
			$save[0].disabled = !isDirty;
		});
	}

	// Saves options to chrome.storage
	function save_options() {
		var period = $period[0].value,
			turnon = $turnon[0].checked,
			turnoff = $turnoff[0].checked;

		chrome.storage.sync.set({period: period, turnon: turnon, turnoff: turnoff}, function() {
			chrome.runtime.sendMessage({type: PUSH_NOTIFICATION_PERIOD}, function(response) {}); //background.js receives this

			$save[0].disabled = true;
		});
	}

	function restore_options() {
		chrome.storage.sync.get({period: 900000, turnon: true, turnoff: false}, function(items) {
			$period[0].value = items.period;
			$turnon[0].checked = items.turnon;
			$turnoff[0].checked = items.turnoff;
			if (items.turnoff) {
				$period[0].disabled = true;
			}
		});
		$save[0].disabled = true;
	}
	window.onload = restore_options;
	$save.on('click', save_options);
})();

(function() {
//use old version since gtag.js unable to disable checkProtocolTask
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){	
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),	
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)	
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'G-VDRZSEZ5M5', 'auto');
ga('set', 'checkProtocolTask', null);
ga('send', 'pageview', '/ge/background'); //GA reject url like chrome-extension://...

	$.ajaxSetup({
		headers: {"Quire-Agent": "Chrome-Extension 0.9.32"}
	});

	var loadNotificationPeriod = 60000, //1 min, same as server
		checkPeriodForFirstStart = 20000, //20 sec, check when first start
		URL = "https://quire.io",
		stCurrentUser = "curusr",
		notiCount = 0, pushNotificationPeriod,

		loginChecker, pushNotiChecker, updateBadgeChecker,
		PUSH_NOTIFICATION_PERIOD = 'quire.upd.itv',
		RESET_BADGE = 'quire.rt.bg',
		tabId;

	//check login or not
	function checkUserLogin() {
		clearTimeout(loginChecker); //clear timeout before check

		if (updateBadgeChecker)//already login
			return;
		try {
			sendQS([stCurrentUser, null], function(response) {
				if (response && (typeof response) !== 'string') //login success
					loginSuccess();
				else
					loginFail();
			}, loginFail);
		} catch (e) {
			loginFail();
		}
	}
	function checkUserLoginLater() {
		clearTimeout(loginChecker); //clear timeout before check
		loginChecker = setTimeout(checkUserLogin, 20000); //#7922 (not too short)
	}

	checkUserLogin();

	function loginSuccess() {
		chrome.browserAction.setIcon({path: 'logo/logomark_19.png'});
		chrome.browserAction.setPopup({popup: 'popup.html'});

		extensionInit(null, function(xhr) {
			if (xhr.status == 403) checkUserLoginLater(); //retry when not login
		});

		chrome.storage.sync.get({period: 900000}, function(items) {
			pushNotificationPeriod = items.period;
			pushNotiChecker = setInterval(createPushNotification, pushNotificationPeriod);
		});

		updateBadgeChecker = setInterval(updateBadgeText, loadNotificationPeriod);

		setTimeout(function () { //check noti count once when login success
			updateBadgeText();
			createPushNotification();
		}, checkPeriodForFirstStart)
	}

	function updateBadgeText() {
		notiCount = $('.notification-count').text();
		chrome.browserAction.setBadgeText({
			text: notiCount > 0 ? notiCount : ''
		});
	}

	var latestNoti, notiId = 0, lastMsg; //reuse notiId, make sure to delete the previous desktop notification
	function createPushNotification() {
		if (notiCount > 0) {
			chrome.storage.sync.get({turnoff: false}, function(items) {
				//create desktop notification when newest notification's createAt is later than last notification
				if (!items.turnoff && (!latestNoti || latestNoti.createdAt.epoch < loadedNotisBeforeOpen[0].createdAt.epoch)) {
					latestNoti = loadedNotisBeforeOpen[0];

					var latestNotiMsg = latestNoti.message; //retrieve the latest msg from global variable in notification.js
					latestNotiMsg = latestNotiMsg.replace(/<.*?>/g, ''); //remove html tag like <a></a>
					var msg = notiCount - 1 ? '\nand ' + (notiCount - 1) + ' more' : '';

					if (lastMsg != (latestNotiMsg + msg))
							notiId++;//need new id, otherwise it will not show

					lastMsg = latestNotiMsg + msg;
					chrome.notifications.create('id' + notiId, {
						type: "basic",
						title: "Quire",
						message: lastMsg,
						iconUrl: "logo/logomark_128.png"
					});
				}
			});
		}
	}

	function loginFail() {
		chrome.browserAction.setBadgeText({text: ''});
		chrome.browserAction.setIcon({path: 'logo/logomark-grey_19.png'});
		chrome.browserAction.setPopup({popup: ''});
		chrome.browserAction.onClicked.removeListener(onClickIcon); //prevent register multiple listeners
		chrome.browserAction.onClicked.addListener(onClickIcon);

		//stop all timer
		clearInterval(updateBadgeChecker);
		clearInterval(pushNotiChecker);
		updateBadgeChecker = null;

		//check login status
		checkUserLoginLater();
	}

	function onClickIcon() {
		checkUserLogin();//#8124: Check login when the icon is clicked
		checkChromeTabs(null);//linkToLogin
	}

	/**
	 * global function for both background.js and popup.js
	 * check browser tabs and open [link]
	 *
	 * when [link] is null, there are two cases:
	 * 1. if there is a browser tab visiting quire.io, then just open it (no need to change URL)
	 * 2. if no browser tab, then visit workspace instead of home page, i.e., https://quire.io/w
	**/
	checkChromeTabs = function(link) {
		chrome.tabs.query({}, function(tabs) {
			var needCreate = true;
			tabs.reverse().some(function(tab) {
				if (tab.id == tabId) {
					needCreate = false;
					var opts = link ? {active: true, url: link} : {active: true};
					chrome.tabs.update(tab.id, opts);
					return true;
				}
			});

			if (needCreate) {
				link = link ? link : URL + '/w';
				chrome.tabs.create({url: link}, function(tab) {
				   tabId = tab.id;
				});
			}
		});
	}

	function onClickNotification(id) {
		var targetPath = URL + loadedNotisBeforeOpen[0].url;
		checkChromeTabs(targetPath);
		chrome.notifications.clear(id, function(cleared) {}); //remove desktop notification once clicked
	}

	chrome.notifications.onClicked.addListener(onClickNotification);

	//msg from option and popup page
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.type == PUSH_NOTIFICATION_PERIOD) {
			chrome.storage.sync.get({period: 900000}, function(items) {
				pushNotificationPeriod = items.period;
				clearInterval(pushNotiChecker);
				pushNotiChecker = setInterval(createPushNotification, pushNotificationPeriod);
			});
		} else if (request.type == RESET_BADGE) {
			$('.notification-count').text('');
			updateBadgeText();
		}
		//https://stackoverflow.com/questions/59914490/chrome-extensions-unchecked-runtime-lasterror-the-message-port-closed-before
		sendResponse(true);
	});
})();


var notifCountResolver;
function resolveCountData(data) {
	var resolve = notifCountResolver;
	if (resolve) {
		notifCountResolver = null;
		resolve(data);
	}
}

///From web page
window.addEventListener('message',
	function (event) {
		///3. resolve onMessage for chrome.tabs.sendMessage
		if (event.data && event.data.type == 'quire.notifCount')
			resolveCountData(event.data);
	}, false);

///From ce
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (sender.id == 'fafnibnpfejgmleffgpnddkboddbipgm' 
			&& message.content == 'quire.notifCount.ask') {
		resolveCountData(); //safer if [getNotifCountFromTabs] called twice
		notifCountResolver = sendResponse;
		///1. postMessage to pack.js
		window.postMessage({type: 'quire.notifCount.ask'}, '*');
		return true; // return true to indicate you want to send a response asynchronously
	} else sendResponse(null);
});
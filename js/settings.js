function readBooleanSetting(s, defaultValue){

	if ('settings' in batotoJSON)
		if (s in batotoJSON.settings)
			return batotoJSON.settings[s] === true;

	return defaultValue;

}

function readStringSetting(s, defaultValue){

	if ('settings' in batotoJSON)
		if (s in batotoJSON.settings)
			return batotoJSON.settings[s];

	return defaultValue;

}

function isClearAfterDownload(){
	return readBooleanSetting('clearAfterDownload', false);
} //Remove download from list after downloading

function isReadClipboard(){
	return readBooleanSetting('readClipboard', false);
} //Monitor clipboard for Batoto URLs

function isStartDownloadingAutomatically(){
	return readBooleanSetting('autoStartDownload', false);
} //Begin downloading as soon as a URL is added

function isLogDownloadHistory(){
	return readBooleanSetting('logDownloads', false);
} //Keep history of URLs and files downloaded //TODO: set limit? Log X instead?

function getDownloadDirectory(){
	return readStringSetting('downloadDirectory', '/tmp/');
}

function getRssFeed(){
	return readStringSetting('rssFeed', '');
}
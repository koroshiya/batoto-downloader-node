function readPreference(key, defaultValue){

	if ('preferences' in batotoJSON)
		if (key in batotoJSON.preferences)
			return batotoJSON.preferences[key];

	return defaultValue;

}

function writePreference(key, value, callback){

	if (!('preferences' in batotoJSON)){
		batotoJSON.preferences = {};
	}
	
	batotoJSON.preferences[key] = value;

	writeBatotoJSON(callback);

}

function getLastRssItemDate(){
	return readPreference('lastRssItemDate', '');
}

function setLastRssItemDate(itemDate, callback){
	writePreference('lastRssItemDate', itemDate.toString(), callback);
}
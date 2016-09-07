function readPreference(key, defaultValue){

	if ('preferences' in batotoJSON)
		if (key in batotoJSON.preferences)
			return batotoJSON.preferences[key];

	return defaultValue;

}

function writePreference(key, value){

	if (!('preferences' in batotoJSON)){
		batotoJSON.preferences = {};
	}
	
	batotoJSON.preferences[key] = value;

	writeBatotoJSON();

}

function getLastRssItemDate(){
	return readPreference('lastRssItemDate', '');
}

function setLastRssItemDate(itemDate){
	return writePreference('lastRssItemDate', itemDate.toString());
}
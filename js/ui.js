function parseUrl(url, callback){

	if (typeof callback === 'undefined'){
		callback = alertCallback;
	}

	if (typeof url === 'undefined' || url === null){
		url = $("#urlEntry").val().trim();
	}

	if (url.startsWith('http://')){
		url = 'https' + url.substring('http'.length);
	}

	var matches = batotoRegex.test(url) ? url.match(batotoRegex) : [];

	if (matches.length != 1){
		callback(2, 'Invalid chapter/series URL - '+url);
	}else {
		$("#urlEntry").val('');
		alertCallback(1, 'Added url: '+url);
		downloadURLInfo(url, callback);
	}

}

var alertCallback = function(success, err){
	if (typeof err !== 'undefined' && err){
		
		var btn = $('<div class="alert">'+err+'</div>');

		if (success === 0)
			btn.addClass('alert-err');
		else if (success === 1)
			btn.delay(3000).fadeOut(3000);
		else if (success === 2)
			btn.addClass('alert-warn').delay(5000).fadeOut(5000);

		var close = $('<a href="#" class="closebtn">&times;</a>');
		close.click(function(event) {
			close.parent().css('display', 'none');
		});

		btn.append(close);
		$("#alert-div").append(btn);

		var divs = $("#alert-div > div");
		$.each(divs, function(index, val) {
			var div = $(val);
			if (div.css('display') === 'none'){
				div.remove();
			}
		});
		
	}
};

function addChapterToTable(vals, callback){

	addRowToTable(vals);

	if (!('chapters' in batotoJSON))
		batotoJSON.chapters = [];

	batotoJSON.chapters.push(vals);
	writeBatotoJSON(callback);

}

function addRowToTable(vals){

	if ('size' in vals && vals.size > 0){
		vals.size = getHumanReadableSize(vals.size);
	}else{
		vals.size = '';
	}

	var tbody = $("#urlList > tbody");

	var tr = Handlebars.templates.chapterRow(vals)

	//TODO: add progress to vals; dropdown for actions?

	tbody.append(tr);

}

function btnClickDownload(btn, hash){
	$(btn).text('Queued');
	$(btn).off('click');
	indexChapter(hash);
}

function btnClickClear(btn, hash){
	deleteChapter(hash, function(){
		$(btn).closest('tr').remove();
	});
}

function showAboutPage(){
	vexPage(
		Handlebars.templates.about({})
	);
}

function buildSettingsPage(){

	var newVals = [];

	$.each(batotoKnownSettings, function(section, vals) {

		$.each(vals, function(index, val) {

			var setting = {
				value: val.defaultValue,
				description: val.description,
				key: index
			};
			if ('settings' in batotoJSON && index in batotoJSON.settings){
				setting.value = batotoJSON.settings[index];
			}

			if (section == 'booleans'){
				setting.isBoolean = true;
			}else{
				setting.isString = true;
			}

			newVals.push(setting);

		});

	});

	return Handlebars.templates.settings({
		settings:newVals
	});

}
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

function addChapterToTable(vals){

	addRowToTable(vals);

	if (!('chapters' in batotoJSON))
		batotoJSON.chapters = [];

	batotoJSON.chapters.push(vals);
	writeBatotoJSON();

}

function addRowToTable(vals){

	var tbody = $("#urlList > tbody");

	var tr = $("<tr>");
	var row = $("<td>").text(vals.hash);
	var series = $("<td>").text(vals.series);
	var chapter = $("<td>").text(vals.chapter);
	var pages = $("<td>").text(vals.pages);
	var size = $("<td>").text('');
	var progress = $("<td>").text('Ready to download'); //TODO: add progress to vals; dropdown for actions?
	var btn = $("<button>");

	if ('size' in vals){
		size.text(getHumanReadableSize(vals.size));
	}

	if ('complete' in vals && vals.complete === true){
		btn.text('Clear')
			.addClass('btn btn-info')
			.click(function(event) {
				deleteChapter(vals);
				$(this).parent().parent().remove();
			});
	}else{
		btn.text('Download')
			.addClass('btn btn-primary')
			.click(function(event) {
				$(this).text('Queued');
				$(this).off('click');
				indexChapter(vals.hash);
			});
	}

	var download = $("<td>").html(btn);

	tr.append(row)
		.append(series)
		.append(chapter)
		.append(pages)
		.append(size)
		.append(progress)
		.append(download);

	tbody.append(tr);

}

function showAboutPage(){
	location.href = '#aboutPageLink';
}

function buildSettingsPage(){

	var table = $(
		'<div>'+
			'<table class="hover">'+
		        '<thead>'+
		          '<tr>'+
		            '<th>Setting</th>'+
		            '<th>Value</th>'+
		          '</tr>'+
		        '</thead>'+
		        '<tbody></tbody>'+

	    	'</table>'+
    	'</div>'
    );

	var tbody = table.find("tbody");

	$.each(batotoKnownSettings, function(section, vals) {

		$.each(vals, function(index, val) {
		
			var tr = $("<tr>");
			var td1 = $("<td>");
			var td2 = $("<td>");

			var defVal = val.defaultValue;
			if ('settings' in batotoJSON && index in batotoJSON.settings){
				defVal = batotoJSON.settings[index];
			}

			var desc = $("<b>").text(val.description);
			var inp = $("<input>").attr('name', index);
			if (section == 'booleans'){
				inp.attr('type', 'checkbox');
				if (defVal === true){
					inp.attr('checked', 'checked');
				}
			}else{
				inp.attr('type', 'text').val(defVal); //TODO: not setting value
			}

			td1.append(desc);
			td2.append(inp);

			tr.append(td1);
			tr.append(td2);

			tbody.append(tr);

		});

	});

	return table.html();

}
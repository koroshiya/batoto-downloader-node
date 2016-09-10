$(function(){

	readFileIntoBuffer(batotoJSONFile, function(buffer){

		if (buffer){
			batotoJSON = JSON.parse(buffer);
			if ('chapters' in batotoJSON){
				$.each(batotoJSON.chapters, function(index, val) {
					addRowToTable(val);
				});
			}
		}

		$("#urlEntry").keypress(function (e) {
		 if (e.which == 13){
		 	var val = $(this).val();
		    parseUrl(val);
			$(this).val('');
		    return false;  
		  }
		});

		if (isReadClipboard()){
			readClipboard();
		}

	});

});

function readClipboard(){

	var data = clipboard.readText();

	console.log('Clipboard: '+data);

	if (data.length > 0 && batotoRegex.test(data)){
		console.log('test succeeded');
		clipboard.writeText(''); //Clear clipboard, so we don't parse the same url twice
		var matches = data.match(batotoRegex);
		console.log(matches);
		var len = matches.length;

		for (var index = 0; i < len; index++){
			parseUrl(matches[index]);
		}
	}

	setTimeout(readClipboard,1000);

}
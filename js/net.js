function testImageUrl(url, callback){

	sendRequest(url, 'HEAD', null, null, function(err, res, html){
		if (err) console.log(err);
		callback(res.statusCode, res.headers["content-length"]);
	});

}

function downloadFile(url, dest, cb, zipfile, chapterSize){

	if (dest.lastIndexOf('/') !== dest.length - 1) dest += '/';

	var chunks = url.split('/');
	var chunk = chunks[chunks.length - 1]
	dest += chunk;

	var file = fs.createWriteStream(dest);
	file.on('finish', function() {
	  file.close(function(){

	  	readFileIntoBuffer(dest, function(buffer){
        	zipfile.file(chunk, buffer, "");
		    fs.unlink(dest);
		  	cb();
	  	})

	  });
	});

	request
	  .get(url)
	  .on('error', function(err) {
		fs.unlink(dest);
		if (err) console.log(err);
		cb();
	  })
	  .pipe(file);

}

function post(fullurl, args, headers, callback){

	sendRequest(fullurl, 'POST', args, headers, callback);

}

function get(fullurl, args, headers, callback){

	sendRequest(fullurl, 'GET', args, headers, callback);

}

function sendRequest(fullurl, method, args, headers, callback){

	if (args === null) args = {};
	if (headers === null) headers = {};

	var opts = {
		url:fullurl,
		method:method,
		form:args,
		headers:headers
	};
	request(opts, function(err, res, body){
		console.log(`STATUS: ${res.statusCode}`);
		console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
	    callback(err, res, body);
	});

}
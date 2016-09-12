var batotoJSONFile = 'batoto.json';
var batotoJSON = {};
var batotoExtensions = [".png", ".jpg", ".jpeg", ".gif"];
var batotoDownloadQueue = [];
var batotoInfoQueue = [];
var batotoRegex = /http(s)?:\/\/(www\.)?bato.to\/(reader#|comic\/)\w+/g;
var batotoDownloadInProgress = false;
var batotoInfoInProgress = false;
var batotoHeaders = {};
var batotoKnownSettings = {
	
	strings:{
		downloadDirectory:{
			description:'Directory in which to place downloaded files',
			defaultValue:'/tmp/'
		},
		rssFeed:{
			description:'Personal Batoto follows RSS feed URL',
			defaultValue:''
		}
	},

	booleans:{
		clearAfterDownload:{
			description:'Clear chapter from list after downloading it',
			defaultValue:false
		},
		readClipboard:{
			description:'Listen to clipboard for Batoto URLs',
			defaultValue:false
		},
	},

};

function downloadURLInfo(url, callback){

	if (batotoInfoInProgress){
		//console.log('adding url: '+url);
		batotoInfoQueue.push(url);
		callback(1, 'Added to queue: '+url);
	}else{
		batotoInfoInProgress = true;

		console.log('parsing url: '+url);

		var isComic = url.indexOf('bato.to/comic') > -1;

		var cb = function(success, err){
			
			var index;

			if (success && (!err || err.length === 0)){
				index = url.indexOf('#');
				err = 'Finished downloading ';
				if (index > -1){
					var stub = url.substring(index + 1);
					var chapter = findChapterByHash(stub);
					if (chapter){
						err += chapter.series+' '+chapter.chapter;
					}else{
						err += url;
					}
				}else{
					err += url;
				}
			}
			callback(success, err);

			index = $.inArray(url, batotoInfoQueue);
			if (index >= 0){
				batotoInfoQueue.splice(index,1);
			}

			batotoInfoInProgress = false;
			if (batotoInfoQueue.length > 0){
				downloadURLInfo(batotoInfoQueue[0], alertCallback);
			}
		};

		if (isComic){
			downloadComicInfo(url, cb);
		}else{
			downloadChapterInfo(url, cb);
		}

	}
	
}

function downloadChapterInfo(url, callback){

	var index = url.indexOf('#');
	var bareMinimumStub = "https://bato.to/reader#";

	if (index >= bareMinimumStub.length - 1){
		console.log('valid chapter');

		var stub = url.substring(index + 1);
		var chapter = findChapterByHash(stub);

		if (!chapter){

			var path = 'http://bato.to/areader?id='+stub+'&p=1';
			var referer = 'http://bato.to/reader';

			console.log('posting chapter: '+path);

			postForm(path, referer, function (err, html) {

			    if (err) {
			        callback(0, err);
			    }else{
			    	var vals = processChapterInfo(stub, html);
			    	if (vals){
			    		addChapterToTable(vals, function(){
			        		callback(1, 'Added '+vals.series+' '+vals.chapter);
			    		});
			    	}else{
			    		callback(0, 'No chapter found at '+stub);
			    	}
				}
				
			});

		}else{
			callback(2, chapter.hash+' already in list');
		}

	}else{
		console.log('invalid chapter');
		callback(1, 'Invalid chapter URL: '+url);
	}

}

function downloadComicInfo(url, callback){

	var bareMinimumStub = "https://bato.to/comic/_/comics/";

	if (url.length > bareMinimumStub.length){

		var referer = 'https://bato.to';

		console.log('downloading page');

		postForm(url, referer, function (err, html) {
			console.log('downloaded page');
		    if (err) {
		    	console.log('err');
		        callback(0, err);
		    }else{
		    	console.log('success');
		    	var trs = $(html).find('tr.chapter_row.lang_English');
		    	var current = -1;

		    	var cb = function(){
			    	if (++current < trs.length){
			    		var href = $($(trs[current]).find('td')[0]).find('a').attr('href');
			    		if (href.indexOf('bato.to/reader') > -1){
			    			parseUrl(href, cb);
			    		}else{
			    			cb();
			    		}
			    	}else{
			    		callback(1, 'Finished indexing comic');
			    	}
		    	};
		    	cb();
			}
			
		});

	}else{
		callback(0, 'Invalid series URL: '+url);
	}
	
}

function postForm(url, referer, callback) {

	if (!isLoggedIn()){

		vexLoginPrompt(function(err){
			if (err){
				callback(err, '');
			}else{
				postForm(url, referer, callback);
			}
		});
		
	}else{

		var headers = batotoHeaders;
		headers.Referer = referer;
		//headers['set-cookie'].push('supress_webtoon=t');

		post(url, {}, headers, function(err, res, data){
			callback(err, data);
		});

	}

}

function processChapterInfo(stub, html){

	var domdata = $(html);

	var group = $(domdata.find('select[name=group_select]').find('option[selected=selected]')[0]).text().split('-')[0];
	var series = $(domdata.find('ul > li > a')[0]).text();
	var chapter = $(domdata.find('select[name=chapter_select]').find('option[selected=selected]')[0]).text();
	var pFormat = $(domdata.find('img[src*="img.bato.to/comics/2"]')[0]).attr('src'); //comics/2 ensures we only get comics from year 2000 onwards; not misc images in comics dir
	var pages = $(domdata.find('select[name=page_select]')[0]).find('option').length;

	if (typeof pFormat === 'undefined'){
		return false;
	}

	pFormat = pFormat.substring(0, pFormat.lastIndexOf('/') + 1);
	if (pFormat.startsWith('https://')) pFormat = 'http' + pFormat.substring(5); //Images must be over http
	if (pages === 0) pages = 1;
	
	group = sanitize(group);
	series = sanitize(series);
	chapter = sanitize(chapter);

	return {
		'hash':stub,
		'group':group,
		'series':series,
		'chapter':chapter,
		'pages':pages,
		'format':pFormat
	};
			
}

function findChapterByHash(hash){

	if ('chapters' in batotoJSON)
		for (var i = batotoJSON.chapters.length - 1; i >= 0; i--)
			if (batotoJSON.chapters[i].hash === hash)
				return batotoJSON.chapters[i];
	
	return false;

}

function updateChapter(newChapter, callback){

	if ('chapters' in batotoJSON)
		for (var i = batotoJSON.chapters.length - 1; i >= 0; i--)
			if (batotoJSON.chapters[i].hash === newChapter.hash)
				batotoJSON.chapters[i] = newChapter;
	
	writeBatotoJSON(callback);

}

function deleteChapter(hash, callback){

	var arr = [];

	if ('chapters' in batotoJSON)
		for (var i = batotoJSON.chapters.length - 1; i >= 0; i--)
			if (batotoJSON.chapters[i].hash !== hash)
				arr.push(batotoJSON.chapters[i]);

	batotoJSON.chapters = arr;
	
	writeBatotoJSON(callback);

}

function indexChapter(hash){

	//TODO: lock row while downloading
	//Make only button "Cancel"
	//Prevent force close of downloader? Prompt are you sure?
	//TODO: have visual queue to see how many are having info downloaded?
	//Add to table instead?

	if (batotoDownloadInProgress){
		batotoDownloadQueue.push(hash);
	}else{

		batotoDownloadInProgress = true;
		var trs = $("#urlList > tbody > tr");
		var len = trs.length;
		var chapter = false;
		var prog = false;
		var sz = false;
		var btn = false;

		for (var i = 0; i < len; i++){

			var tr = $(trs[i]);
			var tds = tr.find('td');
			var trHash = $(tds[0]).text();

			if (trHash === hash){
				btn = $($(tds[6]).find('button')[0]);
				prog = $(tds[5]);
				sz = $(tds[4]);
				chapter = findChapterByHash(hash);
				console.log(chapter);
				if (chapter) break;
			}

		}

		if (chapter){
			var current = -1;
			len = chapter.pages;
			var urls = [];
			var totalSize = 0;

			if (btn){
				btn.text('In Progress');
			}

			var cb = function(){
				if (++current < len){
					prog.text('Indexing page '+current);
					sz.text(getHumanReadableSize(totalSize));
					findExtension(current, chapter, function(url, size){
						if (url){
							console.log('Valid url: '+url);
							urls.push(url);
							totalSize += parseInt(size);
						}else{
							console.log('No valid url');
						}
						cb();
					});
				}else{
					console.log('Download chapter');
					sz.text(getHumanReadableSize(totalSize));
					downloadChapter(chapter, urls, prog, totalSize, function(){
						finishDownloadingChapter(true, hash, chapter, totalSize);
					});
				}
			};
			cb();
		}else{
			alertCallback(0, "Couldn't find data for hash: "+hash);
			//finishDownloadingChapter(false, hash, {}, 0);
		}

	}


}

function finishDownloadingChapter(success, hash, chapter, totalSize){
	var index = $.inArray(hash, batotoDownloadQueue);
	if (index >= 0){
		delete batotoDownloadQueue[index];
	}

	if (success){
		if (isClearAfterDownload()){
			alertCallback(1, 'Finished downloading '+chapter.series+' '+chapter.chapter);
			deleteChapter(hash, resumeDownloadQueue);
		}else{
			chapter.complete = true;
			chapter.size = totalSize;
			updateChapter(chapter, resumeDownloadQueue);
		}
	}else{
		//TODO: 
		resumeDownloadQueue();
	}
	
}

function resumeDownloadQueue(){

	batotoDownloadInProgress = false;

	var newHash = false;
	while (batotoDownloadQueue.length > 0){
		var newHash = batotoDownloadQueue[0];
		if (typeof newHash !== 'undefined'){
			break;
		}else{
			newHash = false;
			delete batotoDownloadQueue[0];
		}
	}
	if (newHash){
		indexChapter(newHash);
	}

}

function downloadChapter(chapter, urls, prog, chapterSize, callback){

	var current = -1;
	var len = urls.length;

	if (len > 0){

		var dest = getDownloadDirectory();
		var name = chapter.series + " - " + chapter.chapter + " by " + chapter.group + ".zip";
		var zipfile = new zip();
		var cb = function(){
			if (++current < len){
				prog.text('Downloading page '+current);
				downloadFile(urls[current], dest, cb, zipfile, chapterSize);
			}else{
				var data = zipfile.generate({base64:false,compression:'DEFLATE'});
				fs.writeFile(dest+name, data, 'binary', function(err){
					if (err)
						console.log(err);
					else{
						prog.text('Complete');
						var btn = $("<button>");
						btn.text('Clear')
							.addClass('btn btn-info')
							.click(function(event) {
								btnClickClear(btn[0], chapter.hash);
							});
						prog.next().html(btn);
						callback();
					}

				});
			}
		};
		cb();

	}else{

		prog.text('Error - No pages found');
		callback();

	}

}

function findExtension(i, chapter, callback){

	i += 1; //index -> page number

	var current = -1;
	var len = batotoExtensions.length;
	var cb = function(){
		if (++current < len){
			console.log('Indexing page: '+i);
			var fullurl = chapter.format + 'img' + ("000000" + i).slice(-6) + batotoExtensions[current];
			console.log('Testing url '+fullurl);
			testImageUrl(fullurl, function(status, size){
				console.log('Status '+status);
				if (status == 200){
					callback(fullurl, size);
				}else{
					cb();
				}
			});
		}else{
			callback(false);
		}
	};
	cb();

}







function showSettingsPage(){

	var html = buildSettingsPage();
	vexSettingsPage(html, function(data){
		if (data){

			var settings = {};

			$.each(data, function(index, val) {
				
				if (index in batotoKnownSettings.booleans){
					settings[index] = true;
				}else if (index in batotoKnownSettings.strings){
					settings[index] = val;
				}else{
					console.log('Unknown setting: '+index);
				}

			});

			batotoJSON.settings = settings;
			writeBatotoJSON(function(){
				alertCallback(1, 'Settings updated');
			});
		}
	});

}

function getHumanReadableSize(bytes){

	if (bytes < 1024){
		return bytes + "B";
	}else if (bytes < 1024 * 1024){
		return parseInt(bytes / 1024) + "KB";
	}else{
		return parseInt(bytes / 1024 / 1024) + "MB";
	}

}

function isLoggedIn(){
	return true;
	//return 'set-cookie' in batotoHeaders && batotoHeaders['set-cookie'].length > 1;
}

function login(username, password, callback){

	httpsReq('/forums', {}, function(err, res, data){

		dom = $(data);
		var loginDiv = $(dom.find("#login")[0]);

		loginDiv.find('#ips_username').val(username);
		loginDiv.find('#ips_password').val(password);
		loginDiv.find('#inline_remember').prop('checked', false);
		loginDiv.find('#inline_invisible').prop('checked', true);
		var data = loginDiv.serializeArray().reduce(function(m,o){ m[o.name] = o.value; return m;}, {});

		httpsForm(loginDiv.attr('action'), data, function(status, headers, html){

			fs.writeFile("/tmp/test.log", html, function(err){
				if (err) console.log(err);
			});

			if (status == 200){

				batotoHeaders = headers['set-cookie'];

				for (var i = resHeaders.length - 1; i >= 0; i--) {
					if (resHeaders[i].indexOf('ipsconnect') > -1){
						batotoHeaders = {'set-cookie':resHeaders};
						break;
					}
				}

				if (!('set-cookie' in batotoHeaders))
					batotoHeaders['set-cookie'] = [];

				batotoHeaders['set-cookie'].push('supress_webtoon=t');
				
			}

			callback(status == 200);

		});

	});

}

function checkRssFeed(){

	//TODO: progress dialog

	var feedUrl = getRssFeed();
	if (feedUrl.length <= "https://bato.to/myfollows_rss?secret=".length){
		alertCallback(0, "No RSS feed defined in Tools -> Settings");
	}else{

		var lastDate = getLastRssItemDate();
		lastDate = lastDate.length > 0 ? new Date(lastDate) : false;

		feed(feedUrl, function(err, articles) {
			if (err){
				console.log(err);
				alertCallback(0, err);
			}else{
				var pDate;
				var now = new Date();
				$.each(articles, function(index, val) {
					
					pDate = new Date(val.published);
					console.log('Parsing entry for: '+val.title);

					//If date is not in the future and is after last check
					if ((!lastDate || pDate > lastDate) && pDate <= now){
						console.log('Adding entry for: '+val.title);
						parseUrl(val.link, alertCallback);
					}

				});
				setLastRssItemDate(now, function(){
					//TODO: hide progress dialog
				});
			}
		});
	}

}

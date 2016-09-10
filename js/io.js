function writeBatotoJSON(callback){

	var content = JSON.stringify(batotoJSON);
	
	fs.open(batotoJSONFile, "w", function(error, fd) {

		if (error){
			console.log(error);
		}else{

			fs.write(fd, content, function(error, bytesWritten, buffer) {
				fs.close(fd);
				callback();
			});

		}

	});

}

function readFileIntoBuffer(fileName, callback){

	fs.exists(fileName, function(exists) {

	  if (exists) {

	    fs.stat(fileName, function(error, stats) {

	    	if (error){
	    		console.log(error);
	  			callback(false);
	    	}else{

		    	fs.open(fileName, "r", function(error, fd) {
		    		var buffer = new Buffer(stats.size);

		    		fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
		    			fs.close(fd);
		    			callback(buffer);
		    		});

		    	});
			}

	    });

	  }else{
	  	callback(false);
	  }

	});

}
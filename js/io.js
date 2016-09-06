function writeBatotoJSON(){
	jsonfile.writeFile(batotoJSONFile, batotoJSON, function(err) {
		if (err) console.log(err);
	});
}

function readFileIntoBuffer(fileName, cb){

	fs.exists(fileName, function(exists) {

	  if (exists) {

	    fs.stat(fileName, function(error, stats) {

	      fs.open(fileName, "r", function(error, fd) {
	        var buffer = new Buffer(stats.size);

	        fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
	          fs.close(fd);
	          cb(buffer);
	        });

	      });

	    });

	  }else{
	  	cb(false);
	  }

	});

}
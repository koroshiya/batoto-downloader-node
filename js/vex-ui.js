function vexLoginPrompt(cb){
	vex.dialog.open({
		message:'Login Required',
		input:$("#loginForm").html(),
		callback: function(data){
			if (data){
				login(data.username, data.password, function(success){
					if (success){
						postForm(path, referer, callback);
					}else{
						cb('Login failed');
					}
				});
			}else{
				cb('Login aborted');
			}
		}
	});
}

function vexSettingsPage(html, cb){
	vex.dialog.open({
		message:'Settings',
		input:html,
		callback: cb
	});
}


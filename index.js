  var ehdl  = $('#meltdowneditor').meltdown({
		openPreview: true,
		fullscreen: true,
		sidebyside: true,
		previewHeight: "auto"
	});

	var curpostLocal;

	$('.meltdown_control-fullscreen').remove();
	$('.meltdown_control-sidebyside').remove();
	//$('.meltdown_preview-header').remove();
	$('.meltdown_preview-header').text('.');
	$('.meltdown_bar').remove();

  var picCacheList = {};

  chrome.storage.local.get({'workingpost':{
		content:'Please start blogging.',
		sha: null,
		title: 'Untitled'
	}},function(obj){
		curpostLocal = obj.workingpost;
		$('.posttitle').text(obj.workingpost['title']);
		getLocalPost(function(o){
			if(o==null){
				curpost = curpostLocal;
			} else {
				curpost = o;
			}
    	loadPost(curpost['content']);
		});
  })


function handlePic(url){
		console.log(url);
		var hashc = hashCode(url);
		console.log(hashc);
    if(typeof(picCacheList[hashc])!='undefined') {
				return picCacheList[hashc];
		} else {
  	  var xhr = new XMLHttpRequest();
    	xhr.responseType = 'blob';
	    xhr.onload = function() {
				console.log(this);
				picCacheList[hashCode(this.responseURL)] = window.URL.createObjectURL(this.response);
				$('#meltdowneditor').meltdown('update',true);
	    }
	    xhr.open('GET', url, true);
	    xhr.send();
			return null;
	  }
}

hashCode = function(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

//Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};


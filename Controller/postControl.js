
function loadPost(content) {
	//reconstruct the code;
	var str = '';
	editor.setValue(content);
	updatePreview();
	$('.frame-pop').remove();
	$('.frame-mask').remove();
	$('.frame-icon.focus').removeClass('focus');

}

function createNewPost() {
	var cur = new Date();
	var datestr = cur.getFullYear() + '-' + (Number(cur.getMonth()) + 1) + '-' + cur.getDate();
	var newpostmeta = {
		categories: 'Uncategoried',
		tags: '',
		comment: '',
		info: '',
		date: datestr,
		type: 'post',
		layout: 'post',
		published: false,
		sha: '',
		slug: 'the-post-' + parseInt(10000 * Math.random()),
		title: 'Unnamed'
	}
	//->
	curpost = newpostmeta;
	curpost['content'] = '';
	loadCurPost();
}

function dumpPost() {
	var rst = '';
	var shadowpost = jQuery.extend({}, curpost);
	var contentstr = shadowpost.content;
	delete shadowpost.content;
	var metastr = YAML.stringify(shadowpost);
	rst = rst + '---\n';
	rst = rst + metastr;
	rst = rst + '\n---\n';
	rst = rst + contentstr;
	return rst;
}

function loadCurPost() {
	//-> The Post are loaded inside!
	loadPost(curpost.content);
	//Title
	$('.posttitle').text(curpost.title);
	storePost();
}

function updatePost(cb) {
	var name = curpost.date + '-' + curpost.slug;
	var content = dumpPost();
	//console.log(content);
	//PUT /repos/:owner/:repo/contents/:path
	var sha = curpost.sha;
	var path = '_posts/' + name + '.md';
	console.log(path);
	gh.updateContent(path, content, sha, function (e, r, s) {
		console.log(e);
		if (r == '200') {	//Done
			var ucontent = JSON.parse(s);
			logInfo(gm('postUpdated'));
			//remove the local list Item, as info expired
			for (var i = 0; i < clist.length; i++) {
				console.log(clist[i].sha);
				if (clist[i].sha == curpost.sha) {
					clist[i] = $.extend({}, curpost);
					//Align current
					curpost.sha = ucontent.content.sha;
					clist[i].sha = ucontent.content.sha;
					break;
				}
			}
			storePost();
			chrome.storage.local.set({ clist: clist }, function () {
				$('.frame-mask').click();
			});
		} else if (r == '201') { //Created
			var ucontent = JSON.parse(s);
			logInfo(gm('postCreated'));
			//-> Need to refresh the list
			curpost.sha = ucontent.content.sha;
			//remove old one
			clist.pop();
			clist.push($.extend({}, curpost));
			storePost();
			chrome.storage.local.set({ clist: clist }, function () {
				$('.frame-mask').click();
			});
		} else if (r == '409') { //Failed
			logError(gm('ErrVersion'));
			$('.frame-mask').click();
		} else {
			logError(gm('ErrGeneral'));
			$('.frame-mask').click();
		}
		if (typeof (cb) != 'undefined') cb();
	});
}

function deletePost(ind, cb) {
	var delpost = clist[ind];
	var name = delpost.date + '-' + delpost.slug;
	//DELETE /repos/:owner/:repo/contents/:path
	var sha = delpost.sha;
	var path = '_posts/' + name + '.md';
	console.log(path);
	gh.deleteContent(path, sha, function (e, r, s) {
		console.log(e);
		var deli = null;
		if (r == '200') {	//Done
			var ucontent = JSON.parse(s);
			logInfo(gm('postDeleted'));
			//remove the local list Item, as info expired
			for (var i = 0; i < clist.length; i++) {
				if (clist[i].sha == delpost.sha) {
					deli = i;
					break;
				}
			}
			//Remove
			if (deli != null)
				clist.remove(deli);
			chrome.storage.local.set({ clist: clist }, function () {
				$('.frame-mask').click();
			});
		} else {
			logError(gm('ErrGeneral'));
			$('.frame-mask').click();
		}
		if (typeof (cb) != 'undefined') cb();
	});
}

function syncLocalPost() {
	chrome.storage.local.set({ syncpost: curpost }, function () {
		console.log('sync done');
	});
}

function getLocalPost(cb) {
	chrome.storage.local.get({ syncpost: null }, function (o) {
		console.log(o);
		console.log('sync done');
		cb(o.syncpost);
	});
}

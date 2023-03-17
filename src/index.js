var user_info = null;
var ehdl = $('#meltdowneditor').meltdown({
	openPreview: true,
	fullscreen: true,
	sidebyside: true,
	previewHeight: "auto"
});

var curpostLocal;

$('.meltdown_control-fullscreen').remove();
$('.meltdown_control-sidebyside').remove();
$('.meltdown_preview-header').text('.');
$('.meltdown_bar').remove();

var picCacheList = {};

var skin = 'dark';

//Fetch config 
// Skin: 
//  - Default: Dark
//  - Switch: Light

chrome.storage.local.get({
	'workingpost': {
		content: 'Please start blogging.',
		sha: null,
		title: 'Untitled'
	},
	'skin': 'dark'
}, function (obj) {
	curpostLocal = obj.workingpost;
	skin = obj.skin;
	$('.posttitle').text(obj.workingpost['title']);
	getLocalPost(function (o) {
		if (o == null) {
			curpost = curpostLocal;
		} else {
			curpost = o;
		}
		loadPost(curpost['content']);
	});
	// Skin Chooser
	$('head').append('<link id="stylehdl" rel="stylesheet"type="text/css"href="styles-' + skin + '.css"/>');
})

function handlePic(url) {
	return url;
}


hashCode = function (s) {
	return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
}

//Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};
var fontpath = chrome.runtime.getURL('assets');
var fontstr = "@font-face {font-family: 'Kesong';src: url('" + fontpath + "/font.otf') format('truetype');}";
$('body').append('<style>' + fontstr + '</style>');

/* Initialization to check the token! */
/* Utils for timer */
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Formalize the YYYY-MM-DD 
function normalizeDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error('Invalid date format, should be YYYY-MM-DD');
  }
  const year = parts[0];
  let month = parts[1];
  let day = parts[2];
  if (month.length === 1) {
    month = '0' + month;
  }
  if (day.length === 1) {
    day = '0' + day;
  }
  return year + '-' + month + '-' + day;
}

//=> Refer to github.js as it's the key async
async function init() {
	//Wait for github instance ready
	while (gh == null)
		await sleep(100)
	while (gh.access_token() == null)
		await sleep(100)
	gh.getUserInfo(false);
}

init();



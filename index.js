var user_info = null;

// 初始化 Ace 编辑器
const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/markdown");  // 设置为 Markdown 模式
// 切换到 Vim 模式
editor.setKeyboardHandler("ace/keyboard/vim");

editor.setOptions({
	fontSize: "14px",
	showPrintMargin: false,
	wrap: true  // 自动换行，便于 Markdown 编辑
});

// 获取预览容器
const preview = document.getElementById("preview");

// 渲染 Markdown 内容为 HTML
function updatePreview() {
	const markdownContent = editor.getValue();          // 获取 Markdown 内容
	preview.innerHTML = marked.parse(markdownContent);  // 渲染 Markdown 为 HTML
}

// 初始内容渲染
updatePreview();

// 内容更改事件监听
editor.getSession().on('change', updatePreview); // 当编辑器内容变化时更新预览

var curpostLocal;

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



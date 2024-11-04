
// ==========================
// 全局变量 Global Variables
// ==========================

let user_info = null;       // 用户信息 User information
let curpostLocal;           // 当前本地帖子 Local post content
let picCacheList = {};      // 图片缓存列表 Image cache list
let skin = 'dark';          // 主题皮肤 Skin theme

// ==========================
// 设置和初始化界面 Setup and Initialize Interface
// ==========================

// 获取并设置本地存储的配置 Get and set local storage configuration
chrome.storage.local.get({
    'workingpost': {
        content: 'Please start blogging.',
        sha: null,
        title: 'Untitled'
    },
    'skin': 'dark'
}, (obj) => {
    curpostLocal = obj.workingpost;
    skin = obj.skin;
    $('.posttitle').text(obj.workingpost['title']);

    // 获取本地帖子内容 Get local post content
    getLocalPost((localPost) => {
        curpost = localPost || curpostLocal;
        loadPost(curpost.content);
    });

    // 加载主题样式 Load theme stylesheet
    $('head').append(`<link id="stylehdl" rel="stylesheet" type="text/css" href="styles-${skin}.css"/>`);
    if (skin == 'light')
        editor.setTheme("ace/theme/tomorrow");
    else
        editor.setTheme("ace/theme/tomorrow_night_eighties");

});

// ==========================
// 帮助函数 Helper Functions
// ==========================

/**
 * 处理图片的 URL Process image URL
 * @param {string} url 图片 URL Image URL
 * @returns {string} 返回处理后的 URL Returns processed URL
 */
function handlePic(url) {
    return url;
}

/**
 * 生成字符串的哈希码 Generate hash code for a string
 * @param {string} s 字符串 String
 * @returns {number} 返回哈希码 Returns hash code
 */
function hashCode(s) {
    return s.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
}

// 数组移除元素 Remove elements from array
Array.prototype.remove = function (from, to) {
    const rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

/**
 * 格式化日期为 YYYY-MM-DD Format date as YYYY-MM-DD
 * @param {string} dateStr 日期字符串 Date string
 * @returns {string} 格式化后的日期字符串 Formatted date string
 */
function normalizeDate(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
        throw new Error('Invalid date format, should be YYYY-MM-DD');
    }
    const [year, month, day] = parts.map((p, i) => i > 0 && p.length === 1 ? '0' + p : p);
    return `${year}-${month}-${day}`;
}

// 等待一段时间 Wait for a specified time
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================
// 字体和编辑器初始化 Font and Editor Initialization
// ==========================

// 添加自定义字体样式 Add custom font style
/*
const fontPath = chrome.runtime.getURL('assets');
const fontStr = `@font-face {font-family: 'Kesong'; src: url('${fontPath}/font.otf') format('truetype');}`;
$('body').append(`<style>${fontStr}</style>`);
*/

// 初始化 Ace 编辑器 Initialize Ace editor
const editor = ace.edit("editor");
/*
if (skin == 'light')
    editor.setTheme("ace/theme/tomorrow");
else
    editor.setTheme("ace/theme/tomorrow_night_eighties");
*/

editor.session.setMode("ace/mode/markdown");
editor.setKeyboardHandler("ace/keyboard/vim");
editor.setOptions({
    fontSize: "14px",
    showPrintMargin: false,
    showLineNumbers: false,
    wrap: true,
});

// ==========================
// Markdown 预览功能 Markdown Preview
// ==========================

const preview = document.getElementById("preview");

// 渲染 Markdown 内容为 HTML Render Markdown content as HTML
function updatePreview() {
    preview.innerHTML = marked.parse(editor.getValue());
}

// 初始化内容和监听编辑器内容变化 Initialize content and monitor editor content changes
updatePreview();
editor.getSession().on('change', updatePreview);

// ==========================
// 页面布局调整 Adjust Layout
// ==========================

/**
 * 动态调整编辑器和预览区域高度 Dynamically adjust the height of the editor and preview area
 */
function setDivHeight() {
    document.getElementById("editor").style.height = `${window.innerHeight - 40}px`;
    document.getElementById("preview").style.height = `${window.innerHeight - 35}px`;
}

// 初次调用和窗口调整事件监听 Initial call and listen for window resize event
setDivHeight();
window.addEventListener("resize", setDivHeight);

// ==========================
// 初始化检查 GitHub 令牌 Initialize GitHub Token Check
// ==========================

async function init() {
    // 等待 GitHub 实例和访问令牌 Wait for GitHub instance and access token
    while (!gh) await sleep(100);
    while (!gh.access_token()) await sleep(100);
    gh.getUserInfo(false);
}

init();

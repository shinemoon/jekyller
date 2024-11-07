
// ==========================
// 全局变量 Global Variables
// ==========================

let user_info = null;       // 用户信息 User information
let curpostLocal;           // 当前本地帖子 Local post content
let picCacheList = {};      // 图片缓存列表 Image cache list
let skin = 'dark';          // 主题皮肤 Skin theme

let editorcfg = {};       //编辑器配置  Editor Config

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
    //Editor Option!
    'editorconfig': {
        mode: "normal", //vim, normal
        shownumber: false, //true, false
        layout: 'full'//full, single
    },
    'skin': 'dark'
}, (obj) => {
    curpostLocal = obj.workingpost;
    skin = obj.skin;
    editorcfg = obj.editorconfig;
    $('.posttitle').text(obj.workingpost['title']);

    // 获取本地帖子内容 Get local post content
    getLocalPost((localPost) => {
        curpost = localPost || curpostLocal;
        loadPost(curpost.content);
    });
    //Vim Mode or not
    if (editorcfg.mode == "normal")
        editor.setKeyboardHandler(null);
    else {
        editor.setKeyboardHandler("ace/keyboard/" + editorcfg.mode);

    }
    editor.setOptions({
        fontSize: "14px",
        showPrintMargin: false,
        showLineNumbers: editorcfg.shownumber,
        wrap: true,
    });

    // 初始化内容和监听编辑器内容变化 Initialize content and monitor editor content changes
    updatePreview();
    editor.getSession().on('change', updatePreview);

    // 初次调用和窗口调整事件监听 Initial call and listen for window resize event
    setView();
    window.addEventListener("resize", setView);


    //存档功能
    // 其余的都靠自动保存（key），Vim可以做手动……
    //Vim => Pure for fun.. not necessary
    ace.config.loadModule("ace/keyboard/vim", function (m) {
        var VimApi = require("ace/keyboard/vim").CodeMirror.Vim
        //Write
        VimApi.defineEx("write", "w", function (cm, input) {
            syncLocalPost();
            logInfo(gm("vimsave"));
        })
        //Quit
        VimApi.defineEx("quit", "q", function (cm, input) {
            window.close();
        })
        //Switch full/single
        VimApi.defineEx("layout", "l", function (cm, input) {
            switchLayout();
        })
        //Switch day/night 
        VimApi.defineEx("switch", "s", function (cm, input) {
            switchSkin();
        })


    })
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
// ==========================
// Markdown 预览功能 Markdown Preview
// ==========================

const preview = document.getElementById("preview");

// 渲染 Markdown 内容为 HTML Render Markdown content as HTML
function updatePreview() {
    preview.innerHTML = marked.parse(editor.getValue());
}

// ==========================
// 页面布局调整 Adjust Layout
// ==========================

/**
 * 动态调整编辑器和预览区域高度 Dynamically adjust the height of the editor and preview area
 */
function setView() {
    //Width
    //Focus mode
    if (editorcfg.layout == "single") {
        $('body').addClass('single');
        $('#top-banner-row').addClass('autohide');
        //Height
        document.getElementById("editor").style.height = `${window.innerHeight - 25}px`;
        document.getElementById("preview").style.height = `${window.innerHeight - 50}px`;
    } else {
        //Height
        document.getElementById("editor").style.height = `${window.innerHeight - 55}px`;
        document.getElementById("preview").style.height = `${window.innerHeight - 70}px`;
        $('body').removeClass('single');
        $('#top-banner-row').removeClass('autohide');
    }
    // 加载主题样式 Load theme stylesheet
    $('#stylehdl').remove();
    $('head').append(`<link id="stylehdl" rel="stylesheet" type="text/css" href="css/styles-${skin}.css"/>`);
    if (skin == 'light')
        editor.setTheme("ace/theme/kuroir");
    else
        editor.setTheme("ace/theme/tomorrow_night_eighties");
}


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

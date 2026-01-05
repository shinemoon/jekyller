
// ==========================
// 全局变量 Global Variables
// ==========================

let user_info = null;       // 用户信息 User information
let curpostLocal;           // 当前本地帖子 Local post content
let picCacheList = {};      // 图片缓存列表 Image cache list
let skin = 'dark';          // 主题皮肤 Skin theme

let editorcfg = {};       //编辑器配置  Editor Config
const manifestData = chrome.runtime.getManifest();

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

    //Version info
    $('body').append("<div class='versioninfo'>V"+manifestData.version+"</div>");

    // 初始化内容和监听编辑器内容变化 Initialize content and monitor editor content changes
    updatePreview();
    editor.getSession().on('change', updatePreview);

    // 初次调用和窗口调整事件监听 Initial call and listen for window resize event
    setView();
    window.addEventListener("resize", setView);


    //Vim 增强设定
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
        // Create!
        VimApi.defineEx("new", "n", function (cm, input) {
            if (user_info) {
                $('.img#create').click();
            }
        })

        // Post!
        VimApi.defineEx("published", "pu", function (cm, input) {
            if (user_info) {
                //To mark publish as true
                curpost.published = true;
                $('.content.post input').prop('checked', curpost.published);
                storePost(() => {
                    updatePost(() => logInfo(gm("postUpdated")));
                });
            }
        })
        // Post!
        VimApi.defineEx("unpublished", "un", function (cm, input) {
            if (user_info) {
                //To mark publish as true
                curpost.published = false;
                $('.content.post input').prop('checked', curpost.published);
                storePost(() => {
                    updatePost(() => logInfo(gm("postUpdated")));
                });
            }
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
    // 使用 documentElement.clientWidth 作为视口宽度
    const viewportWidth = document.documentElement.clientWidth;
    const isNarrowScreen = viewportWidth <= 768;
    
    console.log('setView called, viewportWidth:', viewportWidth, 'isNarrowScreen:', isNarrowScreen, 'layout:', editorcfg.layout);
    
    // 窄屏模式下，如果是 full 模式，强制转换为 single
    if (isNarrowScreen && editorcfg.layout == 'full') {
        console.log('Force converting full to single in narrow screen');
        editorcfg.layout = 'single';
        chrome.storage.local.set({ 'editorconfig': editorcfg });
    }
    
    //Width
    //Focus mode
    if (editorcfg.layout == "single") {
        console.log('Applying single mode');
        $('body').addClass('single').removeClass('preview-mode');
        $('#top-banner-row').addClass('autohide');
        // posttitle 由 hotspot 点击控制，默认隐藏
        $('.posttitle').addClass('hidden');
        // 进入单列模式时旋转并移动 toolbar
        $('#top-banner-row').addClass('rotated-preview');
        
        // 窄屏下强制设置宽度
        if (isNarrowScreen) {
            document.getElementById("editor").style.width = 'calc(100vw - 45px)';
            document.getElementById("preview").style.width = 'calc(100vw - 45px)';
        }
        
        //Height
        document.getElementById("editor").style.height = `${window.innerHeight - 25}px`;
        document.getElementById("preview").style.height = `${window.innerHeight - 50}px`;
    } else if (editorcfg.layout == "preview") {
        // 单栏预览模式（窄屏专用）
        console.log('Applying preview mode');
        $('body').addClass('single').addClass('preview-mode');
        $('#top-banner-row').addClass('autohide');
        // posttitle 由 hotspot 点击控制，默认隐藏
        $('.posttitle').addClass('hidden');
        $('#top-banner-row').addClass('rotated-preview');
        
        // 窄屏下强制设置宽度
        if (isNarrowScreen) {
            document.getElementById("editor").style.width = 'calc(100vw - 45px)';
            document.getElementById("preview").style.width = 'calc(100vw - 45px)';
        }
        
        //Height
        document.getElementById("editor").style.height = `${window.innerHeight - 25}px`;
        document.getElementById("preview").style.height = `${window.innerHeight - 50}px`;
    } else {
        //Height
        console.log('Applying full/dual mode');
        document.getElementById("editor").style.height = `${window.innerHeight - 55}px`;
        document.getElementById("preview").style.height = `${window.innerHeight - 70}px`;
        $('body').removeClass('single').removeClass('preview-mode');
        $('#top-banner-row').removeClass('autohide');
        // full 模式下 banner 和 posttitle 始终显示
        $('.posttitle').removeClass('hidden');
        // 恢复原位
        $('#top-banner-row').removeClass('rotated-preview');
    }
    // 加载主题样式 Load theme stylesheet
    $('#stylehdl').remove();
    $('head').append(`<link id="stylehdl" rel="stylesheet" type="text/css" href="css/styles-${skin}.css"/>`);
    if (skin == 'light')
        editor.setTheme("ace/theme/kuroir");
    else
        editor.setTheme("ace/theme/tomorrow_night_eighties");
    // 更新 tooltip 定位（如果存在）
    if (typeof positionTooltipToToolBanner === 'function') positionTooltipToToolBanner();
    // Ensure hotspot exists and is positioned after view change
    if (typeof ensureBannerHotspot === 'function') ensureBannerHotspot();
}


// ==========================
// 初始化检查 GitHub 令牌 Initialize GitHub Token Check
// ==========================

// posttitle 的显示/隐藏现在完全由 hotspot 点击控制

// 将 tooltip 定位到与 #tool-banner 左上角对齐的位置
function positionTooltipToToolBanner() {
    const tip = document.querySelector('#top-banner-row .tooltip');
    const tool = document.querySelector('#tool-banner');
    if (!tip || !tool) return;
    // 获取 #tool-banner 左上角相对于视口的位置
    const r = tool.getBoundingClientRect();
    // 让 tooltip 的左上角对齐到 tool-banner 的左上角（水平对齐），
    // 垂直位置使用 50% - 150px 的计算与 CSS 保持一致
    tip.style.left = `${Math.max(0, Math.round(r.left))}px`;
    const topPx = Math.max(0, Math.round(window.innerHeight / 2 - 150));
    tip.style.top = `${topPx}px`;
    // 确保使用旋转但不使用 translateY(-50%)
    tip.style.transform = 'rotate(-90deg)';
}

// 监听窗口变化以保持对齐
window.addEventListener('resize', positionTooltipToToolBanner);
window.addEventListener('load', () => {
    // 延迟定位，确保元素已布局
    setTimeout(positionTooltipToToolBanner, 120);
});

async function init() {
    // 等待 GitHub 实例和访问令牌 Wait for GitHub instance and access token
    while (!gh) await sleep(100);
    while (!gh.access_token()) await sleep(100);
    gh.getUserInfo(false);
}

init();

// Create a small invisible hotspot to trigger banner reveal in single/rotated mode
function ensureBannerHotspot() {
    let hotspot = document.getElementById('banner-hotspot');
    if (!hotspot) {
        hotspot = document.createElement('div');
        hotspot.id = 'banner-hotspot';
        document.body.appendChild(hotspot);
        console.log('Hotspot created and added to body');
    }
    
    // 强制设置样式，确保显示（防止 CSS 缓存问题）
    const isDark = skin === 'dark';
    Object.assign(hotspot.style, {
        position: 'fixed',
        top: '0',
        right: '0',
        width: '42px',
        height: '42px',
        background: isDark ? '#0df7188a' : '#ff95008a',
        clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
        boxShadow: '-2px 2px 6px rgba(0, 0, 0, 0.15)',
        zIndex: '200001',
        cursor: 'pointer'
    });
    
    console.log('Hotspot styles forced, background:', hotspot.style.background);
    
    // ensure expanded state cleared if layout changed
    if (!$('#top-banner-row').hasClass('rotated-preview')) {
        $('#top-banner-row').removeClass('expanded');
    }
}

// Ensure hotspot exists on load/resize and when layout toggles
window.addEventListener('load', () => setTimeout(ensureBannerHotspot, 100));
window.addEventListener('resize', ensureBannerHotspot);

// 备用的委托处理器，确保点击事件即使在元素重建或绑定问题时也能触发
$(document).on('click', '#banner-hotspot', function (e) {
    console.log('banner-hotspot clicked (delegated)');
    const banner = $('#top-banner-row');
    const posttitle = $('.posttitle');
    const wasExpanded = banner.hasClass('expanded');
    
    // 调试信息
    console.log('Banner classes:', banner.attr('class'));
    console.log('Was expanded:', wasExpanded);
    
    if (wasExpanded) {
        // 收起：移除 expanded，恢复 autohide，隐藏 posttitle
        banner.removeClass('expanded');
        posttitle.addClass('hidden');
        if ($('body').hasClass('single')) {
            banner.addClass('autohide');
        }
        console.log('Banner and posttitle collapsed');
        console.log('After collapse classes:', banner.attr('class'));
    } else {
        // 展开：移除 autohide（它会强制 opacity:0），添加 expanded，显示 posttitle
        banner.removeClass('autohide').addClass('expanded');
        posttitle.removeClass('hidden');
        console.log('Banner and posttitle expanded, autohide removed');
        console.log('After expand classes:', banner.attr('class'));
    }
});
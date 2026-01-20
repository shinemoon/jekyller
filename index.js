
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
        wrapMethod: "text",  // 使用text模式以改善中文等字符的换行行为
    });

    // 设置换行限制，让编辑器尽可能在更合适的位置换行
    editor.getSession().setUseWrapMode(true);
    editor.getSession().setWrapLimitRange(null, null);  // 不限制wrap范围

    // 启用编辑器增强功能 Enable editor enhancement features
    if (typeof enableEditorEnhancement === 'function') {
        enableEditorEnhancement(editor, {
            autoPairing: true,      // 启用自动配对
            smartBackspace: true    // 启用智能退格
        });
    }

    //Version info
    $('body').append("<div class='versioninfo'>V" + manifestData.version + "</div>");

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
        // Use the exported Vim API from the ace keyboard vim module
        var vimMod = require("ace/keyboard/vim");
        var VimApi = (vimMod && vimMod.Vim) || (vimMod && vimMod.CodeMirror && vimMod.CodeMirror.Vim);
        // Load externalized Vim ex command registrations (robust: try require, fallback to global, else dynamic load)
        (function () {
            var vimModule = null;
            try {
                vimModule = require && require('./Controller/vimCmd');
            } catch (e) {
                vimModule = null;
            }
            if (vimModule && vimModule.register && VimApi) {
                try { vimModule.register(VimApi); } catch (e) { console.error(e); }
                return;
            }
            if (typeof window !== 'undefined' && window.vimCmd && window.vimCmd.register && VimApi) {
                try { window.vimCmd.register(VimApi); } catch (e) { console.error(e); }
                return;
            }
            // Dynamic load as last resort
            if (typeof document !== 'undefined') {
                var s = document.createElement('script');
                s.src = 'Controller/vimCmd.js';
                s.onload = function () {
                    if (window.vimCmd && window.vimCmd.register) window.vimCmd.register(VimApi);
                };
                document.head.appendChild(s);
            }
        })();
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
// Post-table snapshot utilities
// ==========================
// Capture current values inside #post-table inputs into sessionStorage
function snapshotPostTable() {
    try {
        const $table = $('#post-table');
        if ($table.length === 0) return;
        const data = {};
        $table.find('input, textarea, select').each(function (i, el) {
            const $el = $(el);
            // Determine a key: prefer parent td class that's not 'content'
            const parentClass = $el.closest('td').attr('class') || '';
            let key = null;
            if (parentClass) {
                const parts = parentClass.split(/\s+/).filter(Boolean);
                for (let p of parts) {
                    if (p !== 'content') { key = p; break; }
                }
            }
            if (!key) key = $el.attr('name') || $el.attr('id') || (`field_${i}`);

            if ($el.is(':checkbox')) {
                data[key] = { type: 'checkbox', value: $el.prop('checked') };
            } else if ($el.is(':radio')) {
                // store checked state only for named radios
                data[key] = { type: 'radio', value: $el.prop('checked'), name: $el.attr('name') };
            } else {
                data[key] = { type: 'value', value: $el.val() };
            }
        });
        try { sessionStorage.setItem('postTableSnapshot', JSON.stringify(data)); } catch (e) { window._postTableSnapshot = data; }
    } catch (e) {
        console.warn('snapshotPostTable failed', e);
    }
}

// Restore values previously stored for #post-table inputs
function restorePostTable() {
    try {
        let data = null;
        try { data = JSON.parse(sessionStorage.getItem('postTableSnapshot')); } catch (e) { data = window._postTableSnapshot || null; }
        if (!data) return;
        const $table = $('#post-table');
        if ($table.length === 0) return;
        Object.keys(data).forEach(key => {
            const entry = data[key];
            if (!entry) return;
            // find input by td classname first
            let $el = $table.find(`td.${key}.content`).find('input,textarea,select');
            if ($el.length === 0) {
                // fallback: by name or id
                $el = $table.find(`[name="${key}"]`);
            }
            if ($el.length === 0) return;
            if (entry.type === 'checkbox') {
                $el.prop('checked', !!entry.value);
            } else if (entry.type === 'radio') {
                if (entry.name) {
                    $table.find(`input[type=radio][name="${entry.name}"]`).each(function () {
                        const $r = $(this);
                        if ($r.val() == entry.value || $r.prop('checked') === entry.value) {
                            $r.prop('checked', !!entry.value);
                        }
                    });
                } else {
                    $el.prop('checked', !!entry.value);
                }
            } else {
                $el.val(entry.value);
            }
        });
    } catch (e) {
        console.warn('restorePostTable failed', e);
    }
}

window.snapshotPostTable = snapshotPostTable;
window.restorePostTable = restorePostTable;


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

// 禁用移动端菜单 Disable mobile menu
editor.setOption("enableMobileMenu", false);

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

    // 在调整视图/窗口大小时强制隐藏任何残留的弹窗或 tooltip
    try {
        $('.frame-pop').hide();
        $('.tooltip').hide();
        $('.frame-mask').hide();
    } catch (e) {
        // ignore if jQuery not ready
    }

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
        document.getElementById("editor").style.height = `${window.innerHeight - 55}px`;
        document.getElementById("preview").style.height = `${window.innerHeight - 55}px`;
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
        document.getElementById("editor").style.height = `${window.innerHeight - 55}px`;
        document.getElementById("preview").style.height = `${window.innerHeight - 55}px`;
    } else {
        //Height
        console.log('Applying full/dual mode');
        document.getElementById("editor").style.height = `${window.innerHeight - 120}px`;
        document.getElementById("preview").style.height = `${window.innerHeight - 120}px`;
        $('body').removeClass('single').removeClass('preview-mode');
        // Ensure any manual-hide marker is cleared when switching to full layout
        $('#top-banner-row').removeClass('autohide').removeClass('manual-hide');
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
    const topBanner = document.querySelector('#top-banner-row .top-banner');
    const topBannerRow = document.querySelector('#top-banner-row');
    if (!tip || !topBanner) return;

    // 如果是旋转状态且未展开，隐藏 tooltip（此时 banner 在右下角）
    const isRotated = topBannerRow && topBannerRow.classList.contains('rotated-preview');
    const isExpanded = topBannerRow && topBannerRow.classList.contains('expanded');
    if (isRotated && !isExpanded) {
        tip.style.display = 'none';
        return;
    }

    // 直接根据 .top-banner 的实际位置计算 tooltip 位置
    const bannerRect = topBanner.getBoundingClientRect();

    // tooltip 的 top 和 left 直接对齐 .top-banner（都是 fixed 定位，不需要加 scrollY）
    // 位置调整：上移20px，右移5px
    // 注意：这里只负责定位，不设置 display（由 hover 事件控制）
    tip.style.position = 'fixed';
    tip.style.left = `${Math.max(0, Math.round(bannerRect.left) + 5)}px`;
    tip.style.top = `${Math.round(bannerRect.top - 40)}px`;
    tip.style.removeProperty('transform');
}

// 暴露到全局供 bannerSync.js 调用
window.positionTooltipToToolBanner = positionTooltipToToolBanner;

// tooltip 默认隐藏，只在 hover icon 时显示
$(document).ready(function () {
    const tooltip = $('.tooltip');
    if (tooltip.length) {
        tooltip.hide(); // 默认隐藏
        /* 
         // hover .frame-icon 时显示 tooltip
         $('.frame-icon').on('mouseenter', function() {
             const topBannerRow = document.querySelector('#top-banner-row');
             const isRotated = topBannerRow && topBannerRow.classList.contains('rotated-preview');
             const isExpanded = topBannerRow && topBannerRow.classList.contains('expanded');
             // 只在非旋转或已展开时显示
             if (!isRotated || isExpanded) {
                 positionTooltipToToolBanner();
                 tooltip.show();
             }
         }).on('mouseleave', function() {
             tooltip.hide();
         });
         */
    }
});

// 监听窗口变化以保持对齐
window.addEventListener('resize', positionTooltipToToolBanner);
window.addEventListener('load', () => {
    // 延迟定位，确保元素已布局
    setTimeout(positionTooltipToToolBanner, 120);
    // 初始化全局 tooltip（加入显示延迟以做 hover 防抖）
    try {
        if (window.jQuery && jQuery.ui && jQuery.ui.tooltip) {
            $(document).tooltip({
                // 延迟显示，避免鼠标快速经过时频繁触发（防抖）
                show: { delay: 250 },
                // 隐藏时也可稍作延迟以减少闪烁
                hide: { delay: 80 }
            });
        }
    } catch (e) {
        // 忽略初始化失败
        console.warn('Tooltip init/debounce failed', e);
    }
    // Mark UI as ready after a short delay so SCSS can reveal previously-hidden elements
    setTimeout(() => {
        try { document.body.classList.add('ui-ready'); } catch (e) { }
    }, 180);
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
        // add centered icon inside hotspot
        const icon = document.createElement('span');
        icon.className = 'hotspot-icon icon-quotes-right';
        hotspot.appendChild(icon);
        console.log('Hotspot created and added to body');
    }

    // 强制设置样式，确保显示（防止 CSS 缓存问题）
    const isDark = skin === 'dark';
    console.log('Hotspot styles forced, background:', hotspot.style.background);

    // ensure expanded state cleared if layout changed
    if (!$('#top-banner-row').hasClass('rotated-preview')) {
        $('#top-banner-row').removeClass('expanded');
    }
    // Show hotspot only in single/rotated layouts; hide in full layout
    try {
        if (document.body.classList.contains('single')) {
            hotspot.style.display = '';
        } else {
            hotspot.style.display = 'none';
        }
    } catch (e) {
        // ignore
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
        // 收起：移除 expanded，恢复 autohide，隐藏 posttitle 和 tooltip
        banner.removeClass('expanded');
        // 标记为手动隐藏，阻止 hover 再次显示
        banner.addClass('manual-hide');
        posttitle.addClass('hidden');
        $('.tooltip').hide(); // 隐藏 tooltip
        if ($('body').hasClass('single')) {
            banner.addClass('autohide');
        }
        console.log('Banner and posttitle collapsed');
        console.log('After collapse classes:', banner.attr('class'));
    } else {
        // 展开：移除 autohide（它会强制 opacity:0）和 rotated-preview，添加 expanded，显示 posttitle
        banner.removeClass('autohide').removeClass('rotated-preview').addClass('expanded');
        // 如果是手动隐藏触发展开，清除手动标记以允许正常 hover 行为
        banner.removeClass('manual-hide');
        posttitle.removeClass('hidden');
        console.log('Banner and posttitle expanded, autohide removed');
        console.log('After expand classes:', banner.attr('class'));

        // 等待 CSS transform transition 完成（320ms）后再触发对齐
        // 确保 getBoundingClientRect 返回正确的旋转后尺寸
        setTimeout(() => {
            if (window.positionFramePopToTopBanner) {
                window.positionFramePopToTopBanner();
            }
            // 不自动调用 positionTooltipToToolBanner，让 hover 事件控制 tooltip 显示
        }, 350);
    }
});
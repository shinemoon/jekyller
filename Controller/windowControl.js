// 控制主窗口的操作 Control Main Window Actions

// ==========================
// i18n 多语言翻译功能 i18n Translation Function
// ==========================
function gm(str) {
    // If a user-selected language override is loaded, use it first
    try {
        var sel = window.selected_ui_lang;
        if (sel && window._localMessages && window._localMessages[sel] && window._localMessages[sel][str]) {
            return window._localMessages[sel][str].message;
        }
    } catch (e) {
        // fall back
    }
    return chrome.i18n.getMessage(str);
}

// Load local messages for supported locales so we can override chrome.i18n at runtime
function initI18n() {
    window._localMessages = window._localMessages || {};
    // supported locales: en, zh
    ['en', 'zh'].forEach(function (loc) {
        var path = '../_locales/' + loc + '/messages.json';
        fetch(path).then(function (r) { return r.json(); }).then(function (json) {
            window._localMessages[loc] = json;
        }).catch(function (e) {
            console.warn('Could not load locale', loc, e);
        });
    });

    // load stored ui_lang or use browser language as default
    chrome.storage.local.get('ui_lang', function (res) {
        var ui = res && res.ui_lang;
        if (!ui) {
            var full = chrome.i18n.getUILanguage();
            ui = (full && full.indexOf('zh') === 0) ? 'zh' : 'en';
        }
        window.selected_ui_lang = ui;
    });
}

// Set UI language and persist it
function setUILanguage(lang, cb) {
    if (lang !== 'en' && lang !== 'zh') {
        logError('Unsupported language: ' + lang);
        if (cb) cb(new Error('unsupported'));
        return;
    }
    chrome.storage.local.set({ ui_lang: lang }, function () {
        window.selected_ui_lang = lang;
        logInfo(gm('languageSet'));
        if (typeof cb === 'function') cb();
    });
}

// initialize i18n loader
initI18n();

// ==========================
// 主要操作绑定 Primary Action Bindings
// ==========================

// 创建新帖子 Create New Post
$('.img#create').click(() => {
    popClose();
    $.confirm({
        title: gm('emptyblog'),
        content: gm('emptyblogdetails'),
        theme: 'supervan', // 使用内置的主题
        buttons: {
            confirm: {
                text: gm("yes"),
                action: function () {
                    createNewPost();
                }
            },
            cancel: {
                text: gm("cancel"),
                action: function () {
                    //
                }
            },
        }
    });
});

// 显示 Meta 信息 Show Meta Information
$('.img#meta').click(() => {
    $('.focus').removeClass('focus');
    metaPop(true);
});

// 显示帖子列表 Show Post List
$('.img#list').click(() => {
    if (user_info != null) {
        $('.focus').removeClass('focus');
        listPop(true);
    }
});

// 切换主题皮肤 Switch Theme Skin
$('.img#skin').click(() => {
    $('.focus').removeClass('focus');
    switchSkin();
});

// 切换编辑器 Switch Editor 
$('.img#layout').click(() => {
    switchLayout();
});

// 显示帮助 Show Help
$('.img#help').click(() => {
    $('.focus').removeClass('focus');
    openHelp();
});

function switchLayout() {
    $('.focus').removeClass('focus');
    
    // 获取多种宽度值进行调试
    const widthInfo = {
        innerWidth: window.innerWidth,
        outerWidth: window.outerWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyWidth: document.body.clientWidth,
        screenWidth: window.screen.width,
        availWidth: window.screen.availWidth,
        matchMedia: window.matchMedia('(max-width: 768px)').matches
    };
    console.log('Width debug info:', widthInfo);
    
    // 使用 documentElement.clientWidth 作为视口宽度
    const viewportWidth = document.documentElement.clientWidth;
    const isNarrowScreen = viewportWidth <= 768;
    
    console.log('switchLayout called, viewportWidth:', viewportWidth, 'isNarrowScreen:', isNarrowScreen, 'current layout:', editorcfg.layout);
    
    if (isNarrowScreen) {
        // 窄屏模式：强制只在 'single'（编辑） 和 'preview'（预览） 之间切换
        if (editorcfg.layout === 'preview') {
            editorcfg.layout = 'single';
        } else {
            // 无论当前是 single 还是 full，都切换到 preview
            editorcfg.layout = 'preview';
        }
    } else {
        // 宽屏模式：在 'full'（双栏） 和 'single'（单栏编辑） 之间切换
        if (editorcfg.layout === 'full' || editorcfg.layout === 'preview') {
            editorcfg.layout = 'single';
        } else {
            editorcfg.layout = 'full';
        }
    }
    
    console.log('switchLayout result, new layout:', editorcfg.layout);

    chrome.storage.local.set({ 'editorconfig': editorcfg }, function () {
        logInfo(gm('configUpdated'));
        //And transform the  editgor
        //Focus & other view relevant refresh
        setView();
    });
}


// 令牌操作 Token Action
$('.img#token').click(() => {
    $('.focus').removeClass('focus');
    tokenPop(true);
});

// 编辑器操作 Editor Config
$('.img#cfgEditor').click(() => {
    $('.focus').removeClass('focus');
    editorPop(true);
});



// ==========================
// 提示操作 Tooltip Actions
// ==========================

// 显示和隐藏操作图标提示 Show/Hide Tooltip for Icons
$('.frame-icon.op').mouseenter(function () {
    $('.tooltiptext').text(gm($(this).attr('val')));
    $('.tooltip').fadeIn(100);
});
$('.frame-icon.op').mouseleave(function () {
    $('.tooltiptext').text('-');
    $('.tooltip').fadeOut(100);
});

// ==========================
// 弹框和蒙层控制 Pop-up and Overlay Control
// ==========================

/**
 * 显示或切换配置框 Toggle Configuration Frame
 * @param {string} id Frame ID
 * @param {boolean} toggle 是否切换模式 Whether to Toggle
 * @param {function} cb 回调函数 Callback Function
 */
function popFrame(id, toggle = true, cb) {

    if (toggle && $(`.frame-pop.${id}:visible`).length > 0) {
        popClose();
        return 0;
    }

    popClose();
    $(`#${id}`).addClass('focus');
    const frame = $(`<div class="frame-pop ${id}"></div>`);
    const mask = $('<div class="frame-mask"></div>');
    $('body').append(mask);
    $('body .top-banner').append(frame);
    cb();
    bindListAction();
    //if (editorcfg.layout == 'full')
    if (true)
        $('.frame-mask').show(); //Only show frame-mask in 'full' mode.
        // Use flex layout for .frame-pop instead of default block from jQuery.show()
        $('.frame-pop').css('display', 'flex');
    //Pop frame will remove 'autohide' in single mode 
    $('#top-banner-row').removeClass('autohide');
}

// 绑定点击蒙层关闭所有弹窗 Bind Mask Click to Close All Pop-ups
function bindListAction() {
    $('.frame-mask').click(() => popClose());
}

// ==========================
// 编辑和存储功能 Editing and Storing Functionality
// ==========================

// 存储博客内容 Save Blog Content
$('body #editor').keyup(() => storePost());

// 恢复博客内容 Restore Post Content
function storePost(cb) {
    if ($('.frame-pop.meta:visible').length > 0) { // In meta config
        if ($('.content.title input').val() !== curpost['title']) {
            $('.posttitle').text($('.content.title input').val());
        }
        // 自动保存元数据 Auto-Saving Metadata
        Object.assign(curpost, {
            title: $('.content.title input').val(),
            date: $('.content.date input').val(),
            info: $('.content.info input').val(),
            comment: $('.content.comment input').val(),
            tags: toArray($('.content.tag input').val()),
            categories: toArray($('.content.cate input').val()),
            published: $('.content.post input').prop('checked'),
            slug: $('.content.slug input').val(),
            content: editor.getValue()
        });
    } else {    //In Editing
        curpost.content = editor.getValue();
    }

    // 保存到本地存储 Save to Local Storage
    chrome.storage.local.set({ 'workingpost': curpost }, () => {
        syncLocalPost();
        if (typeof cb !== 'undefined') cb();
    });
}

// ==========================
// 信息与错误日志 Display Logs for Info and Errors
// ==========================

/**
 * 显示信息日志 Show Info Log
 * @param {string} str 日志信息 Log Message
 */
function logInfo(str) {
    console.info(str);
    $('.notification').removeClass('info error').text(str).addClass('info').show();
    setTimeout(() => $('.notification').text('').hide(), 2000);
}

/**
 * 显示错误日志 Show Error Log
 * @param {string} str 错误信息 Error Message
 */
function logError(str) {
    console.error(str);
    $('.notification').removeClass('info error').text(str).addClass('error').show();
    setTimeout(() => $('.notification').text('').hide(), 2000);
}

// ==========================
// 通用操作和关闭弹窗 Utility Functions and Close Pop-ups
// ==========================

/** 关闭所有弹窗和蒙层 Close All Pop-ups and Mask */
function popClose() {
    $('.frame-pop, .frame-mask').remove();
    $('.frame-icon.focus').removeClass('focus');
    $('.top-masker').hide();
    //Recover auto hide after popclose
    if (editorcfg.layout == 'single') {
        $('#top-banner-row').addClass('autohide');
    }
}

// ==========================
// 切换主题皮肤 Skin Switching
// ==========================

/** 切换皮肤主题 Toggle Theme Skin */
function switchSkin() {
    if (skin == 'dark')
        skin = 'light';
    else
        skin = 'dark';
    chrome.storage.local.set({ skin: skin }, function () {
        //Other
        setView();
    });
}

// ==========================
// 打开帮助文档 Open Help Documentation
// ==========================

/** 打开帮助页面 Open Help Page */
function openHelp() {
    try {
        // 获取语言设置
        chrome.storage.local.get('ui_lang', function(res) {
            let lang = 'en';
            
            // 优先使用存储的语言设置
            if (res && res.ui_lang) {
                lang = res.ui_lang.toLowerCase();
            } else if (window.selected_ui_lang) {
                lang = window.selected_ui_lang.toLowerCase();
            } else if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
                lang = chrome.i18n.getUILanguage().toLowerCase();
            } else if (navigator && navigator.language) {
                lang = navigator.language.toLowerCase();
            }
            
            // 根据语言选择帮助文件
            const helpFile = (lang.indexOf('zh') === 0) ? 'help_zh.html' : 'help_en.html';
            
            // 打开帮助页面
            chrome.tabs.create({ url: chrome.runtime.getURL(helpFile) });
            
            logInfo(gm('helpOpened') || 'Help opened');
        });
    } catch (e) {
        console.warn('Failed to open help:', e);
        logError('Failed to open help: ' + e.message);
    }
}


//Save function

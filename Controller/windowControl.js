// 控制主窗口的操作 Control Main Window Actions

// ==========================
// i18n 多语言翻译功能 i18n Translation Function
// ==========================
function gm(str) {
    return chrome.i18n.getMessage(str);
}

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
    $('.frame-mask').show();
    $('.frame-pop').show();
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
    if ($('.frame-pop.meta:visible').length > 0) {
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
    }

    // 保存到本地存储 Save to Local Storage
    chrome.storage.local.set({ 'workingpost': curpost }, () => {
        console.log('store');
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
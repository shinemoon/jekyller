/* Token 相关功能 - 可移至其他文件 */

// 弹出 Token 配置框 Token Pop-up
function tokenPop(toggle) {
    popFrame('token', toggle, refreshTokenInfo);
}

// 刷新并填充 Token 信息 Refresh and Populate Token Information
function refreshTokenInfo() {
    chrome.storage.local.get("ltoken", function (obj) {
        let ltoken = obj.ltoken || '';

        const tokenInputHTML = `
            <div id="token-input" class="config-input">
                <div class="config-title">${gm('tokenSet')}</div>
                <textarea spellcheck="false" class="config-content">${ltoken}</textarea>
                <span title="${gm('saveToken')}" class="save-token icon icon-checkmark"></span>
                <span title="${gm('cleartoken')}" class="remove-token icon icon-cross"></span>
            </div>
        `;
        const noteHTML = `<div class="popping-note">${gm('tokenHelp')}</div>`;

        $('.frame-pop').append(tokenInputHTML, noteHTML);

        // 更新图标状态 Update Icon State
        function refreshIcon() {
            $(".remove-token").toggleClass('active', ltoken !== "");
        }
        refreshIcon();

        // 保存 Token Save Token
        $('.save-token').on('click', function () {
            if ($(this).hasClass('active')) {
                ltoken = $('.config-content').val();
                chrome.storage.local.set({ 'ltoken': ltoken }, function () {
                    console.log("Token Saved.");
                    refreshIcon();
                    gh.access_token(ltoken);
                    gh.getUserInfo(false);
                });
                $(this).removeClass('active');
            }
        });

        // 清除 Token Remove Token
        $('.remove-token').on('click', function () {
            $.confirm({
                title: gm('confirmRemoveToken'),
                content: gm('confirmRemoveTokenDetails'),
                theme: 'supervan', // 使用内置的主题
                buttons: {
                    confirm: function () {
                        ltoken = "";
                        chrome.storage.local.set({ 'ltoken': ltoken }, function () {
                            console.log("Token Cleared.");
                            tokenPop(false);  // Close the token popup
                            popClose();
                        });
                    },
                    cancel: function () {
                        popClose();
                    },
                }
            });

        });

        // 检测 Token 输入内容变更 Detect Changes in Token Input
        $('.config-content').on('keyup', function () {
            const isChanged = $(this).val() !== ltoken && $(this).val() !== '';
            $('.save-token').toggleClass('active', isChanged);
        });
    });
}

/* Token 相关功能 - 可移至其他文件 */

// 弹出 Token 配置框 Token Pop-up
function tokenPop(toggle) {
    popFrame('token', toggle, refreshTokenInfo);
}
// 弹出 Editor 配置框 Editor Pop-up
function editorPop(toggle) {
    popFrame('cfgEditor', toggle, refreshEditorCfg);
}


// 刷新Editor Cfg 信息 Refresh and Populate Cfg of Editor
function refreshEditorCfg() {
    chrome.storage.local.get("editorMode", function (obj) {
        let emode = obj.emode || 'normal';   //Default is normal
        const htmlStr = `
  <div id="post-table">
    <table>
      <tr>
        <td class="cfgEditor label">${gm("editormode")}</td>
        <td class="cfgEditor content">
                    <div class="radio-group">
                        <select id="cfgEditorMode" name="cfgEditorMode">
                            <option value="normal">${gm("normalmode")}</option>
                            <option value="vim">${gm("vimmode")}</option>
                            <option value="emacs">${gm("emacsmode")}</option>
                            <option value="sublime">${gm("sublimemode")}</option>
                        </select>
                    </div>
        </td>
       </tr>
      <tr>
        <td class="cfgEditor label">${gm("shownumber")}</td>
        <td class="cfgEditor content">
                <input type="checkbox" name="cfgEditorNumber" id="numberShow">
          </div>
        </td>
       </tr>
        <tr>
        <td class="cfgEditor label">${gm("editorLayout")}</td>
        <td class="cfgEditor content">
                    <div class="radio-group">
                        <select id="cfgEditorLayout" name="cfgEditorLayout">
                            <option value="full">${gm("fulllayout")}</option>
                            <option value="single">${gm("singlelayout")}</option>
                        </select>
                    </div>
        </td>
        </tr>
    </table>
  </div>
  <div class="send">${gm("Update")}</div>
`;

        $('.frame-pop').append(htmlStr);

        // Update action:
        $('.cfgEditor .send').click(() => {
            // 获取下拉框的 value
            editorcfg.mode = document.getElementById('cfgEditorMode').value;

            editorcfg.shownumber = $('input[name="cfgEditorNumber"]').prop('checked') == true;

            editorcfg.layout = document.getElementById('cfgEditorLayout').value;

            // Save config
            chrome.storage.local.set({ 'editorconfig': editorcfg }, function () {
                logInfo(gm('configUpdated'));
                //And transform the  editgor
                //Special Mode or not
                if (editorcfg.mode == "normal")
                    editor.setKeyboardHandler(null);
                else
                    editor.setKeyboardHandler("ace/keyboard/" + editorcfg.mode);

                //Number
                editor.setOptions({
                    showLineNumbers: editorcfg.shownumber,
                });

                //Focus & other view relevant refresh
                setView();

                popClose();
            });

        })
        // Refresh the data and fill those rows...
        // Set select values
        if (document.getElementById('cfgEditorMode'))
            document.getElementById('cfgEditorMode').value = editorcfg.mode || 'normal';

        //Show number
        $('input[name="cfgEditorNumber"]').prop('checked', editorcfg.shownumber);

        if (document.getElementById('cfgEditorLayout'))
            document.getElementById('cfgEditorLayout').value = editorcfg.layout || 'full';
    });




}
// 刷新并填充 Token 信息 Refresh and Populate Token Information
function refreshTokenInfo() {
    chrome.storage.local.get("ltoken", function (obj) {
        let ltoken = obj.ltoken || '';

        const tokenInputHTML = `
            <div id="token-input" class="config-input">
                <div class="config-title">${gm('tokenSet')}</div>
                <textarea spellcheck="false" class="config-content">${ltoken}</textarea>
                <div class="config-token-buttons">
                <span title="${gm('saveToken')}" class="save-token icon icon-checkmark"></span>
                <span title="${gm('cleartoken')}" class="remove-token icon icon-cross"></span>
                </div>
            </div>
        `;
        const noteHTML = `<div class="popping-note">${gm('tokenHelp')}</div>`;

        $('.frame-pop').append(noteHTML, tokenInputHTML);

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
                    confirm: {
                        text: gm("yes"),
                        action: function () {
                            ltoken = "";
                            chrome.storage.local.set({ 'ltoken': ltoken }, function () {
                                console.log("Token Cleared.");
                                tokenPop(false);  // Close the token popup
                                popClose();
                            });
                        }
                    },
                    cancel: {
                        text: gm("cancel"),
                        action: function () {
                            popClose();
                        }
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

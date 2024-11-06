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
            <label class="radio-option">
              <input type="radio" name="cfgEditorMode" value="normal"> ${gm("normalmode")}
            </label>
            <label class="radio-option">
              <input type="radio" name="cfgEditorMode" value="vim"> ${gm("vimmode")}
            </label>
            <label class="radio-option">
              <input type="radio" name="cfgEditorMode" value="emacs"> ${gm("emacsmode")}
            </label>
            <label class="radio-option">
              <input type="radio" name="cfgEditorMode" value="sublime"> ${gm("sublimemode")}
            </label>
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
            <label class="radio-option">
              <input type="radio" name="cfgEditorLayout" value="full"> ${gm("fulllayout")}
            </label>
            <label class="radio-option">
              <input type="radio" name="cfgEditorLayout" value="single"> ${gm("singlelayout")}
            </label>
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
            // 获取被选中的 radio button 的 value
            editorcfg.mode = document.querySelector('input[name="cfgEditorMode"]:checked').value;

            if ($('input[name="cfgEditorNumber"]').prop('checked') == true)
                editorcfg.shownumber = true;
            else
                editorcfg.shownumber = false;

            if ($('input[name="cfgEditorLayout"][value="full"]').prop('checked') == true)
                editorcfg.layout = 'full';
            else
                editorcfg.layout = 'single';

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
        //Vim
        //Set the radio button
        document.querySelector(`input[name="cfgEditorMode"][value="${editorcfg.mode}"]`).checked = true;

        //Show number
        $('input[name="cfgEditorNumber"]').prop('checked', editorcfg.shownumber);

        //Vim
        if (editorcfg.layout == 'full') {
            //Set the radio button
            $('input[name="cfgEditorLayout"][value="full"]').prop('checked', true);
            $('input[name="cfgEditorLayout"][value="single"]').prop('checked', false);
        }
        else {
            // set the normal button
            $('input[name="cfgEditorLayout"][value="full"]').prop('checked', false);
            $('input[name="cfgEditorLayout"][value="single"]').prop('checked', true);
        }
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

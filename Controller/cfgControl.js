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

        // 添加同步配置表 Add Sync Configuration Table
        addSyncConfigTable();
    });
}

// 添加同步配置表 Add Sync Configuration Table
function addSyncConfigTable() {
    chrome.storage.local.get(['syncConfig'], function (result) {
        const defaultConfig = {
            mode: 'jekyll',
            generalRepo: '',
            generalFolder: ''
        };
        
        let syncConfig = result.syncConfig || defaultConfig;
        
        // textarea 只显示 general 模式的配置
        const generalRepo = syncConfig.generalRepo || '';
        const generalFolder = syncConfig.generalFolder || '';

        const syncTableHTML = `
            <div id="sync-config-table">
                <table>
                    <tr>
                        <td class="label">${gm('syncMode')}</td>
                        <td class="content">
                            <div class="radio-group">
                                <label>
                                    <input type="radio" name="syncMode" value="jekyll" ${syncConfig.mode === 'jekyll' ? 'checked' : ''}>
                                    ${gm('jekyllMode')}
                                </label>
                                <label style="margin-left: 10px;">
                                    <input type="radio" name="syncMode" value="general" ${syncConfig.mode === 'general' ? 'checked' : ''}>
                                    ${gm('generalMode')}
                                </label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label">${gm('repoLabel')}</td>
                        <td class="content">
                            <input type="text" id="sync-repo" spellcheck="false" ${syncConfig.mode === 'jekyll' ? 'disabled' : ''} value="${generalRepo}">
                        </td>
                    </tr>
                    <tr>
                        <td class="label">${gm('folderLabel')}</td>
                        <td class="content">
                            <input type="text" id="sync-folder" spellcheck="false" ${syncConfig.mode === 'jekyll' ? 'disabled' : ''} value="${generalFolder}">
                        </td>
                    </tr>
                </table>
                <div class="send sync-update" style="opacity: 0.5; pointer-events: none;">${gm('Update')}</div>
            </div>
        `;

        $('.frame-pop').append(syncTableHTML);

        // 保存初始值用于检测变化
        let initialConfig = JSON.parse(JSON.stringify(syncConfig));

        // 切换模式 Toggle Mode
        $('input[name="syncMode"]').on('change', function () {
            const mode = $(this).val();
            const isJekyll = mode === 'jekyll';
            
            // 只切换 disabled 状态，不修改 textarea 的值
            $('#sync-repo, #sync-folder').prop('disabled', isJekyll);
            checkConfigChanged();
        });

        // 检测配置变化 Check Config Changes
        function checkConfigChanged() {
            const currentMode = $('input[name="syncMode"]:checked').val();
            const currentRepo = $('#sync-repo').val().trim();
            const currentFolder = $('#sync-folder').val().trim();
            
            const hasChanged = currentMode !== initialConfig.mode ||
                             currentRepo !== (initialConfig.generalRepo || '') ||
                             currentFolder !== (initialConfig.generalFolder || '');
            
            $('.sync-update').css({
                'opacity': hasChanged ? '1' : '0.5',
                'pointer-events': hasChanged ? 'auto' : 'none'
            });
        }

        // 监听输入变化
        $('#sync-repo, #sync-folder').on('input', checkConfigChanged);

        // 更新配置 Update Config
        $('.sync-update').on('click', async function () {
            const mode = $('input[name="syncMode"]:checked').val();
            const generalRepo = $('#sync-repo').val().trim();
            const generalFolder = $('#sync-folder').val().trim();

            // 获取实际使用的 repo 和 folder 用于验证
            let actualRepo, actualFolder;
            if (mode === 'jekyll') {
                if (!user_info || !user_info.login) {
                    logError(gm('loginFail'));
                    return;
                }
                actualRepo = user_info.login + '/' + user_info.login + '.github.io';
                actualFolder = '_posts';
            } else {
                if (!generalRepo || !generalFolder) {
                    logError(gm('repoAccessFailed'));
                    return;
                }
                actualRepo = generalRepo;
                actualFolder = generalFolder;
            }

            // 验证仓库和文件夹是否可访问
            const isValid = await validateRepoAccess(actualRepo, actualFolder);
            
            if (isValid) {
                const newConfig = { mode, generalRepo, generalFolder };
                chrome.storage.local.set({ 'syncConfig': newConfig }, function () {
                    logInfo(gm('syncConfigUpdated'));
                    initialConfig = JSON.parse(JSON.stringify(newConfig));
                    checkConfigChanged();
                    
                    // 更新 GitHub 配置
                    if (gh && gh.updateSyncConfig) {
                        gh.updateSyncConfig(newConfig);
                    }
                });
            } else {
                logError(gm('repoAccessFailed'));
            }
        });
    });
}

// 验证仓库访问权限 Validate Repo Access
async function validateRepoAccess(repo, folder) {
    return new Promise((resolve) => {
        // 构建 API URL
        const apiUrl = `https://api.github.com/repos/${repo}/contents/${folder}`;
        
        // 使用 gh 的 transparentXhr 方法进行验证
        if (gh && gh.transparentXhr) {
            gh.transparentXhr('GET', apiUrl, function (error, status, response) {
                if (!error && status >= 200 && status < 300) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        } else {
            resolve(false);
        }
    });
}

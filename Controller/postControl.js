// 获取当前配置的文件夹路径 Get Current Folder Path
function getPostFolder() {
    const syncConfig = gh && gh.getSyncConfig ? gh.getSyncConfig() : { mode: 'jekyll' };
    if (syncConfig.mode === 'jekyll') {
        return '_posts';
    }
    return syncConfig.generalFolder || ''; // 空字符串表示根目录
}

// 构建文件路径 Build File Path
function buildFilePath(filename) {
    const folder = getPostFolder();
    return folder ? `${folder}/${filename}` : filename;
}

// 加载当前帖子内容 Load Current Post Content
function loadPost(content) {
    // 使用 -1 参数避免选中所有文本，将光标移至文档开头
    // Use -1 to move cursor to start without selecting all text
    editor.setValue(content, -1);
    updatePreview();                // 刷新预览 Refresh Preview

    // 移除弹框与蒙层 Remove Pop-ups and Mask
    $('.frame-pop, .frame-mask').remove();
    $('.frame-icon.focus').removeClass('focus');
}

// 创建新帖子 Create New Post
function createNewPost() {
    const cur = new Date();
    const datestr = `${cur.getFullYear()}-${cur.getMonth() + 1}-${cur.getDate()}`;

    // 初始化新帖子元数据 Initialize New Post Metadata
    curpost = {
        categories: 'Uncategorized',
        tags: '',
        comment: '',
        info: '',
        date: datestr,
        type: 'post',
        layout: 'post',
        published: false,
        sha: '',
        slug: `the-post-${Math.floor(10000 * Math.random())}`,
        title: 'Unnamed',
        content: ''
    };

    loadCurPost();
}

// 导出帖子数据为 Markdown 格式 Dump Post Data as Markdown
function dumpPost() {
    var shadowpost = { ...curpost };  // 创建内容副本 Create Copy of Post
    var contentstr = shadowpost.content.trim();  // trim内容避免多余空行
    delete shadowpost.content;
    var metastr = YAML.stringify(shadowpost);
    // YAML front matter后接一个换行，然后是内容
    return `---\n${metastr}---\n${contentstr}`;
}

// 加载当前帖子内容 Load Current Post Content
function loadCurPost() {
    loadPost(curpost.content);
    $('.posttitle').text(curpost.title);  // 更新标题 Update Title
    storePost();                          // 自动保存 Auto-save
}

// 更新帖子内容 Update Post Content
function updatePost(cb) {
    const name = `${curpost.date}-${curpost.slug}`;
    const content = dumpPost();
    const sha = curpost.sha;
    const path = buildFilePath(`${name}.md`);

    gh.updateContent(path, content, sha, (e, r, s) => {
        const responseContent = JSON.parse(s);

        if (r == '200') { // 更新成功 Successfully Updated
            logInfo(gm('postUpdated'));
            updateLocalList(responseContent.content.sha);
            storePost();

        } else if (r == '201') { // 已创建 Created
            logInfo(gm('postCreated'));
            curpost.sha = responseContent.content.sha;
            clist.push({ ...curpost });
            storePost();
        } else if (r == '409') { // 版本冲突 Version Conflict
            // 显示冲突错误提示
            logError(gm('ErrVersion') + ' ' + gm('ErrVersionDetails').replace(/<br\/?>/gi, ' '));
        } else { // 其他错误 General Error
            logError(gm('ErrGeneral'));
        }

        chrome.storage.local.set({ clist:clist }, () => $('.frame-mask').click());
        if (typeof cb != 'undefined') cb();
    });
}

// 更新本地帖子列表 Update Local Post List with SHA
function updateLocalList(newSha) {
    for (let i = 0; i < clist.length; i++) {
        if (clist[i].sha == curpost.sha) {
            clist[i] = { ...curpost, sha: newSha };
            curpost.sha = newSha;
            break;
        }
    }
}

// 删除帖子 Delete Post
function deletePost(index, cb) {
    const delpost = clist[index];
    const name = `${delpost.date}-${delpost.slug}`;
    const path = buildFilePath(`${name}.md`);

    gh.deleteContent(path, delpost.sha, (e, r, s) => {
        if (r == '200') { // 删除成功 Successfully Deleted
            logInfo(gm('postDeleted'));
            const deleteIndex = clist.findIndex(item => item.sha == delpost.sha);
            if (deleteIndex != -1) clist.splice(deleteIndex, 1);

            chrome.storage.local.set({ clist:clist }, () => $('.frame-mask').click());
        } else {
            logError(gm('ErrGeneral'));
            $('.frame-mask').click();
        }

        if (typeof cb != 'undefined') cb();
    });
}

// 同步当前帖子到本地存储 Sync Current Post to Local Storage
function syncLocalPost() {
    chrome.storage.local.set({ syncpost: curpost }, () => console.log('Sync complete'));
}

// 获取本地存储的帖子 Get Local Stored Post
function getLocalPost(cb) {
    chrome.storage.local.get({ syncpost: null }, (o) => {
        cb(o.syncpost);
        console.log('Sync complete');
    });
}

// 测试409冲突错误 Test 409 Conflict Error (for testing purposes)
function test409Conflict() {
    console.log('Testing 409 conflict error...');
    // 模拟409冲突响应
    const mockResponse = {
        content: {
            sha: 'mock_sha_123'
        }
    };
    const r = '409';
    const s = JSON.stringify(mockResponse);
    
    // 执行与updatePost中相同的错误处理逻辑
    if (r == '409') {
        logError(gm('ErrVersion') + ' ' + gm('ErrVersionDetails').replace(/<br\/?>/gi, ' '));
    }
}
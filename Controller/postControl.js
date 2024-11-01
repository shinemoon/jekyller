// 加载当前帖子内容 Load Current Post Content
function loadPost(content) {
    editor.setValue(content);
    editor.moveCursorTo(0, 0);      // 将光标移至文档开头 Move Cursor to Start
    editor.clearSelection();        // 清除选区 Clear Selection
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
    const shadowpost = { ...curpost };  // 创建内容副本 Create Copy of Post
    const metastr = YAML.stringify(shadowpost);
    const contentstr = shadowpost.content;
    delete shadowpost.content;

    return `---\n${metastr}\n---\n${contentstr}`;
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
    const path = `_posts/${name}.md`;

    gh.updateContent(path, content, sha, (e, r, s) => {
        const responseContent = JSON.parse(s);
        
        if (r === '200') { // 更新成功 Successfully Updated
            logInfo(gm('postUpdated'));
            updateLocalList(responseContent.content.sha);
            storePost();

        } else if (r === '201') { // 已创建 Created
            logInfo(gm('postCreated'));
            curpost.sha = responseContent.content.sha;
            clist.push({ ...curpost });
            storePost();

        } else { // 出现冲突或错误 Conflict or General Error
            logError(r === '409' ? gm('ErrVersion') : gm('ErrGeneral'));
        }

        chrome.storage.local.set({ clist }, () => $('.frame-mask').click());
        if (typeof cb !== 'undefined') cb();
    });
}

// 更新本地帖子列表 Update Local Post List with SHA
function updateLocalList(newSha) {
    for (let i = 0; i < clist.length; i++) {
        if (clist[i].sha === curpost.sha) {
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
    const path = `_posts/${name}.md`;

    gh.deleteContent(path, delpost.sha, (e, r, s) => {
        if (r === '200') { // 删除成功 Successfully Deleted
            logInfo(gm('postDeleted'));
            const deleteIndex = clist.findIndex(item => item.sha === delpost.sha);
            if (deleteIndex !== -1) clist.splice(deleteIndex, 1);

            chrome.storage.local.set({ clist }, () => $('.frame-mask').click());
        } else {
            logError(gm('ErrGeneral'));
            $('.frame-mask').click();
        }

        if (typeof cb !== 'undefined') cb();
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
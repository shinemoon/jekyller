curpost = null;

// 弹出元数据编辑框 Meta Pop-up
function metaPop(toggle) {
    popFrame('meta', toggle, refreshPostMeta);
}

// 刷新并填充帖子元数据 Refresh and Populate Post Metadata
function refreshPostMeta() {
    $('#post-table').remove();
    const $postTable = $('<div id="post-table"><table></table></div>');
    $('.frame-pop').append($postTable);
    // Hide any ajax loaders inside the frame-pop (ensure we hide all instances)
    $('.frame-pop').find('.ajax-loader').hide();

    const fields = [
        { label: gm('Title'), class: 'title', type: 'text', placeholder: 'Post Title' },
        { label: gm('Slug'), class: 'slug', type: 'text', placeholder: 'Post Slug' },
        { label: gm('Date'), class: 'date', type: 'text', placeholder: 'YYYY-MM-DD' },
        { label: gm('Info'), class: 'info', type: 'text', placeholder: 'User Defined Meta' },
        { label: gm('Tags'), class: 'tag', type: 'text', placeholder: 'taga,tagb,etc.' },
        { label: gm('Category'), class: 'cate', type: 'text', placeholder: 'categorya,categoryb,etc.' },
        { label: gm('Comment'), class: 'comment', type: 'text', placeholder: 'User Defined Meta' }
    ];

    fields.forEach(field => {
        $postTable.find('table').append(`
            <tr>
                <td class="${field.class} label">${field.label}</td>
                <td class="${field.class} content"><input placeholder="${field.placeholder}" type="${field.type}"/></td>
            </tr>
        `);
    });

    $postTable.find('table').append(`
        <tr>
            <td class="post label">${gm('Published')}?</td>
            <td class="post content">
                <input type="checkbox"/>
                <div class="send">${gm('Post')}</div>
            </td>
        </tr>
    `);

    loadDataIntoFields();

    $('.send').on('click', () => {
        if (user_info) {
            $('.top-masker').show();
            storePost(() => {
                updatePost(() => $('.top-masker').hide());
            });
        }
    });
}

// 填充数据到字段 Load Data into Fields
function loadDataIntoFields() {
    if (!curpost) return;

    $('.content.title input').val(curpost.title);
    $('.content.date input').val(curpost.date);
    $('.content.slug input').val(curpost.slug);
    $('.content.info input').val(curpost.info);
    $('.content.comment input').val(curpost.comment);
    $('.content.tag input').val(toString(curpost.tags));
    $('.content.cate input').val(toString(curpost.categories));
    $('.content.post input').prop('checked', curpost.published);

    $('.send').text(curpost.sha ? gm('Update') : gm('Post'));
}

// 转换数组为字符串 Convert Array to String
function toString(input) {
    return Array.isArray(input) ? input.join(',') : (input || '');
}

// 转换字符串为数组 Convert String to Array
function toArray(input) {
    return input ? input.split(',') : [];
}
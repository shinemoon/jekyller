var curpost = null;

function metaPop(toggle) {
  popFrame('meta', toggle, function () {
    //-> Get needed info
    refreshPostMeta();
  });
};

function refreshPostMeta() {
  $('#post-table').remove();
  $('.frame-pop').append('<div id="post-table"><table></table></div>');
  $('.frame-pop .ajax-loader').hide();
  $('.frame-pop table tr').remove();
  //- Title - Post -
  $('.frame-pop table').append('<tr><td class="title label">Title</td><td class="title content"><div>' + '<input placeholder="Post Title"  type="text"/>' + '</div></td></tr><tr><td class="title label">Slug</td><td class="slug content"><div>' + '<input placeholder="Post Slug"  type="text"/>' + '</div></td></tr>');
  $('.frame-pop table').append('<tr><td class="date label">Date</td><td class="date content"><div>' + '<input placeholder="YYYY-MM-DD"  type="text"/>' + '</div></td></tr><tr><td class="info label">' + 'Info </td><td class="info content"> <input placeholder="User Defined Meta" type="text"/>' + '</td></tr>');
  $('.frame-pop table').append('<tr><td class="tag label">Tag</td><td class="tag content"><div>' + '<input placeholder="taga,tagb,etc."  type="text"/>' + '</div></td></tr><tr><td class="cate label">' + 'Category </td><td class="cate content"> <input placeholder="catetorya,categoryb,etc." type="text"/>' + '</td></tr>');
  $('.frame-pop table').append('<tr><td class="comment label">Comment</td><td class="comment content"><div>' + '<input placeholder="User Defined Meta"  type="text"/>' + '</div></td></tr><tr><td class="post label">' + 'Published? </td><td class="post content"> <input type="checkbox"/><div class="send">Post</div>' + '</td></tr>');

  //-> LoadData
  if (curpost != null) {
    $('.content.title input').val(curpost.title);
    $('.content.date input').val(curpost.date);
    $('.content.slug input').val(curpost.slug);
    $('.content.info input').val(curpost.info);
    $('.content.comment input').val(curpost.comment);
    $('.content.tag input').val(toString(curpost.tags));
    $('.content.cate input').val(toString(curpost.categories));
    $('.content.post input').prop('checked', curpost.published);
    if (curpost.sha != null || curpost.sha != "") {
      $('.send').text('Update');
    }
  }

  $('.send').click(function () {
    if (user_info == null) {
      return;
    }
    $('.top-masker').show();
    storePost(function () {
      updatePost(function () {
        $('.top-masker').hide();
      });
    });
  })
}


function toString(inp) {
  if (typeof (inp) == 'undefined' || inp == null) return "";
  if (typeof (inp) == 'string') {
    return inp;
  } else {
    var str = '';
    for (var i = 0; i < inp.length; i++) {
      str = str + inp[i];
      if (i < inp.length - 1)
        str = str + ',';
    }
    return str;
  }
}

function toArray(inp) {
  if (typeof (inp) == 'undefined' || inp == null) return "";
  if (typeof (inp) == 'string') {
    return inp.split(',');
  }
}
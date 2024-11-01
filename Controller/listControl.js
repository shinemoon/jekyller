/* Element & Parameters 元素和参数 */
var listCnt = 6; // 每页显示的项目数量 Number of items per page
var plist = null; // 用于存储博客列表的主列表 Primary list for storing blog posts
var clist = []; // 当前显示的博客项目列表 List of current blog posts displayed
var slist = []; // 搜索结果列表 List for search results
var curpost = null; // 当前显示的博客文章 Current blog post being displayed
var curpage = 0; // 当前页码 Current page number
var totalpage = 1; // 总页数 Total number of pages
var searchStr = ''; // 当前搜索的字符串 Current search string

// 日期操作的工具对象 Utility object for date operations
var dates = {
  // 将不同格式的输入转换为日期对象 Converts various formats into a date object
  convert: function (d) {
    return (
      d.constructor === Date ? d :
        d.constructor === Array ? new Date(d[0], d[1], d[2]) :
          d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
              typeof d === "object" ? new Date(d.year, d.month, d.date) :
                NaN
    );
  },
  // 比较两个日期，返回 -1，0 或 1 Compare two dates, returns -1, 0, or 1
  compare: function (a, b) {
    return (
      isFinite(a = this.convert(a).valueOf()) &&
        isFinite(b = this.convert(b).valueOf()) ?
        (a > b) - (a < b) :
        NaN
    );
  },
  // 检查日期是否在指定范围内 Checks if a date is within a specified range
  inRange: function (d, start, end) {
    return (
      isFinite(d = this.convert(d).valueOf()) &&
        isFinite(start = this.convert(start).valueOf()) &&
        isFinite(end = this.convert(end).valueOf()) ?
        start <= d && d <= end :
        NaN
    );
  }
}

// 弹出博客列表的框架 Pop-up the frame for blog list
async function listPop(toggle) {
  if (plist == null) {
    // 如果 plist 未手动刷新，使用上一次的列表 Use previous list if plist is not manually refreshed
    [plist, clist, curpage, searchStr] = await new Promise((resolve) => {
      chrome.storage.local.get({ 'plist': [], 'clist': [], 'curpage': 0, 'searchStr': '' }, function (result) {
        resolve([result.plist, result.clist, result.curpage, result.searchStr]);
      });
      console.log(curpage);
    });
  }
  popFrame('list', toggle, function () {
    // 获取需要的信息 Get needed info
    $('.frame-pop').html('<div class=ajax-loader><img src="/assets/loader.gif"/></div>');
    $('.frame-pop .ajax-loader').hide();
    $('.frame-pop').append('<div id="tool-banner"><img id="refresh" src="/assets/refresh.png"/ title="Refesh the List"></div>');
    // 搜索区域 Search area
    $('.frame-pop').append("<div id='list-type'></div>");
    $('.frame-pop').append("<div  id='search-pannel'></div>");
    $('#search-pannel').append("<textarea id='txt-search' οnfοcus='this.select()' οnmοuseοver='this.focus()' spellcheck=false></textarea>");
    $('#search-pannel').append("<span class='nav icon-search' id='search' title='Search Blog'></span>");
    $('#txt-search').val(searchStr);

    if (searchStr == '') {
      $('#list-type').text('All'); // 全部列表 All list
    } else {
      $('#list-type').text('Search'); // 搜索结果 Search results
    }

    // 刷新按钮事件 Refresh button event
    $('img#refresh').click(function () {
      $('#txt-search').val('');
      chrome.storage.local.set({ searchStr: $('#txt-search').val() }, function (result) {
        getPostList(getPostDetails, type = 'all'); // 刷新全列表 Refresh the full list from GitHub
        $('.frame-pop .ajax-loader').show();
      });
    });

    // 搜索按钮事件 Search button event
    $('#search').click(function () {
      $('.frame-pop .ajax-loader').show();
      searchStr = $('#txt-search').val();
      chrome.storage.local.set({ searchStr: searchStr }, function (result) {
        getPostList(getPostDetails, type = 'search'); // 搜索并刷新列表 Search and refresh the list
      });
    });

    $('#txt-search').on('keydown', function (event) {
      if (event.keyCode === 13) { // 按下回车键 Enter key pressed
        event.preventDefault();
        $(this).blur();
        $('#search').click();
      }
    });

    // 刷新列表 Refresh the list
    processList(curpage);
  });
}

// 远程获取博客列表 Fetch blog list remotely
function getPostList(cb, type = 'all') {
  clist = [];
  if (typeof (user_info) == "undefined") {
    gh.onLogInFailed();
    return;
  } else {
    if (type == 'all') {
      $('#list-type').text('All'); // 显示全部 Show all
      gh.fetchPostListTree(user_info.login, function (e, s, r) {
        curpage = 0;
        plist = JSON.parse(r);
        try {
          plist = plist['tree']
        } catch {
        }
        if (typeof (cb) != 'undefined') cb();
      }, gh.onLogInFailed);
    };
    if (type == 'search') {
      $('#list-type').text('Search '); // 显示搜索结果 Show search results
      gh.searchPost(user_info.login, $('#txt-search').val(), function (e, s, r) {
        slist = JSON.parse(r);
        if (slist['total_count'] >= 0) { // 保存搜索字符串和结果 Save search string and results
          curpage = 0;
          slist = slist['items'];
          rlist = [];
          console.log(slist);

          // 处理搜索结果数据 Process search results data
          function processData(slist) {
            return new Promise(function (resolve, reject) {
              var rlist = [];
              $.each(slist, function (i, item) {
                rlist.push({
                  path: item.name,
                  name: item.name,
                  sha: item.sha,
                  mode: '100644'
                });
              });
              resolve(rlist);
            });
          }
          processData(slist)
            .then(function (rlist) {
              plist = rlist;
              if (typeof (cb) != 'undefined') cb();
            })
            .catch(function (error) {
              // 处理错误 Handle errors
            });
        }
      }, gh.onLogInFailed);
    };
  }
}

// 构建博客列表 Construct the blog list
function refreshPostList() {
  function constructUI() {
    $('#plist-table').remove();
    $('#list-page').remove();

    function uniformList() {
      // slist => plist
    }

    $('.frame-pop').append('<div id="plist-table"><table></table></div>');
    $('.frame-pop .ajax-loader').hide();
    $('.frame-pop table tr').remove();
    clist.every(function (v, i) {
      $('.frame-pop table').append('<tr><td class="ind icon-bin"></td><td class="title"><div>' + v.title + '</div></td><td class="date"><a target=_blank href="http://' + user_info.login + '.github.io/' + v.slug + '">' + normalizeDate(v.date) + '</a></td></tr>');
      $('td.title:last').data('index', i);
      $('td.date:last').data('url', user_info.login + '.github.io/' + v.slug);
      if (i == clist.length - 1) return false;
      return true;
    });

    // 添加分页标记 Add pagination markers
    $('.frame-pop').append("<div  id='list-page'></div>");
    $('#list-page').append("<span class='nav icon-first' id='first'></span>");
    $('#list-page').append("<span class='nav icon-previous2' id='next'></span>");
    $('#list-page').append("<span class='nav number' id='pnumber'><textarea οnfοcus='this.select()' οnmοuseοver='this.focus()'></textarea></span>");
    $('#list-page').append("<span class='nav icon-next2' id='prev'></span>");
    $('#list-page').append("<span class='nav icon-last' id='last'></span>");

    $('#pnumber textarea').val(curpage + 1);
    $('#pnumber textarea').on('input', function (event) {
      const text = $(this).val();
      const digits = text.match(/^\d{0,4}/)[0];
      if (digits !== text) {
        $(this).val(digits);
      }
    });

    $('#pnumber textarea').on('keydown', function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        $(this).blur();
      }
    });

    $('#pnumber textarea').on('blur', function () {
      const page = Math.min(totalpage, Math.max(1, $('#pnumber textarea').val()));
      if (page != curpage) processList(page - 1);
    });

    bindPageAction();
  }

  constructUI();
}

// 为分页控件绑定事件 Bind events to pagination controls
function bindPageAction() {
  totalpage = Math.ceil(plist.length / listCnt);

  // 点击首页按钮 First page button click
  $('#first').click(function () {
    if (!isLoaderVisible()) processList(0);
  });

  // 点击末页按钮 Last page button click
  $('#last').click(function () {
    if (!isLoaderVisible()) processList(totalpage - 1);
  });

  // 点击下一页按钮 Next page button click
  $('#prev').click(function () {
    if (!isLoaderVisible() && curpage < totalpage - 1) processList(curpage + 1);
  });

  // 点击上一页按钮 Previous page button click
  $('#next').click(function () {
    if (!isLoaderVisible() && curpage > 0) processList(curpage - 1);
  });
}

// 判断加载器是否可见 Helper function to check if loader is visible
function isLoaderVisible() {
  return !$('.frame-pop .ajax-loader').is(':hidden');
}

// 处理分页列表 Process pagination list
async function processList(page = 0, forcerefresh = false) {
  if (page != curpage || forcerefresh == true) {
    curpage = page;
    clist = await fetchPageContent(plist, page * listCnt, listCnt);
    chrome.storage.local.set({ clist: clist, plist: plist, curpage: curpage });
    refreshPostList();
  } else {
    chrome.storage.local.get({ 'clist': [] }, function (obj) {
      clist = obj.clist;
      refreshPostList();
    });
  }
}

// 加载指定页面内容 Fetch content for specified page
async function fetchPageContent(list, start, count) {
  $('.frame-pop .ajax-loader').show();
  const contentList = [];
  for (let i = start; i < start + count && i < list.length; i++) {
    const content = await gh.getContentAsync("_posts/" + list[i].path);
    if (content.date.match(/\d+-\d+-\d+/)) {
      contentList.push({
        ...postParse(content.content),
        date: content.date,
        sha: content.sha,
        slug: content.url.split('/').pop()
      });
    }
  }
  $('.frame-pop .ajax-loader').hide();
  return contentList;
}
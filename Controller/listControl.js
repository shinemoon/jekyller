/* Element & Parameters */
var listCnt = 6;
var plist = null;
var clist = [];
var slist = []; // Search
var curpost = null;
var curpage = 0;
var totalpage = 1;
var searchStr = '';


var dates = {
  convert: function (d) {
    // Converts the date in d to a date-object. The input can be:
    //   a date object: returned without modification
    //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
    //   a number     : Interpreted as number of milliseconds
    //                  since 1 Jan 1970 (a timestamp) 
    //   a string     : Any format supported by the javascript engine, like
    //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
    //  an object     : Interpreted as an object with year, month and date
    //                  attributes.  **NOTE** month is 0-11.
    return (
      d.constructor === Date ? d :
        d.constructor === Array ? new Date(d[0], d[1], d[2]) :
          d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
              typeof d === "object" ? new Date(d.year, d.month, d.date) :
                NaN
    );
  },
  compare: function (a, b) {
    // Compare two dates (could be of any type supported by the convert
    // function above) and returns:
    //  -1 : if a < b
    //   0 : if a = b
    //   1 : if a > b
    // NaN : if a or b is an illegal date
    // NOTE: The code inside isFinite does an assignment (=).
    return (
      isFinite(a = this.convert(a).valueOf()) &&
        isFinite(b = this.convert(b).valueOf()) ?
        (a > b) - (a < b) :
        NaN
    );
  },
  inRange: function (d, start, end) {
    // Checks if date in d is between dates in start and end.
    // Returns a boolean or NaN:
    //    true  : if d is between start and end (inclusive)
    //    false : if d is before start or after end
    //    NaN   : if one or more of the dates is illegal.
    // NOTE: The code inside isFinite does an assignment (=).
    return (
      isFinite(d = this.convert(d).valueOf()) &&
        isFinite(start = this.convert(start).valueOf()) &&
        isFinite(end = this.convert(end).valueOf()) ?
        start <= d && d <= end :
        NaN
    );
  }
}


//Popping the Frame for blog list
async function listPop(toggle) {
  if (plist == null) {
    // If Plist not refreshed manually, use previous one
    [plist, clist, curpage, searchStr] = await new Promise((resolve) => {
      chrome.storage.local.get({ 'plist': [], 'clist': [], 'curpage': 0, 'searchStr': '' }, function (result) {
        resolve([result.plist, result.clist, result.curpage, result.searchStr]);
      });
      console.log(curpage);
    });
  }
  popFrame('list', toggle, function () {
    //-> Get needed info
    $('.frame-pop').html('<div class=ajax-loader><img src="/assets/loader.gif"/></div>');
    $('.frame-pop .ajax-loader').hide();
    $('.frame-pop').append('<div id="tool-banner"><img id="refresh" src="/assets/refresh.png"/ title="Refesh the List"></div>');
    //Search Area!
    $('.frame-pop').append("<div id='list-type'></div>");
    $('.frame-pop').append("<div  id='search-pannel'></div>");
    $('#search-pannel').append("<textarea id='txt-search' οnfοcus='this.select()' οnmοuseοver='this.focus()' spellcheck=false></textarea>");
    $('#search-pannel').append("<span class='nav icon-search' id='search' title='Search Blog'></span>");
    $('#txt-search').val(searchStr);

    if (searchStr == '') {
      $('#list-type').text('All');
    } else {
      $('#list-type').text('Search');
    }



    $('img#refresh').click(function () {
      $('#txt-search').val('');
      chrome.storage.local.set({ searchStr: $('#txt-search').val() }, function (result) {
        getPostList(getPostDetails, type = 'all'); //Compare with processList, getPostList will refresh the full post list from github
        $('.frame-pop .ajax-loader').show();
      });
    });

    $('#search').click(function () {
      $('.frame-pop .ajax-loader').show();
      searchStr = $('#txt-search').val();
      chrome.storage.local.set({ searchStr: searchStr}, function (result) {
        getPostList(getPostDetails, type = 'search'); //Compare with processList, getPostList will refresh the full post list from github
      });
    });


    $('#txt-search').on('keydown', function (event) {
      // 如果按下了回车键
      if (event.keyCode === 13) {
        event.preventDefault(); // 阻止默认的回车行为
        // 在此处添加你希望的处理逻辑
        $(this).blur();
        $('#search').click();
      };
    });


    //Refresh list
    processList(curpage);
  });
}

//To Remotely Fetch blog list
function getPostList(cb, type = 'all') {
  clist = [];
  if (typeof (user_info) == "undefined") {
    gh.onLogInFailed();
    return;
  } else {
    if (type == 'all') {
      $('#list-type').text('All');
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
      $('#list-type').text('Search ');
      gh.searchPost(user_info.login, $('#txt-search').val(), function (e, s, r) {
        slist = JSON.parse(r);
        if (slist['total_count'] >= 0) { //Save the search string & the list!
          curpage = 0;
          slist = slist['items'];
          rlist = [];
          console.log(slist);
          //To sort rlist info
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
              // 处理 plist 数组
              if (typeof (cb) != 'undefined') cb();
            })
            .catch(function (error) {
              // 处理错误
            });
        }
      }, gh.onLogInFailed);
    };
  }
}


// Construct the blog list
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

    //Pagination Mark
    $('.frame-pop').append("<div  id='list-page'></div>");
    $('#list-page').append("<span class='nav icon-first' id='first'></span>");
    $('#list-page').append("<span class='nav icon-previous2' id='next'></span>");
    $('#list-page').append("<span class='nav number' id='pnumber'><textarea οnfοcus='this.select()' οnmοuseοver='this.focus()'></textarea></span>");
    $('#list-page').append("<span class='nav icon-next2' id='prev'></span>");
    $('#list-page').append("<span class='nav icon-last' id='last'></span>");


    $('#pnumber textarea').val(curpage + 1);
    $('#pnumber textarea').on('input', function (event) {
      // 获取输入的文本内容
      const text = $(this).val();

      // 用正则表达式匹配文本内容，只保留前4个数字
      const digits = text.match(/^\d{0,4}/)[0];

      // 如果输入的文本内容超过4个数字，则更新textarea的值为前4个数字
      if (digits !== text) {
        $(this).val(digits);
      }
    });

    $('#pnumber textarea').on('keydown', function (event) {
      // 如果按下了回车键
      if (event.keyCode === 13) {
        event.preventDefault(); // 阻止默认的回车行为
        // 在此处添加你希望的处理逻辑
        $(this).blur();
      }
    });


    $('#pnumber textarea').on('blur', function (event) {
      // Meanwhile we need to ensure this is legal number
      if ($(this).val() < 1)
        $(this).val(1);
      if ($(this).val() > totalpage)
        $(this).val(totalpage);
      if ($(this).val() != curpage)
        processList($(this).val() - 1);
    });
  }
  function bindPageAction() {
    totalpage = Math.ceil(plist.length / 6);
    $('#first').click(function () {
      if (!$('.frame-pop .ajax-loader').is(':hidden')) {
        return;
      }
      $('#pnumber textarea').val(1);

      processList(0);
    })
    $('#last').click(function () {
      if (!$('.frame-pop .ajax-loader').is(':hidden')) {
        return;
      }
      $('#pnumber textarea').val(totalpage);
      processList(totalpage - 1);
    })

    $('#prev').click(function () {
      if (!$('.frame-pop .ajax-loader').is(':hidden')) {
        return;
      }
      if (curpage < totalpage - 1) {
        $('#pnumber textarea').val(curpage + 2);
        processList(curpage + 1);
      }
    })

    $('#next').click(function () {
      if (!$('.frame-pop .ajax-loader').is(':hidden')) {
        return;
      }
      if (curpage > 0) {
        $('#pnumber textarea').val(curpage);
        processList(curpage - 1);
      }
    })


    $('td.ind').confirmOn({
      questionText: 'Are You Sure to Delete This Post?',
      textYes: 'Yes, I\'m sure',
      textNo: 'No, I\'m not sure'
    }, 'click', function (e, confirmed) {
      if (confirmed) {
        //console.log($('#plist-table').data('curind'));
        $('.top-masker').show();
        deletePost($('#plist-table').data('curind'), function () {
          $('.top-masker').hide();
        });
      }
    });
    $('td.ind').click(function () {
      $('#plist-table').data('curind', $(this).parent().find('td.title').data('index'));
    });

    $('td.title').click(function () {
      $('#plist-table').data('curind', $(this).data('index'));
    });
    $('td.title').confirmOn({
      questionText: gm('emptyblog'),
      textYes: gm('yes'),
      textNo:gm('cancel') 
    }, 'click', function (e, confirmed) {
      if (confirmed)
        loadText($('#plist-table').data('curind'));
    })
  }

  // Execution
  constructUI();
  bindPageAction();
}

// To sort & filter post per blog file name 
function getPostDetails() {
  processList(curpage, true);
}

/* Thanks For ChatGPT, you know such promise & await & async is always my headache, but it well helped me to re-coded */
async function processList(page = 0, forcerefesh = false) {
  var force = forcerefesh;
  clist = []
  var nlist = plist.sort(function (a, b) {
    a.name = a.path;
    b.name = b.path;
    //refine name
    var adate = refineDate(a.name).replace(/(\d+-\d+-\d+)-.*\.md/, "$1");
    var bdate = refineDate(b.name).replace(/(\d+-\d+-\d+)-.*\.md/, "$1");

    //For invalid post
    if (adate == a.name)
      adate = "1900-01-01";

    if (bdate == b.name)
      bdate = "1900-01-01";

    var ret = dates.compare(adate, bdate);
    if (ret == NaN) {
      ret = -1;
    }
    return ret;
  });

  var nnlist = [];
  for (var i = 0; i < nlist.length; i++) {
    if (nlist[i].name.match(/^\d+-\d+-\d+-.*\.md/) != null) {
      nnlist.push(nlist[i]);
    }
  }

  if (page != curpage || force) { //New fetch needed, since page switched
    var startIndex = page * listCnt
    $('.frame-pop .ajax-loader').show();
    for (var i = startIndex; i < startIndex + listCnt; i++) {
      if (i == nnlist.length) break;
      console.log(nnlist[nnlist.length - 1 - i].path);
      var c = await gh.getContentAsync("_posts/" + nnlist[nnlist.length - 1 - i].path);
      var pcontent = postParse(c.content);
      if (c.date.match(/\d+-\d+-\d+/) == null) {
        continue;
      }
      pcontent['date'] = c.date;
      pcontent['sha'] = c.sha;
      pcontent['slug'] = c.url.replace(/^.*\//, '');
      if (clist.length < listCnt) {
        clist.push(pcontent);
        curpage = page;
      }
    }
    await new Promise((resolve) => {
      chrome.storage.local.set({ clist: clist, plist: plist, curpage: page }, function (result) {
        resolve(result);
      })
    });
    $('.frame-pop .ajax-loader').hide();
    refreshPostList();
  }
  // Just refresh 
  chrome.storage.local.get({ "clist": [] }, function (obj) {
    if (typeof (obj.clist) != 'undefined' && obj.clist.length > 0) {
      clist = obj.clist;
      refreshPostList();
    }
  });
};


/* Funciton to load the post content after click the title */
function loadText(ind) {
  //-> The Post are loaded inside!
  console.info(clist[ind]);
  loadPost(clist[ind].content);
  //Title
  $('.posttitle').text(clist[ind].title);
  curpost = clist[ind];
  storePost();
}

// Some util to refine the date format 
function refineDate(dstr) {
  if (dstr.match(/-(\d)-/) == null) {
    return dstr;
  } else {
    nstr = dstr.replace(/-(\d)-/g, "-0$1-");
    return refineDate(nstr);
  }
}
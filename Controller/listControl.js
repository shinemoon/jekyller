var listCnt = 6;

var dates = {
    convert:function(d) {
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
            d.constructor === Array ? new Date(d[0],d[1],d[2]) :
            d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
            typeof d === "object" ? new Date(d.year,d.month,d.date) :
            NaN
        );
    },
    compare:function(a,b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a=this.convert(a).valueOf()) &&
            isFinite(b=this.convert(b).valueOf()) ?
            (a>b)-(a<b) :
            NaN
        );
    },
    inRange:function(d,start,end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
       return (
            isFinite(d=this.convert(d).valueOf()) &&
            isFinite(start=this.convert(start).valueOf()) &&
            isFinite(end=this.convert(end).valueOf()) ?
            start <= d && d <= end :
            NaN
        );
    }
}


var root = null;
var plist = null;
var clist = [];
var curpost = null;
chrome.runtime.getBackgroundPage(function(r) { root = r;});


function listLocalClose(){
    $('.frame-pop.local').remove();
    $('.frame-mask').remove();
    $('.frame-icon#local.focus').removeClass('focus');
}

function listClose(){
    $('.frame-pop.remote').remove();
    $('.frame-mask').remove();
    $('.frame-icon#list.focus').removeClass('focus');
}

function listLocalPop(toggle){
  $('#local').addClass('focus');
  //- Toggle
  if(toggle && $('.frame-pop.local:visible').length>0) {
    listLocalClose();
    return 0;
  }

  listClose();
  var frame = $('<div class="frame-pop local"></div>');
  var mask = $('<div class="frame-mask"> </div>');
  $('body').append(frame);
  $('body').append(mask);

//  $('.frame-pop').append('<div id="label-banner"> Meta </div>');
  //refresh pop
  //-> Get needed info
  refreshPostMeta();
  bindListAction(); //windowControl

  $('.frame-mask').show();
  $('.frame-pop').show();

}


function listPop(toggle){
  $('#list').addClass('focus');
  //- Toggle
  if(toggle && $('.frame-pop.remote:visible').length>0) {
    listClose();
    return 0;
  }

  listLocalClose();

  var frame = $('<div class="frame-pop remote"></div>');
  var mask = $('<div class="frame-mask"> </div>');
  $('body').append(frame);
  $('body').append(mask);

  $('.frame-pop').html('<div class=ajax-loader><img src="/assets/loader.gif"/></div>');
  $('.frame-pop .ajax-loader').hide();

  $('.frame-pop').append('<div id="tool-banner"><img id="refresh" src="/assets/refresh.png"/></div>');
//  $('.frame-pop').append('<div id="label-banner">  Recent </div>');


  //refresh pop
  //-> Get needed info
  bindListAction(); //windowControl

  chrome.storage.local.get("clist",function(obj){
    if(typeof(obj.clist)!='undefined' && obj.clist.length>0) {
      clist = obj.clist;
      refreshPostList();
    }
  });

  $('.frame-mask').show();
  $('.frame-pop').show();

}

//获取博文列表


function getUserInfo(cb) {
  gh.transparentXhr('GET',
              'https://api.github.com/user',
               cb);
}

function getPostList(cb) {
    clist = [];
	gh.fetchPostList(root.user_info.login,function(e, s, r){
		plist = JSON.parse(r);
	    if(typeof(cb)!='undefined') cb(plist);
	});
}

function getPostDetails(plist){
  nlist = plist.sort(function (a, b) {
    //refine name
    var adate = refineDate(a.name).replace(/(\d+-\d+-\d+)-.*\.md/, "$1");
    var bdate = refineDate(b.name).replace(/(\d+-\d+-\d+)-.*\.md/, "$1");


    //For invalid post
    if(adate == a.name)
        adate = "1900-01-01";

    if(bdate == b.name)
        bdate = "1900-01-01";

    var ret = dates.compare(adate,bdate);
    if(ret == NaN){
        ret = -1;
    }
    return ret;
  });


  var nnlist = [];
  for(var i = 0; i<nlist.length; i++) {
    console.log(nlist[i].name);
    if(nlist[i].name.match(/^\d+-\d+-\d+-.*\.md/)!=null) {
        nnlist.push(nlist[i]);
    }
  }

  // Need to sort with date!
  //=> Need recursively loading!
  for(var i = 0; i< listCnt; i++){
    if(i==nnlist.length) break;
    console.log(nnlist[nnlist.length-1-i].path);
    gh.getContent(nnlist[nnlist.length-1-i].path,function(c){
      var pcontent = postParse(c.content);
      if(c.date.match(/\d+-\d+-\d+/)==null) {
				return;
      }
      pcontent['date'] = c.date;
      pcontent['sha'] = c.sha;
      pcontent['slug'] = c.url.replace(/^.*\//,'');
      if(clist.length< listCnt){
        clist.push(pcontent);
        chrome.storage.local.set({clist:clist},function(){
            refreshPostList();
        });
        }
    });
  }
}

function refreshPostMeta(){
  $('#post-table').remove();
  $('.frame-pop').append('<div id="post-table"><table></table></div>');
  $('.frame-pop .ajax-loader').hide();
  $('.frame-pop table tr').remove();
	//- Title - Post -
  $('.frame-pop table').append('<tr><td class="title label">Title</td><td class="title content"><div>'+'<input placeholder="Post Title"  type="text"/>'+'</div></td></tr><tr><td class="title label">Slug</td><td class="slug content"><div>'+'<input placeholder="Post Slug"  type="text"/>'+'</div></td></tr>');
  $('.frame-pop table').append('<tr><td class="date label">Date</td><td class="date content"><div>'+'<input placeholder="YYYY-MM-DD"  type="text"/>'+'</div></td></tr><tr><td class="info label">'+'Info </td><td class="info content"> <input placeholder="User Defined Meta" type="text"/>'+'</td></tr>');
  $('.frame-pop table').append('<tr><td class="tag label">Tag</td><td class="tag content"><div>'+'<input placeholder="taga,tagb,etc."  type="text"/>'+'</div></td></tr><tr><td class="cate label">'+'Category </td><td class="cate content"> <input placeholder="catetorya,categoryb,etc." type="text"/>'+'</td></tr>');
  $('.frame-pop table').append('<tr><td class="comment label">Comment</td><td class="comment content"><div>'+'<input placeholder="User Defined Meta"  type="text"/>'+'</div></td></tr><tr><td class="post label">'+'Published? </td><td class="post content"> <input type="checkbox"/><div class="send">Post</div>'+'</td></tr>');

	//-> LoadData
	if(curpost != null) {
		$('.content.title input').val(curpost.title);
		$('.content.date input').val(curpost.date);
		$('.content.slug input').val(curpost.slug);
		$('.content.info input').val(curpost.info);
		$('.content.comment input').val(curpost.comment);
		$('.content.tag input').val(toString(curpost.tags));
		$('.content.cate input').val(toString(curpost.categories));
		$('.content.post input').prop('checked',curpost.published);
		if(curpost.sha!=null || curpost.sha!="") {
			$('.send').text('Update');
		}
	}

	$('.send').click(function(){
	  if(root.user_info == null) {
	    return;
	  }
		$('.top-masker').show();
		storePost(function(){
			updatePost(function(){
				$('.top-masker').hide();
			});
		});
	})
}


function toString(inp){
	if(typeof(inp)=='undefined' || inp == null) return "";
	if(typeof(inp)=='string'){
		return inp;
	}else {
		var str = '';
		for(var i =0; i<inp.length; i++) {
			str = str + inp[i];
			if(i<inp.length-1)
				str = str + ',';
		}
		return str;
	}
}

function toArray(inp) {
	if(typeof(inp)=='undefined' || inp == null) return "";
	if(typeof(inp)=='string'){
		return inp.split(',');
	}
}

function refreshPostList(){
  $('#plist-table').remove();
  $('.frame-pop').append('<div id="plist-table"><table></table></div>');
  $('.frame-pop .ajax-loader').hide();
  $('.frame-pop table tr').remove();
  clist.every(function(v,i){
    $('.frame-pop table').append('<tr><td class="ind icon-bin"></td><td class="title"><div>'+v.title+'</div></td><td class="date"><a target=_blank href="http://'+root.user_info.login+'.github.io/'+v.slug+'">'+v.date+'</a></td></tr>');
    $('td.title:last').data('index',i);
    $('td.date:last').data('url',root.user_info.login+'.github.io/'+v.slug);
    if(i==clist.length-1) return false;
    return true;
  })


	$('td.ind').confirmOn({
 		questionText: 'Are You Sure to Delete This Post?',
		textYes: 'Yes, I\'m sure',
		textNo: 'No, I\'m not sure'
	},'click', function(e,confirmed){
		if(confirmed) {
			//console.log($('#plist-table').data('curind'));
			$('.top-masker').show();
			deletePost($('#plist-table').data('curind'),function(){
				$('.top-masker').hide();
			});
		}
	});

	$('td.ind').click(function(){
		$('#plist-table').data('curind', $(this).parent().find('td.title').data('index'));
	});

	$('td.title').click(function(){
		$('#plist-table').data('curind',$(this).data('index'));
	});

	$('td.title').confirmOn({
 		questionText: 'Local Post Will Be Overrided by This One, Is It OK?',
		textYes: 'Yes, I\'m sure',
		textNo: 'No, I\'m not sure'
 	 }, 'click', function(e, confirmed){
		if(confirmed)
    	loadText($('#plist-table').data('curind'));
  })
}

function loadText(ind) {
	//-> The Post are loaded inside!
	console.info(clist[ind]);
  loadPost(clist[ind].content);
	//Title
	$('.posttitle').text(clist[ind].title);
	curpost = clist[ind];
	storePost();
}


function refineDate(dstr){
        if(dstr.match(/-(\d)-/)== null ) {
            return dstr;
        } else {
            nstr = dstr.replace(/-(\d)-/g, "-0$1-");
            return refineDate(nstr);
        }
}

//Control Main windows' action
	$('.img#create').confirmOn({
 		questionText: 'Local Post Will Be Emptied , Is It OK?',
		textYes: 'Yes, I\'m sure',
		textNo: 'No, Thanks'
 	 }, 'click', function(e, confirmed){
		if(confirmed)
    	createNewPost();
  })

	$('.img#local').click(function(){
	  $('.focus').removeClass('focus');
       listLocalPop(true);
	});

	$('.img#list').click(function(){
	  $('.focus').removeClass('focus');
       listPop(true);
	});

	$('.img#skin').click(function(){
        $('.focus').removeClass('focus');
        switchSkin();
	});

	$('.img#token').click(function(){
        $('.focus').removeClass('focus');
        tokenPop();
	});



	$('.frame-icon.op').mouseenter(function(){
		$('.tooltiptext').text($(this).attr('val'));
		$('.tooltip').fadeIn(100);
	});

	$('.frame-icon.op').mouseleave(function(){
		$('.tooltiptext').text('-');
		$('.tooltip').fadeOut(100);
	});





 function bindListAction(){
	$('.frame-mask').click(function(){
		listClose();
	  listLocalClose();
	});

	$('#refresh').click(function(){
	  getUserInfo(function(){
	    getPostList(getPostDetails);
	  });
	  $('.frame-pop .ajax-loader').show();
	});
 }

$('body').keyup(function(){
  storePost();
})

$('#user_info').click(function(){
});

function storePost(cb){
  if($('.frame-pop.local:visible').length>0) {
    if( $('.content.title input').val() != curpost['title'] ) {
      $('.posttitle').text($('.content.title input').val());
    }
    //Auto saving
    curpost['title'] = $('.content.title input').val();
    curpost['date'] = $('.content.date input').val();
    curpost['info'] = $('.content.info input').val();
    curpost['comment']=$('.content.comment input').val();
    curpost['tags']=toArray($('.content.tag input').val());
    curpost['categories']=toArray($('.content.cate input').val());
    curpost['published']=$('.content.post input').prop('checked');
    curpost['slug']=$('.content.slug input').val();
  }

  curpost['content'] = $('#meltdowneditor').val();

	//-> fill meta
  chrome.storage.local.set({'workingpost': curpost}, function(){
    console.log('store');
		syncLocalPost();
		if(typeof(cb)!='undefined') cb();
  });
}

function logInfo(str){
	console.info(str);
	$('.notification').removeClass('info').removeClass('error');
	$('.notification').text(str).addClass('info');
	$('.notification').show();
	setTimeout (function(){
		$('.notification').text('').hide();
	}, 2000);
}

function logError(str){
	console.error(str);
	$('.notification').removeClass('info').removeClass('error');
	$('.notification').text(str).addClass('error');
	$('.notification').show();
	setTimeout (function(){
		$('.notification').text('').hide();
	}, 2000);
}

function switchSkin(){
    console.log(skin);
    if(skin=='dark')
        skin = 'light';
    else
        skin = 'dark';
    chrome.storage.local.set({skin:skin},function(){
        $('#stylehdl').remove();
        $('head').append('<link id="stylehdl" rel="stylesheet"type="text/css"href="styles-'+skin+'.css"/>');
    });

}

function tokenPop(toggle){
  $('#token').addClass('focus');
  //- Toggle
  var frame = $('<div class="frame-pop remote"></div>');
  var mask = $('<div class="frame-mask"> </div>');
  $('body').append(frame);
  $('body').append(mask);

  $('.frame-pop').html('<div class=ajax-loader><img src="/assets/loader.gif"/></div>');
  $('.frame-pop .ajax-loader').hide();


  //refresh pop
  //-> Get needed info
  chrome.storage.local.get("ltoken",function(obj){
    if(typeof(obj.ltoken)!='undefined') {
      ltoken= obj.ltoken;
	  refreshTokenInfo();
    } else {
	  refreshTokenInfo();
	}
  });

  $('.frame-mask').show();
  $('.frame-pop').show();
}

function refreshTokenInfo(){
  $('.frame-pop').append('<div id="token-input" class="config-input">\
  										<div class="config-title">Token Set \
										<textarea spellcheck="false" class="config-content"></textarea> \
										<span title="Save Token" class="icon icon-checkmark"></span>\
										 <span title="Clear Token" class="disabled icon icon-cross"></span>\
										</div></div>');

  $('.frame-pop').append('<div class="popping-note">\
To start with this tool, you need to create (if not yet) the Github Token in your account, and copy /paste it here. \
<br>\
<br>\
And if more details neeed, please refer to Github relevant page for support. \
</div>');
}
//Control Main windows' action
/* Icon Click Action */

// Create
$('.img#create').confirmOn({
	questionText: 'Local Post Will Be Emptied , Is It OK?',
	textYes: 'Yes, I\'m sure',
	textNo: 'No, Thanks'
}, 'click', function (e, confirmed) {
	if (confirmed)
		createNewPost();
})

// Meta
$('.img#meta').click(function () {
	$('.focus').removeClass('focus');
	metaPop(true);
});

// List
$('.img#list').click(function () {
	$('.focus').removeClass('focus');
	listPop(true);
});

// Skin
$('.img#skin').click(function () {
	$('.focus').removeClass('focus');
	switchSkin();
});

// Token
$('.img#token').click(function () {
	$('.focus').removeClass('focus');
	tokenPop(true);
});


// Tip-Hint Relevant
$('.frame-icon.op').mouseenter(function () {
	$('.tooltiptext').text($(this).attr('val'));
	$('.tooltip').fadeIn(100);
});
$('.frame-icon.op').mouseleave(function () {
	$('.tooltiptext').text('-');
	$('.tooltip').fadeOut(100);
});


/* Overall action */
// Function to show -toggle the config frame
function popFrame(id, toggle = true, cb) {
  //- Toggle
  if (toggle && $('.frame-pop.' + id + ':visible').length > 0) {
     popClose();
    return 0;
  } 

  popClose();
  $('#' + id).addClass('focus');
  var frame = $('<div class="frame-pop ' + id + '"></div>');
  var mask = $('<div class="frame-mask"> </div>');
  $('body').append(frame);
  $('body').append(mask);
  cb();
  bindListAction(); //windowControl
  $('.frame-mask').show();
  $('.frame-pop').show();
}

/* 1. Close all popping */
/* 2. click mask then all pop close*/
function bindListAction() {
	$('.frame-mask').click(function () {
		popClose();
	});
}

// Store the blog by key hit
//$('.meltdown_editor-deco').keyup(function () {
$('body #meltdowneditor').keyup(function () {
	storePost();
})

// Reserve
$('#user_info').click(function () {
});

// Restore the post
function storePost(cb) {
	if ($('.frame-pop.meta:visible').length > 0) {
		if ($('.content.title input').val() != curpost['title']) {
			$('.posttitle').text($('.content.title input').val());
		}
		//Auto saving
		curpost['title'] = $('.content.title input').val();
		curpost['date'] = $('.content.date input').val();
		curpost['info'] = $('.content.info input').val();
		curpost['comment'] = $('.content.comment input').val();
		curpost['tags'] = toArray($('.content.tag input').val());
		curpost['categories'] = toArray($('.content.cate input').val());
		curpost['published'] = $('.content.post input').prop('checked');
		curpost['slug'] = $('.content.slug input').val();
	}

	curpost['content'] = $('#meltdowneditor').val();

	//-> fill meta
	chrome.storage.local.set({ 'workingpost': curpost }, function () {
		console.log('store');
		syncLocalPost();
		if (typeof (cb) != 'undefined') cb();
	});
}


/* Show Info-log */
function logInfo(str) {
	console.info(str);
	$('.notification').removeClass('info').removeClass('error');
	$('.notification').text(str).addClass('info');
	$('.notification').show();
	setTimeout(function () {
		$('.notification').text('').hide();
	}, 2000);
}

function logError(str) {
	console.error(str);
	$('.notification').removeClass('info').removeClass('error');
	$('.notification').text(str).addClass('error');
	$('.notification').show();
	setTimeout(function () {
		$('.notification').text('').hide();
	}, 2000);
}

/* Close All Popframe - as util*/
function popClose(){
    $('.frame-pop').remove();
    $('.frame-mask').remove();
    $('.frame-icon.focus').removeClass('focus');
}

/* Skin switch */
function switchSkin() {
	console.log(skin);
	if (skin == 'dark')
		skin = 'light';
	else
		skin = 'dark';
	chrome.storage.local.set({ skin: skin }, function () {
		$('#stylehdl').remove();
		$('head').append('<link id="stylehdl" rel="stylesheet"type="text/css"href="styles-' + skin + '.css"/>');
	});
}


/* Token Relevant - to be move to other file */

function tokenPop(toggle) {
    popFrame('token', toggle, function () {
        //-> Get needed info
        refreshTokenInfo();
    });
};
function refreshTokenInfo() {
    //refresh pop
    //-> Get needed info
    chrome.storage.local.get("ltoken", function (obj) {
        if (typeof (obj.ltoken) != 'undefined') {
            ltoken = obj.ltoken;
        } else {
        }
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
</div>'
        );
    });
}
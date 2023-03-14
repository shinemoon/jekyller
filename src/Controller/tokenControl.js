

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
            ltoken = '';
        }
        $('.frame-pop').append('<div id="token-input" class="config-input">\
  										<div class="config-title">'+gm('tokenSet')+'\
										<textarea spellcheck="false" class="config-content">'+ ltoken + '</textarea> \
										<span title="'+gm('saveToken')+'" class="save-token icon icon-checkmark"></span>\
										 <span title="'+gm('cleartoken')+'" class="remove-token icon icon-cross"></span>\
										</div></div>');

        var noteStr = gm('tokenHelp');

        $('.frame-pop').append('<div class="popping-note">' + noteStr + '</div>');
        function refreshIcon() {
            if (ltoken != "") {
                $(".remove-token").addClass('active');
            }
        };
        refreshIcon();

        $('.save-token').click(function () {
            if ($(this).hasClass('active')) {
                console.log("Token to Saved.")
                $(this).removeClass('active');
                ltoken = $('.config-content').val();
                chrome.storage.local.set({ 'ltoken': ltoken }, function () {
                    console.log("Token Saved.")
                    refreshIcon();
                    gh.access_token(ltoken);
                    gh.getUserInfo(false);
                });
            }
        });

        $('.remove-token').click(function () {
            if ($(this).hasClass('active')) {
                if (confirm("Remove Token?")) {
                    $(this).removeClass('active');
                    ltoken = "";
                    chrome.storage.local.set({ 'ltoken': ltoken }, function () {
                        console.log("Token Cleared.")
                        tokenPop(false);
                    });
                }
            }
        });

        $('.config-content').keyup(function () {
            if ($(this).val() != ltoken && $(this).val() != '') {
                $('.save-token').addClass('active');
            } else {
                $('.save-token').removeClass('active');
            }
        })
    });
}
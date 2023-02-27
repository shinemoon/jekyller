//-> Claud Modified for jekyller Need
var root = null;
/* Please replace with your own private Token */
var access_token="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"

var gh = null;

/*
chrome.storage.local.get({"access_token":null},function(o){
	access_token = o.access_token;
});
*/


chrome.runtime.getBackgroundPage(function(r) { 

root = r; 
gh = (function() {
  'use strict';
  var signin_button;
  var revoke_button;
  var user_info_div;

  function xhrWithDataAuth(method, url, data, callback) {
    var retry = true;
    requestStart();

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send(data);
    }

    function requestComplete() {
      //console.log('requestComplete', this.status, this.response);
      if ( ( this.status < 200 || this.status >=300 ) && retry) {
        retry = false;
      } else {
        callback(null, this.status, this.response);
      }
    }
  }


  function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    requestStart();

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      //console.log('requestComplete', this.status, this.response);
      if ( ( this.status < 200 || this.status >=300 ) && retry) {
        retry = false;
      } else {
        callback(null, this.status, this.response);
      }
    }
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET',
                'https://api.github.com/user',
                interactive,
                onUserInfoFetched);
  }

  // Functions updating the User Interface:

  function showButton(button) {
    button.style.display = 'inline';
    button.disabled = false;
  }

  function hideButton(button) {
    button.style.display = 'none';
  }

  function disableButton(button) {
    button.disabled = true;
  }

  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      //console.log("Got the following user info: " + response);
      root.user_info = JSON.parse(response);
      populateUserInfo(root.user_info);
      hideButton(signin_button);
      showButton(revoke_button);
      //fetchUserRepos(root.user_info["repos_url"]);
    } else {
      console.log('infoFetch failed', error, status);
      showButton(signin_button);
			$('.signin').click();
    }
  }

  function populateUserInfo(user_info) {
    var elem = user_info_div;
    var nameElem = document.createElement('div');
		//console.info(user_info);
    nameElem.innerHTML = "Blog of : <a href='http://" +user_info.login+".github.io' target=_blank>"+user_info.login+"</a>";
    elem.innerHTML= nameElem.innerHTML;
  }

  function fetchUserRepos(repoUrl) {
    xhrWithAuth('GET', repoUrl, false, onUserReposFetched);
  }

	// Jekyller - start
	//-> Get the Post Folder Tree
  function fetchPostList(user, cb) {
  	xhrWithAuth('GET',
			'https://api.github.com/repos/'+user+'/'+user+'.github.io/contents/_posts',
     	true,
	    cb);
	}

	// Jekyller - end




  function onUserReposFetched(error, status, response) {
  	//console.log(response);
  }

  // Handlers for the buttons's onclick events.

  function interactiveSignIn() {
    disableButton(signin_button);
  }

  function fetchContent(ulink,cb) {
    	xhrWithAuth("GET", "https://api.github.com/repos/"+root.user_info.login+"/"+root.user_info.login+".github.io/contents/"+ulink, true, function(e,s,r){
				cb(e,s,r);
			});
  }

  return {
		transparentXhr:	function(method,url,cb){
  		xhrWithAuth(method, url, true, function(e,s,r){
				cb(e,s,r);
			});
		},

		updateContent: function(ulink, content, sha, cb){
			var data = {
				message: 'update from Jekyller',
				sha: sha,
				content:window.btoa(unescape(encodeURIComponent(content)))
			};

			if(sha=='') {
				delete(data.sha);
			}
			var sdata = JSON.stringify(data);

			xhrWithDataAuth("PUT", "https://api.github.com/repos/"+root.user_info.login+"/"+root.user_info.login+".github.io/contents/"+ulink, sdata , function(e,s,r){
				cb(e,s,r);
			});
		},

		deleteContent: function(ulink,sha, cb){
			var data = {
				message: 'update from Jekyller',
				sha: sha
			};

			var sdata = JSON.stringify(data);

			xhrWithDataAuth("DELETE", "https://api.github.com/repos/"+root.user_info.login+"/"+root.user_info.login+".github.io/contents/"+ulink, sdata , function(e,s,r){
				cb(e,s,r);
			});
		},


		getContent: function(url,cb) {
		  fetchContent(url,function(e,s,r){
		    if(s==200){
		      var tmp = JSON.parse(r);
		      cb({
		        status:'OK',
		        sha:  tmp.sha,
		        content: decodeURIComponent(escape(window.atob(tmp.content))),
		        date: tmp.name.replace(/^(\d+-\d+-\d+)-.*/,'$1'),
		        url:  root.user_info.login+'.github.io/'+tmp.name.replace(/^\d+-\d+-\d+-/,'').replace(/.md$/,'')
		      });
		    }
		  });
		},

  	fetchPostList: function(user, cb) {
			return fetchPostList(user,cb);
		},

    getUserInfo: function(type) {
      return getUserInfo(type);
    },

    onload: function () {
      signin_button = document.querySelector('#signin');
      signin_button.onclick = interactiveSignIn;

      revoke_button = document.querySelector('#revoke');

      user_info_div = document.querySelector('#user_info');

      console.log(signin_button, revoke_button, user_info_div);

      showButton(signin_button);
      getUserInfo(false);
    }
  };
})();
window.onload = gh.onload;
});


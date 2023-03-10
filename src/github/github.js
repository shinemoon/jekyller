//-> Claud Modified for jekyller Need
/* Please replace with your own private Token */
var gh = null;


gh = (function () {
  'use strict';
  var revoke_button;
  var user_info_div;
  var access_token = null;

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
      if ((this.status < 200 || this.status >= 300) && retry) {
        retry = false;
      } else {
        callback(null, this.status, this.response);
      }
    }
  }


  function xhrWithAuth(method, url, interactive, callback, failedCallback) {
    var retry = true;
    requestStart();

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.setRequestHeader('Accept', 'application/vnd.github.text-match+json');
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      if ((this.status < 200 || this.status >= 300) && retry) {
        retry = false;
      } else {
        callback(null, this.status, this.response);
      }
      //console.log('requestComplete', this.status, this.response);
      if (this.status != 200) {
        failedCallback(null, this.status, this.response);
      }
    }
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET',
      'https://api.github.com/user',
      interactive,
      onUserInfoFetched, onLogInFailed);
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
        user_info = JSON.parse(response);
        populateUserInfo(user_info);
        showButton(revoke_button);
        logInfo("LogIn Successfully.");
      } else {
        // If failed
      }
    }
    function onLogInFailed(error, status, response) {
      logError("Token is not working or Network issue, please check configuration.");
      tokenPop(false);
    }

  function populateUserInfo(user_info) {
    var elem = user_info_div;
    var nameElem = document.createElement('div');
    //console.info(user_info);
    nameElem.innerHTML = "Blog of : <a href='http://" + user_info.login + ".github.io' target=_blank>" + user_info.login + "</a>";
    elem.innerHTML = nameElem.innerHTML;
  }

  function fetchUserRepos(repoUrl) {
    xhrWithAuth('GET', repoUrl, false, onUserReposFetched, onLogInFailed);
  }

  // Jekyller - start
  // => Oboseleted: as if it's>1000 post, this then can't support well.
  function fetchPostList(user, cb) {
    xhrWithAuth('GET',
      'https://api.github.com/repos/' + user + '/' + user + '.github.io/contents/_posts',
      true,
      cb, onLogInFailed);
  }

  //-> Get the Post Folder Tree
  function fetchPostListTree(user, cb) {
    xhrWithAuth('GET',
      'https://api.github.com/repos/' + user + '/' + user + '.github.io/git/trees/HEAD:_posts',
      true,
      cb, onLogInFailed);
  }

  // -> Search code
  function searchPost(user, qstr, cb) {
    var queryString = 'q=' + encodeURIComponent(qstr+' repo:'+user + '/' + user + '.github.io path:_posts extension:md');
    xhrWithAuth('GET',
      'https://api.github.com/search/code?' + queryString,
      true,
      cb, onLogInFailed);
  }

  // Jekyller - end




  function onUserReposFetched(error, status, response) {
    //console.log(response);
  }

  // Handlers for the buttons's onclick events.

  function interactiveSignIn() {
  }

  function fetchContent(ulink, cb) {
    xhrWithAuth("GET", "https://api.github.com/repos/" + user_info.login + "/" + user_info.login + ".github.io/contents/" + ulink, true, function (e, s, r) {
      cb(e, s, r);
    }, onLogInFailed);
  }

  async function getContentAsync(url) {
    return new Promise(function (resolve, reject) {
      fetchContent(url, function (e, s, r) {
        if (s == 200) {
          var tmp = JSON.parse(r);
          resolve({
            status: 'OK',
            sha: tmp.sha,
            content: decodeURIComponent(escape(window.atob(tmp.content))),
            date: tmp.name.replace(/^(\d+-\d+-\d+)-.*/, '$1'),
            url: user_info.login + '.github.io/' + tmp.name.replace(/^\d+-\d+-\d+-/, '').replace(/.md$/, '')
          });
        } else {
          reject(new Error('Failed to fetch content'));
        }
      });
    });
  }

  return {
    transparentXhr: function (method, url, cb) {
      xhrWithAuth(method, url, true, function (e, s, r) {
        cb(e, s, r);
      });
    },
    updateContent: function (ulink, content, sha, cb) {
      var data = {
        message: 'update from Jekyller',
        sha: sha,
        content: window.btoa(unescape(encodeURIComponent(content)))
      };
      if (sha == '') {
        delete (data.sha);
      }
      var sdata = JSON.stringify(data);
      xhrWithDataAuth("PUT", "https://api.github.com/repos/" + user_info.login + "/" + user_info.login + ".github.io/contents/" + ulink, sdata, function (e, s, r) {
        cb(e, s, r);
      });
    },

    deleteContent: function (ulink, sha, cb) {
      var data = {
        message: 'update from Jekyller',
        sha: sha
      };
      var sdata = JSON.stringify(data);
      xhrWithDataAuth("DELETE", "https://api.github.com/repos/" + user_info.login + "/" + user_info.login + ".github.io/contents/" + ulink, sdata, function (e, s, r) {
        cb(e, s, r);
      });
    },
    getContentAsync: function (url) {
      return getContentAsync(url);
    },
    fetchPostList: function (user, cb) {
      return fetchPostList(user, cb);
    },

    fetchPostListTree: function (user, cb) {
      return fetchPostListTree(user, cb);
    },
    searchPost: function (user,qstr, cb) {
      return searchPost(user,qstr, cb);
    },
    /* The one to gate the login*/
    getUserInfo: function (type) {
      return getUserInfo(type);
    },

    // Function for issue
    onLogInFailed: function () {
      return onLogInFailed();
    },

      // Got token
      access_token: function (token=null) {
        if(token!=null) 
          access_token = token;
        return access_token;
      },

    onload: function () {
      revoke_button = document.querySelector('#token');
      user_info_div = document.querySelector('#user_info');
      chrome.storage.local.get("ltoken", function (obj) {
        if (typeof (obj.ltoken) != 'undefined') {
          access_token = obj.ltoken;
        } else {
          access_token = '';
        }
      });

    }
  };
})();
window.onload = gh.onload;
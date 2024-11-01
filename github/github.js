/* Claud 修改以支持 Jekyller Claud Modified for Jekyller support */
/* 请使用您自己的私有令牌 Replace with your own private token */
var gh = null;

gh = (function () {
  'use strict';

  // 声明全局变量 Declare global variables
  var revoke_button, user_info_div;
  var access_token = null;

  // 用于发送带有数据的授权请求 Send an authenticated request with data
  function xhrWithDataAuth(method, url, data, callback) {
    let retry = true;
    startRequest();

    function startRequest() {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = completeRequest;
      xhr.send(data);
    }

    function completeRequest() {
      // 处理请求响应 Handle request response
      if ((this.status < 200 || this.status >= 300) && retry) {
        retry = false; // 重试一次 Retry once
      } else {
        callback(null, this.status, this.response);
      }
    }
  }

  // 无数据的授权请求发送函数 Authenticated request without data
  function xhrWithAuth(method, url, interactive, callback, failedCallback) {
    let retry = true;
    startRequest();

    function startRequest() {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.setRequestHeader('Accept', 'application/vnd.github.text-match+json');
      xhr.onload = completeRequest;
      xhr.send();
    }

    function completeRequest() {
      // 检查请求状态并调用相应回调函数 Check request status and invoke appropriate callback
      if ((this.status < 200 || this.status >= 300) && retry) {
        retry = false;
      } else {
        callback(null, this.status, this.response);
      }

      // 若请求失败，则调用失败回调 If request fails, call failed callback
      if (this.status != 200) {
        failedCallback(null, this.status, this.response);
      }
    }
  }

  // 获取用户信息 Fetch user info
  function getUserInfo(interactive) {
    xhrWithAuth('GET', 'https://api.github.com/user', interactive, onUserInfoFetched, onLogInFailed);
  }

  // 更新用户界面元素函数 Functions to update UI elements
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

  // 成功获取用户信息后调用 Called upon successful user info fetch
  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      user_info = JSON.parse(response);
      populateUserInfo(user_info);
      showButton(revoke_button);
      logInfo(gm("loginDone"));
    }
  }

  // 登录失败处理函数 Login failure handler
  function onLogInFailed(error, status, response) {
    logError('loginFail');
    tokenPop(false);
  }

  // 填充用户信息到界面 Populate user info into the UI
  function populateUserInfo(user_info) {
    var elem = user_info_div;
    var nameElem = document.createElement('div');
    nameElem.innerHTML = gm("blogname") + " <a href='http://" + user_info.login + ".github.io' target=_blank>" + user_info.login + "</a>";
    elem.innerHTML = nameElem.innerHTML;
  }

  // 获取用户的所有仓库 Fetch user repositories
  function fetchUserRepos(repoUrl) {
    xhrWithAuth('GET', repoUrl, false, onUserReposFetched, onLogInFailed);
  }

  // 获取博文列表 (不推荐) Fetch post list (Deprecated)
  function fetchPostList(user, cb) {
    xhrWithAuth('GET', 'https://api.github.com/repos/' + user + '/' + user + '.github.io/contents/_posts', true, cb, onLogInFailed);
  }

  // 获取博文目录树 Fetch post folder tree
  function fetchPostListTree(user, cb) {
    xhrWithAuth('GET', 'https://api.github.com/repos/' + user + '/' + user + '.github.io/git/trees/HEAD:_posts', true, cb, onLogInFailed);
  }

  // 搜索特定博文 Search for specific post
  function searchPost(user, qstr, cb) {
    var queryString = 'q=' + encodeURIComponent(qstr + ' repo:' + user + '/' + user + '.github.io path:_posts extension:md');
    xhrWithAuth('GET', 'https://api.github.com/search/code?' + queryString, true, cb, onLogInFailed);
  }

  // 用户仓库请求处理函数 User repository fetch handler
  function onUserReposFetched(error, status, response) {
    // 可在此处处理仓库信息 Handle repository info here
  }

  // 交互式登录函数 Interactive sign-in function (placeholder)
  function interactiveSignIn() {}

  // 获取内容的主要函数 Primary function to fetch content
  function fetchContent(ulink, cb) {
    xhrWithAuth("GET", "https://api.github.com/repos/" + user_info.login + "/" + user_info.login + ".github.io/contents/" + ulink, true, function (e, s, r) {
      cb(e, s, r);
    }, onLogInFailed);
  }

  // 使用 Promise 异步获取内容 Asynchronous content fetch with Promise
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

  // 公开的 API 方法 Public API methods
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
      xhrWithDataAuth("PUT", "https://api.github.com/repos/" + user_info.login + "/" + user_info.login + ".github.io/contents/" + ulink, JSON.stringify(data), cb);
    },

    deleteContent: function (ulink, sha, cb) {
      var data = {
        message: 'update from Jekyller',
        sha: sha
      };
      xhrWithDataAuth("DELETE", "https://api.github.com/repos/" + user_info.login + "/" + user_info.login + ".github.io/contents/" + ulink, JSON.stringify(data), cb);
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

    searchPost: function (user, qstr, cb) {
      return searchPost(user, qstr, cb);
    },

    getUserInfo: function (type) {
      return getUserInfo(type);
    },

    onLogInFailed: function () {
      return onLogInFailed();
    },

    access_token: function (token = null) {
      if (token != null) access_token = token;
      return access_token;
    },

    onload: function () {
      revoke_button = document.querySelector('#token');
      user_info_div = document.querySelector('#user_info');
      chrome.storage.local.get("ltoken", function (obj) {
        access_token = obj.ltoken || '';
      });
    }
  };
})();

// 加载时执行 onload Executes on window load
window.onload = gh.onload;
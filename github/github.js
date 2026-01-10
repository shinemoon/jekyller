
//-> Claud Modified for jekyller Need
/* Please replace with your own private Token */
var gh = null;


gh = (function () {
  'use strict';
  var revoke_button;
  var user_info_div;
  var access_token = null;
  var syncConfig = {
    mode: 'jekyll',
    generalRepo: '',
    generalFolder: ''
  };

  // 加载同步配置 Load Sync Config
  function loadSyncConfig() {
    chrome.storage.local.get('syncConfig', function (result) {
      if (result.syncConfig) {
        syncConfig = result.syncConfig;
      }
    });
  }

  // 初始化时加载配置
  loadSyncConfig();

  function xhrWithDataAuth(method, url, data, callback) {
    var retry = true;
    requestStart();

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      // 可能会抛出错误的代码
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
      if (this.status != 200 && failedCallback) {
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
      
      // 保存用户信息到 storage
      chrome.storage.local.set({ 'user_info': user_info });
      
      populateUserInfo(user_info);
      showButton(revoke_button);
      logInfo(gm("loginDone"));
    } else {
      // If failed
    }
  }
  function onLogInFailed(error, status, response) {
    logError('loginFail');
    tokenPop(false);
  }

  function populateUserInfo(user_info) {
    var elem = user_info_div;
    var nameElem = document.createElement('div');
    //console.info(user_info);
    nameElem.innerHTML = gm("blogname") + ": <a href='http://" + user_info.login + ".github.io' target=_blank>" + user_info.login + "</a>";
    elem.innerHTML = nameElem.innerHTML;
  }

  function fetchUserRepos(repoUrl) {
    xhrWithAuth('GET', repoUrl, false, onUserReposFetched, onLogInFailed);
  }

  // 规范化仓库路径，如果没有用户名前缀则自动添加
  function normalizeRepoPath(repoPath) {
    if (!repoPath) return '';
    // 如果已经包含 /，说明是完整路径
    if (repoPath.indexOf('/') !== -1) {
      return repoPath;
    }
    // 否则添加当前用户名
    return user_info.login + '/' + repoPath;
  }

  // Jekyller - start
  // => Oboseleted: as if it's>1000 post, this then can't support well.
  function fetchPostList(user, cb) {
    let repoPath = syncConfig.mode === 'jekyll' 
      ? user + '/' + user + '.github.io'
      : syncConfig.generalRepo;
    
    // 规范化仓库路径
    if (syncConfig.mode !== 'jekyll') {
      repoPath = normalizeRepoPath(repoPath);
    }
    
    const folderPath = syncConfig.mode === 'jekyll' ? '_posts' : syncConfig.generalFolder;
    
    const url = folderPath 
      ? 'https://api.github.com/repos/' + repoPath + '/contents/' + folderPath
      : 'https://api.github.com/repos/' + repoPath + '/contents';
    
    xhrWithAuth('GET', url, true, cb, onLogInFailed);
  }

  //-> Get the Post Folder Tree
  function fetchPostListTree(user, cb) {
    let repoPath = syncConfig.mode === 'jekyll' 
      ? user + '/' + user + '.github.io'
      : syncConfig.generalRepo;
    
    // 规范化仓库路径
    if (syncConfig.mode !== 'jekyll') {
      repoPath = normalizeRepoPath(repoPath);
    }
    
    const folderPath = syncConfig.mode === 'jekyll' ? '_posts' : syncConfig.generalFolder;
    
    const url = folderPath
      ? 'https://api.github.com/repos/' + repoPath + '/git/trees/HEAD:' + folderPath
      : 'https://api.github.com/repos/' + repoPath + '/git/trees/HEAD';
    
    xhrWithAuth('GET', url, true, cb, onLogInFailed);
  }

  // -> Search code
  function searchPost(user, qstr, cb) {
    let repoPath = syncConfig.mode === 'jekyll' 
      ? user + '/' + user + '.github.io'
      : syncConfig.generalRepo;
    
    // 规范化仓库路径
    if (syncConfig.mode !== 'jekyll') {
      repoPath = normalizeRepoPath(repoPath);
    }
    
    const folderPath = syncConfig.mode === 'jekyll' ? '_posts' : syncConfig.generalFolder;
    
    const pathQuery = folderPath ? ' path:' + folderPath : '';
    var queryString = 'q=' + encodeURIComponent(qstr + ' repo:' + repoPath + pathQuery + ' extension:md');
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
    let repoPath = syncConfig.mode === 'jekyll' 
      ? user_info.login + '/' + user_info.login + '.github.io'
      : syncConfig.generalRepo;
    
    // 规范化仓库路径
    if (syncConfig.mode !== 'jekyll') {
      repoPath = normalizeRepoPath(repoPath);
    }
    
    xhrWithAuth("GET", "https://api.github.com/repos/" + repoPath + "/contents/" + ulink, true, function (e, s, r) {
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
      }, function (e, s, r) {
        cb(e, s, r);
      });
    },
    updateContent: function (ulink, content, sha, cb) {
      let repoPath = syncConfig.mode === 'jekyll' 
        ? user_info.login + '/' + user_info.login + '.github.io'
        : syncConfig.generalRepo;
      
      // 规范化仓库路径
      if (syncConfig.mode !== 'jekyll') {
        repoPath = normalizeRepoPath(repoPath);
      }
      
      var data = {
        message: 'update from Jekyller',
        sha: sha,
        content: window.btoa(unescape(encodeURIComponent(content)))
      };
      if (sha == '') {
        delete (data.sha);
      }
      var sdata = JSON.stringify(data);
      xhrWithDataAuth("PUT", "https://api.github.com/repos/" + repoPath + "/contents/" + ulink, sdata, function (e, s, r) {
        cb(e, s, r);
      });
    },

    deleteContent: function (ulink, sha, cb) {
      let repoPath = syncConfig.mode === 'jekyll' 
        ? user_info.login + '/' + user_info.login + '.github.io'
        : syncConfig.generalRepo;
      
      // 规范化仓库路径
      if (syncConfig.mode !== 'jekyll') {
        repoPath = normalizeRepoPath(repoPath);
      }
      
      var data = {
        message: 'update from Jekyller',
        sha: sha
      };
      var sdata = JSON.stringify(data);
      xhrWithDataAuth("DELETE", "https://api.github.com/repos/" + repoPath + "/contents/" + ulink, sdata, function (e, s, r) {
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
    searchPost: function (user, qstr, cb) {
      return searchPost(user, qstr, cb);
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
    access_token: function (token = null) {
      if (token != null)
        access_token = token;
      return access_token;
    },

    // 更新同步配置 Update Sync Config
    updateSyncConfig: function (config) {
      syncConfig = config;
      loadSyncConfig(); // 重新加载配置
    },

    // 获取同步配置 Get Sync Config
    getSyncConfig: function () {
      return syncConfig;
    },

    onload: function () {
      revoke_button = document.querySelector('#token');
      user_info_div = document.querySelector('#user_info');
      chrome.storage.local.get(["ltoken", "syncConfig"], function (obj) {
        if (typeof (obj.ltoken) != 'undefined') {
          access_token = obj.ltoken;
        } else {
          access_token = '';
        }
        
        // 加载同步配置
        if (obj.syncConfig) {
          syncConfig = obj.syncConfig;
        }
      });

    }
  };
})();
window.onload = gh.onload;
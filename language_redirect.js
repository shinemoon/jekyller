// Language redirect script for update pages
// This script must run before any other scripts to redirect to the appropriate language version
(function(){
  // runtime language redirect: if user prefers zh, go to update_zh.html, else update_en.html
  try {
    var path = window.location.pathname || '';
    var file = path.split('/').pop();
    // if already on a language-specific page, do nothing
    if (file === 'update_en.html' || file === 'update_zh.html') return;

    var lang = null;
    if (window.selected_ui_lang) {
      lang = window.selected_ui_lang;
    } else if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
      lang = chrome.i18n.getUILanguage();
    } else if (navigator && navigator.language) {
      lang = navigator.language;
    }
    lang = (lang || 'en').toLowerCase();

    var target = (lang.indexOf('zh') === 0) ? 'update_zh.html' : 'update_en.html';
    var q = window.location.search || '';
    var h = window.location.hash || '';

    // only redirect from the generic update.html (or empty file) to avoid loops
    if (!file || file === 'update.html') {
      window.location.replace(target + q + h);
    }
  } catch (e) {
    console.warn('language redirect failed', e);
  }
})();

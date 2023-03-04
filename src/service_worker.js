/**
 * Listens for the app launching, then creates the window.
 * Basically just open the window by clicking
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */

var user_info;	//git user info
var gh;					//git handler

var handleClick = function(){
    chrome.tabs.create({
        url:'index.html'
    });
};

chrome.action.onClicked.addListener(handleClick);

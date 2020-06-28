/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */

var user_info;	//git user info
var gh;					//git handler


var handleClick = function(){
    console.log("Button Clicked, Open the Editor");   
    chrome.tabs.create({
        url:'index.html'
    });
};


chrome.browserAction.onClicked.addListener(handleClick);


# Jekyller
## Intro

Jekyl Tool supported in Chrome Based Browser  ([MS Store address][2] / [Google webstore address][1]). Hope to :

1. Support Markdown Editor focusing on Jekyl (hosted in Github.io);
2. Support list posts, edit post, publish post, delete post, etc.;
3. Support 'cloud' feature with sync API .

And, some key reuse inputs:

* Markdown Editor : 
	* fork from https://github.com/iphands/Meltdown, thanks,


*  Github simple check/update/create/delete for recent posts:  
	*  mainly got from chrome-app-samples for oauth2 part


Several highlight points:
- For security concern, removed the key.pem file from folder, so, if anyone fork and want to do own development for chrome app, you need to generate the pem file by yourself and use it for publishing (without it, you can't get fixed key for the Github API access);
- Some critical changed on Meltdown code to support cross domain picture display;


[1]: https://chrome.google.com/webstore/detail/jekyller/lgdhgkhhglmhiacjecigalebiffjklec
[2]: https://microsoftedge.microsoft.com/addons/detail/jekyller-blog-editor/blogcklanlfjglneidejdabdljnoohlc?hl=zh-CN


## History
+ 3.1:	
  * update the markdown parser from Meltdown-default (js-markdown-extra.js) to [marked](https://marked.js.org/);
  * rendor refinement

+ 3.0:		Major Update:
  *	Authorization approach updated from Oauth2 to Github Token;
  * UI refinement;
  * Extend the post list from recent 6 to all posts by pagination;
  * Update the fetch logic from sync to async which can ensure the right order of the blog list;
  * Add search function (but not so good for non-Latin as github search API can only recoganize 'full word' ,so in other language e.g. Chinese, Japanese, please well use 'tag' to sort your blog, which can ensure and help searching greatly)
  * Multiple language support added by i18n , now English/Chinese supported.


+ 1.03:		Adjust the permission , remove unlimitedstorage, assuming we will not take >5MB content
+ 1.02:		Optimize Some Style
+ 1.01:		To support automatic judge for Edge/Chrome/Firefox, and light/dark theme switch
+ 1.0:		Baseline for Edge Support

> Old info not mentioned. Start from v1.0 Baseline

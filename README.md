# Jekyller
## Intro

Jekyl Tool supported in Chromium Based Browser (MS Edge/Google Chrome/etc.), [with google webstore address][1]/[with MS Store address][2]. Hope to :

1. Support Markdown Editor focusing on Jekyl (hosted in Github.io);
2. Support list recent posts, edit recent post, publish post, delete post, etc.;
3. Support 'cloud' feature with sync API .

And, some key reuse inputs:

* Markdown Editor : 
	* fork from https://github.com/iphands/Meltdown, thanks,


*  Github simple check/update/create/delete for recent posts:  
	*  mainly got from https://github.com/GoogleChrome/chrome-app-samples for oauth2 part


Several highlight points:
- For security concern, removed the key.pem file from folder, so, if anyone fork and want to do own development for chrome app, you need to generate the pem file by yourself and use it for publishing (without it, you can't get fixed key for the Github API access);
- Some critical changed on Meltdown code to support cross domain picture display;

And also , from June 2020, new update will mainly start from Edge Browser Store, and for Chrome Webstore, I will try to push major update only.

[1]: https://chrome.google.com/webstore/detail/jekyller/lgdhgkhhglmhiacjecigalebiffjklec
[2]: https://microsoftedge.microsoft.com/addons/detail/jekyller-blog-editor/blogcklanlfjglneidejdabdljnoohlc?hl=zh-CN


## History


+ 1.03:		Adjust the permission , remove unlimitedstorage, assuming we will not take >5MB content
+ 1.02:		Optimize Some Style
+ 1.01:		To support automatic judge for Edge/Chrome/Firefox, and light/dark theme switch
+ 1.0:		Baseline for Edge Support

> Old info not mentioned. Start from v1.0 Baseline

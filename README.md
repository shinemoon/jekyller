# Jekyller

Chrome Jekyl Tool, [with webstore address][1]. Hope to :

1. Support Markdown Editor focusing on Jekyl (hosted in Github.io);
2. Support list recent posts, edit recent post, publish post, delete post, etc.;
3. Support 'cloud' feature with Google sync API .

And, some key reuse inputs:

* Markdown Editor : 
	* fork from https://github.com/iphands/Meltdown, thanks,


*  Github simple check/update/create/delete for recent posts:  
	*  mainly got from https://github.com/GoogleChrome/chrome-app-samples for oauth2 part


Several highlight points:
- For security concern, removed the key.pem file from folder, so, if anyone fork and want to do own development for chrome app, you need to generate the pem file by yourself and use it for publishing (without it, you can't get fixed key for the Github API access);
- Some critical changed on Meltdown code to support cross domain picture display;


[1]: https://chrome.google.com/webstore/detail/jekyller/lgdhgkhhglmhiacjecigalebiffjklec
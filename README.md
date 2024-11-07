Github Jekyll Editor is extension for Chrome Based Browsers  ([MS Store address][4] / [Google webstore address][1]). Hope to :

2. Support Markdown Editor focusing on Jekyl (hosted in Github.io);
3. Support list posts, edit post, publish post, delete post, etc.;

But due to my personal willing, I hope to seek some new alternative tool which can be much better than my shallow extension, which ideally can support below expectations:

2. Portable & Cross platforms, as I normally switch cross different platforms and devices, especially some of those are restricted to install softwares;
3. As big fan of Vim, Vim-mode in editor is a MUST;
4. Distraction-free mode is perfered;

After scanning all visible candiates, especially several very strong self-hosted solutions (which is most possible approach can easily meet requirement 2), it's sadlly for me to realize that there is not so perfect solution, let alone the self-host solution anyway relying on one dedicated VPS & those effort/trouble shooting in those setup and also customization.

Then, I eventually made up of my mind to reconstruct my **old** tool to be more **mordern style**.

And after some days' effort, there are 3 major updates:
- Update the editor soluiton from previews *Meltdown* to [ace](https://ace.c10.io/) which is so strong web-based editor, and can fulfill all my expectation;
- Add 'Focus Mode' on top of orginal 'Preview Mode';
- Reconstruct the UI and (that might only meaningful for myself and possible developers) the mechanism for theme/UI;

*NOTE on Vim ExCmd*:
- q:  quit
- w: manual save (not really meaningful just for fun.. since the 'save' action is automatically done for any keyup)
- l: layout switch between preview & focus mode
- s: dark/light skin switch

[2]: https://chrome.google.com/webstore/detail/jekyller/lgdhgkhhglmhiacjecigalebiffjklec
[3]: https://microsoftedge.microsoft.com/addons/detail/jekyller-blog-editor/blogcklanlfjglneidejdabdljnoohlc?hl=zh-CN


## History
+ 4.0:	
  * Critical Reconstruction with above statement

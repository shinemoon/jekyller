// Extracted Vim ex-command registrations for clarity and maintenance
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.vimCmd = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function createModule() {
        const cmdList = [];

            // UI helpers for showing help in a mask/banner overlay
            function showHelpLines(lines) {
                hideHelp();
                var mask = document.createElement('div');
                mask.id = 'vim-help-mask';
                mask.className = 'vim-help-mask';

                var banner = document.createElement('div');
                banner.id = 'vim-help-banner';
                banner.className = 'vim-help-banner';

                var title = document.createElement('div');
                title.id = 'vim-help-title';
                title.textContent = 'Supported ex commands';

                var list = document.createElement('pre');
                list.id = 'vim-help-list';
                list.textContent = lines.join('\n');

                banner.appendChild(title);
                banner.appendChild(list);

                mask.appendChild(banner);

                // clicking mask (outside banner) hides
                mask.addEventListener('click', function (e) {
                    if (e.target === mask) hideHelp();
                });

                // Esc to close
                function onKey(e) { if (e.key === 'Escape') hideHelp(); }
                document.addEventListener('keydown', onKey);

                function hideHelp() {
                    var m = document.getElementById('vim-help-mask');
                    if (m) { document.body.removeChild(m); document.removeEventListener('keydown', onKey); }
                }

                // expose hide for internal use
                window.__vimHelpHide = hideHelp;

                document.body.appendChild(mask);
            }

            function hideHelp() {
                if (window.__vimHelpHide) { try { window.__vimHelpHide(); } catch (e) {} }
            }

            function addEx(name, shortName, desc, handler) {
                if (VimApiAvailable && VimApiAvailable.defineEx) {
                    VimApiAvailable.defineEx(name, shortName, handler);
                }
                cmdList.push({ name: name, short: shortName, desc: desc });
            }

        // We'll capture the VimApi when register is called
        var VimApiAvailable = null;

        function register(VimApi) {
            VimApiAvailable = VimApi;

            addEx("write", "w", "save", function (cm, input) {
                syncLocalPost();
                logInfo(gm("vimsave"));
            });

            addEx("quit", "q", "quit", function (cm, input) {
                window.close();
            });

            addEx("layout", "l", "switch layout", function (cm, input) {
                switchLayout();
            });

            addEx("switch", "s", "toggle skin", function (cm, input) {
                switchSkin();
            });

            addEx("new", "n", "create new post", function (cm, input) {
                if (user_info) {
                    $('.img#create').click();
                }
            });

            addEx("published", "pu", "Update & published", function (cm, input) {
                if (user_info) {
                    curpost.published = true;
                    $('.content.post input').prop('checked', curpost.published);
                    storePost(() => {
                        updatePost(() => logInfo(gm("postUpdated")));
                    });
                }
            });

            addEx("unpublished", "un", "Update & unpublished", function (cm, input) {
                if (user_info) {
                    curpost.published = false;
                    $('.content.post input').prop('checked', curpost.published);
                    storePost(() => {
                        updatePost(() => logInfo(gm("postUpdated")));
                    });
                }
            });

            // Help: list supported ex commands
            addEx("help", "h", "show supported ex commands", function (cm, input) {
                const lines = cmdList.map(function (c) { return ':' + c.name + ' (' + c.short + ') ' + c.desc; });
                if (typeof document !== 'undefined' && document.body) {
                    showHelpLines(lines);
                } else if (typeof alert !== 'undefined') {
                    alert("Supported ex commands:\n" + lines.join('\n'));
                }
                if (typeof console !== 'undefined') console.log(lines.join('\n'));
            });
        }

        return {
            register: register
        };
    }

    return createModule();
}));

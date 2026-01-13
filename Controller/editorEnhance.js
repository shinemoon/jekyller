/**
 * editorEnhance.js
 * 编辑器增强功能模块
 * Editor Enhancement Features Module
 */

(function() {
    'use strict';

    // ==========================
    // 成对符号自动配对功能
    // Auto-Pairing for Bracket Symbols
    // ==========================

    /**
     * 成对符号映射表
     * Mapping of opening and closing bracket pairs
     */
    const BRACKET_PAIRS = {
        '(': ')',
        '[': ']',
        '{': '}',
        "'": "'",
        '"': '"',
        '`': '`',
        '\u2018': '\u2019',  // ' '
        '\u201C': '\u201D',  // " "
        '【': '】',
        '（': '）',
        '《': '》',
        '「': '」',
        '『': '』'
    };

    /**
     * 清除编辑器的配对模式状态
     * Clear pairing mode state from editor
     * @param {Object} editor - Ace Editor 实例
     */
    function clearPairingState(editor) {
        editor._inPairingMode = false;
        editor._pairingEndPos = null;
        editor._lastPairingChar = null;
        editor._lastPairingTime = 0;  // 设为0而不是null，表示已清除
    }

    /**
     * 设置自定义括号匹配高亮
     * Setup custom bracket matching highlight
     * @param {Object} editor - Ace Editor 实例
     */
    function setupCustomBracketMatching(editor) {
        // 查找匹配的右括号
        function findClosingBracket(session, openChar, closeChar, startPos) {
            const doc = session.getDocument();
            const lines = doc.getAllLines();
            let depth = 1;
            
            for (let row = startPos.row; row < lines.length; row++) {
                const line = lines[row];
                const startCol = (row === startPos.row) ? startPos.column + 1 : 0;
                
                for (let col = startCol; col < line.length; col++) {
                    const char = line[col];
                    if (char === openChar) {
                        depth++;
                    } else if (char === closeChar) {
                        depth--;
                        if (depth === 0) {
                            return {row: row, column: col};
                        }
                    }
                }
            }
            return null;
        }
        
        // 查找匹配的左括号
        function findOpeningBracket(session, openChar, closeChar, startPos) {
            const doc = session.getDocument();
            const lines = doc.getAllLines();
            let depth = 1;
            
            for (let row = startPos.row; row >= 0; row--) {
                const line = lines[row];
                const startCol = (row === startPos.row) ? startPos.column - 1 : line.length - 1;
                
                for (let col = startCol; col >= 0; col--) {
                    const char = line[col];
                    if (char === closeChar) {
                        depth++;
                    } else if (char === openChar) {
                        depth--;
                        if (depth === 0) {
                            return {row: row, column: col};
                        }
                    }
                }
            }
            return null;
        }
        
        // 处理相同的开闭符号（如引号）
        function findMatchingQuote(session, quoteChar, cursorPos) {
            const doc = session.getDocument();
            const lines = doc.getAllLines();
            const line = lines[cursorPos.row];
            
            // 检查光标前后的字符
            const charBefore = cursorPos.column > 0 ? line.charAt(cursorPos.column - 1) : '';
            const charAfter = line.charAt(cursorPos.column);
            
            let targetPos = null;
            let isOpenQuote = false;
            
            // 确定当前引号位置
            if (charBefore === quoteChar) {
                targetPos = {row: cursorPos.row, column: cursorPos.column - 1};
            } else if (charAfter === quoteChar) {
                targetPos = {row: cursorPos.row, column: cursorPos.column};
            } else {
                return null;
            }
            
            // 统计当前引号之前的同类引号数量（只统计当前行）
            let countBefore = 0;
            for (let i = 0; i < targetPos.column; i++) {
                if (line.charAt(i) === quoteChar) {
                    countBefore++;
                }
            }
            
            // 如果是奇数个，说明这是开始引号，向后找结束引号
            // 如果是偶数个，说明这是结束引号，向前找开始引号
            isOpenQuote = (countBefore % 2 === 0);
            
            if (isOpenQuote) {
                // 向后找匹配的结束引号
                for (let col = targetPos.column + 1; col < line.length; col++) {
                    if (line.charAt(col) === quoteChar) {
                        return {
                            openPos: targetPos,
                            closePos: {row: cursorPos.row, column: col}
                        };
                    }
                }
            } else {
                // 向前找匹配的开始引号
                for (let col = targetPos.column - 1; col >= 0; col--) {
                    if (line.charAt(col) === quoteChar) {
                        return {
                            openPos: {row: cursorPos.row, column: col},
                            closePos: targetPos
                        };
                    }
                }
            }
            
            return null;
        }
        
        // 保存原始的 getMatchingBracketRanges 方法
        const originalGetMatching = editor.session.getMatchingBracketRanges;
        
        // 相同开闭符号的集合
        const SAME_CHAR_PAIRS = ["'", '"', '`', '\u2018', '\u201C'];
        
        // 重写括号匹配方法以支持所有符号
        editor.session.getMatchingBracketRanges = function(pos, isBackwards) {
            // 先尝试原始方法（支持 (){}[]）
            const result = originalGetMatching.call(this, pos, isBackwards);
            if (result) {
                return result;
            }
            
            // 如果原始方法没有匹配，检查我们的自定义符号
            const line = this.getLine(pos.row);
            const charBefore = pos.column > 0 ? line.charAt(pos.column - 1) : '';
            const charAfter = line.charAt(pos.column);
            
            // 先检查是否是相同开闭符号（引号类）
            if (SAME_CHAR_PAIRS.includes(charBefore) || SAME_CHAR_PAIRS.includes(charAfter)) {
                const quoteChar = SAME_CHAR_PAIRS.includes(charBefore) ? charBefore : charAfter;
                const match = findMatchingQuote(this, quoteChar, pos);
                if (match) {
                    return [
                        {start: match.openPos, end: {row: match.openPos.row, column: match.openPos.column + 1}},
                        {start: match.closePos, end: {row: match.closePos.row, column: match.closePos.column + 1}}
                    ];
                }
            }
            
            // 检查光标前的字符是否是配对符号（非相同开闭符号）
            if (BRACKET_PAIRS[charBefore] && BRACKET_PAIRS[charBefore] !== charBefore) {
                const closeChar = BRACKET_PAIRS[charBefore];
                const closePos = findClosingBracket(this, charBefore, closeChar, pos);
                if (closePos) {
                    return [
                        {start: {row: pos.row, column: pos.column - 1}, end: {row: pos.row, column: pos.column}},
                        {start: closePos, end: {row: closePos.row, column: closePos.column + 1}}
                    ];
                }
            }
            
            // 检查光标后的字符是否是配对符号的右侧
            for (const [openChar, closeChar] of Object.entries(BRACKET_PAIRS)) {
                if (charAfter === closeChar && openChar !== closeChar) {
                    const openPos = findOpeningBracket(this, openChar, closeChar, pos);
                    if (openPos) {
                        return [
                            {start: openPos, end: {row: openPos.row, column: openPos.column + 1}},
                            {start: {row: pos.row, column: pos.column}, end: {row: pos.row, column: pos.column + 1}}
                        ];
                    }
                }
            }
            
            return null;
        };
    }

    /**
     * 初始化自动配对功能
     * Initialize auto-pairing feature
     * @param {Object} editor - Ace Editor 实例
     */
    function initAutoPairing(editor) {
        if (!editor) {
            console.error('Editor instance is required for auto-pairing');
            return;
        }

        // 为每个成对符号添加键绑定
        Object.keys(BRACKET_PAIRS).forEach(function(openChar) {
            const closeChar = BRACKET_PAIRS[openChar];
            
            // 尝试为每个符号添加命令
            try {
                editor.commands.addCommand({
                    name: 'autoPair_' + openChar.charCodeAt(0),
                    bindKey: openChar,
                    exec: function(editor) {
                        handleAutoPairing(editor, openChar);
                    },
                    readOnly: false
                });
            } catch (e) {
                // 如果键绑定失败（某些中文字符），使用文本输入监听
                console.log('无法为字符 "' + openChar + '" 绑定键，将使用文本监听');
            }
        });

        // 使用文本输入事件作为备用方案，捕获所有输入
        editor.on('change', function(delta) {
            if (delta.action === 'insert' && delta.lines.length === 1) {
                const insertedText = delta.lines[0];
                
                // 检查插入的文本是否是成对符号的左侧
                if (BRACKET_PAIRS.hasOwnProperty(insertedText) && insertedText.length === 1) {
                    // ✅ 立即清除旧的配对状态，防止干扰
                    const oldPairingMode = editor._inPairingMode;
                    if (oldPairingMode) {
                        clearPairingState(editor);
                    }
                    
                    // 使用 setTimeout 确保文本已插入并且其他事件处理完毕
                    setTimeout(function() {
                        handleAutoPairingFromInput(editor, insertedText, delta);
                    }, 0);
                }
            }
        });

        // 智能回车处理：在配对模式时跳出，否则正常换行
        editor.commands.addCommand({
            name: 'smartEnter',
            bindKey: { win: 'Return', mac: 'Return' },
            exec: function(editor) {
                // 只在配对模式时拦截回车
                if (editor._inPairingMode && editor._pairingEndPos) {
                    const endPos = editor._pairingEndPos;
                    editor.clearSelection();
                    editor.moveCursorTo(endPos.row, endPos.column);
                    
                    // 彻底清除配对模式的所有状态
                    clearPairingState(editor);
                    
                    return true;
                }
                // 不在配对模式，执行正常换行
                return false;
            },
            readOnly: false
        });

        // 使用 Tab 键也可以跳出配对模式（备选方案）
        editor.commands.addCommand({
            name: 'exitPairingTab',
            bindKey: { win: 'Tab', mac: 'Tab' },
            exec: function(editor) {
                if (editor._inPairingMode && editor._pairingEndPos) {
                    const endPos = editor._pairingEndPos;
                    editor.clearSelection();
                    editor.moveCursorTo(endPos.row, endPos.column);
                    
                    // 彻底清除配对模式的所有状态
                    clearPairingState(editor);
                    
                    return true;
                }
                // 如果不在配对模式，让 Tab 正常工作
                return false;
            },
            readOnly: false
        });
    }
    /**
     * 从文本输入事件处理自动配对
     * Handle auto-pairing from text input event
     * @param {Object} editor - Ace Editor 实例
     * @param {string} openChar - 输入的开始符号
     * @param {Object} delta - 变化对象
     */
    function handleAutoPairingFromInput(editor, openChar, delta) {
        const closeChar = BRACKET_PAIRS[openChar];
        if (!closeChar) return;

        const currentTime = Date.now();
        
        // 改进的防重复检查：
        // 1. 如果上次时间是0，说明刚清除过状态，这是新输入
        // 2. 如果距离上次处理超过100ms，这是新输入
        // 3. 如果字符不同，这是新输入
        const isNewInput = editor._lastPairingTime === 0 || 
                          !editor._lastPairingTime ||
                          (currentTime - editor._lastPairingTime) >= 100 ||
                          editor._lastPairingChar !== openChar;
        
        if (!isNewInput) {
            // 这是重复触发，忽略
            return;
        }

        // 获取当前光标位置（应该在刚插入的左符号之后）
        const cursor = editor.getCursorPosition();
        const line = editor.session.getLine(cursor.row);
        
        // 检查刚插入的字符后面是否已经有配对符号
        const charAfter = line.charAt(cursor.column);
        if (charAfter === closeChar) {
            // 已经有配对符号了，不需要再添加
            return;
        }

        // 开始新配对前，先彻底清除旧的配对模式状态
        clearPairingState(editor);

        // 【关键改动】模仿 handleAutoPairing 的方式：
        // 删除刚才插入的左符号，然后一次性插入整个配对
        const leftCharPos = {
            row: cursor.row,
            column: cursor.column - openChar.length
        };
        
        // 删除左符号
        editor.session.remove({
            start: leftCharPos,
            end: cursor
        });
        
        // 一次性插入整个配对符号
        const pair = openChar + closeChar;
        editor.session.insert(leftCharPos, pair);
        
        // 将光标移到成对符号之间
        editor.moveCursorTo(leftCharPos.row, leftCharPos.column + openChar.length);
        
        // 标记正在设置配对状态，防止 changeCursor 事件干扰
        editor._settingPairing = true;
        
        // 设置选择范围（零宽度），让光标显示"选中效果"
        const cursorPos = editor.getCursorPosition();
        editor.selection.setRange({
            start: cursorPos,
            end: cursorPos
        });
        
        // 标记当前处于配对模式
        editor._inPairingMode = true;
        editor._pairingEndPos = {
            row: cursorPos.row,
            column: cursorPos.column + closeChar.length
        };
        
        // 清除设置标记
        editor._settingPairing = false;
        
        // 记录最后处理的字符和时间
        editor._lastPairingChar = openChar;
        editor._lastPairingTime = currentTime;
    }

    /**
     * 处理成对符号的自动配对
     * Handle auto-pairing of bracket symbols
     * @param {Object} editor - Ace Editor 实例
     * @param {string} openChar - 输入的开始符号
     */
    function handleAutoPairing(editor, openChar) {
        const closeChar = BRACKET_PAIRS[openChar];
        
        if (!closeChar) {
            // 如果不是成对符号，插入普通字符
            editor.insert(openChar);
            return;
        }

        // 开始新配对前，先清除旧的配对模式状态
        clearPairingState(editor);

        const selection = editor.getSelection();
        const selectedText = editor.getSelectedText();
        const range = selection.getRange();
        
        if (selectedText) {
            // 如果有选中的文本，用成对符号包围它
            const wrappedText = openChar + selectedText + closeChar;
            editor.session.replace(range, wrappedText);
            
            // 选中被包围的内容
            const startPos = range.start;
            const endPos = {
                row: startPos.row,
                column: startPos.column + openChar.length + selectedText.length
            };
            editor.selection.setRange({
                start: { row: startPos.row, column: startPos.column + openChar.length },
                end: endPos
            });
            
            // 包围文本不进入配对模式
            editor._inPairingMode = false;
            editor._pairingEndPos = null;
        } else {
            // 没有选中文本，插入成对符号并将光标放在中间
            const pair = openChar + closeChar;
            editor.insert(pair);
            
            // 将光标移到成对符号之间
            const cursor = editor.getCursorPosition();
            editor.moveCursorTo(cursor.row, cursor.column - closeChar.length);
            
            // 选中中间的空位置（为了后续输入时自动替换）
            // 这里我们创建一个零宽度的选择，这样用户输入时会自动替换
            const cursorPos = editor.getCursorPosition();
            editor.selection.setRange({
                start: cursorPos,
                end: cursorPos
            });
            
            // 标记当前处于配对模式
            editor._inPairingMode = true;
            editor._pairingEndPos = {
                row: cursorPos.row,
                column: cursorPos.column + closeChar.length
            };
        }
    }

    /**
     * 监听文本变化以自动清除配对模式
     * Monitor text changes to auto-clear pairing mode
     * @param {Object} editor - Ace Editor 实例
     */
    function setupChangeListener(editor) {
        let lastChangeTime = 0;
        
        editor.on('change', function(delta) {
            // 如果在配对模式中且用户开始输入内容
            if (editor._inPairingMode && delta.action === 'insert') {
                const currentTime = Date.now();
                const insertedText = delta.lines[0];
                
                // 忽略配对符号自身的插入（左侧和右侧符号）
                const isOpenBracket = BRACKET_PAIRS.hasOwnProperty(insertedText) && insertedText.length === 1;
                const isCloseBracket = Object.values(BRACKET_PAIRS).includes(insertedText) && insertedText.length === 1;
                
                if (isOpenBracket || isCloseBracket) {
                    // 这是配对符号本身的插入，不更新位置
                    return;
                }
                
                // 更新配对模式的结束位置
                if (editor._pairingEndPos) {
                    const lines = delta.lines;
                    const numLines = lines.length;
                    const lastLine = lines[numLines - 1];
                    
                    if (numLines === 1) {
                        // 单行插入
                        editor._pairingEndPos.column += lastLine.length;
                    } else {
                        // 多行插入
                        editor._pairingEndPos.row += numLines - 1;
                        editor._pairingEndPos.column = lastLine.length;
                    }
                }
                
                lastChangeTime = currentTime;
            }
        });

        // 监听光标移动以清除配对模式
        editor.selection.on('changeCursor', function() {
            // 如果正在设置配对状态，不要干扰
            if (editor._settingPairing) {
                return;
            }
            
            if (editor._inPairingMode) {
                const cursor = editor.getCursorPosition();
                const endPos = editor._pairingEndPos;
                
                // 如果光标移动到了结束位置之外，清除配对模式
                if (endPos && (cursor.row !== endPos.row || cursor.column > endPos.column)) {
                    // 彻底清除配对模式的所有状态
                    clearPairingState(editor);
                }
            }
        });
    }

    /**
     * 增强的退格处理
     * Enhanced backspace handling
     * @param {Object} editor - Ace Editor 实例
     */
    function setupBackspaceHandler(editor) {
        editor.commands.addCommand({
            name: 'smartBackspace',
            bindKey: { win: 'Backspace', mac: 'Backspace' },
            exec: function(editor) {
                const cursor = editor.getCursorPosition();
                const line = editor.session.getLine(cursor.row);
                const charBefore = line.charAt(cursor.column - 1);
                const charAfter = line.charAt(cursor.column);
                
                // 检查是否在成对符号之间
                if (BRACKET_PAIRS[charBefore] === charAfter && cursor.column > 0) {
                    // 同时删除成对的符号
                    const range = {
                        start: { row: cursor.row, column: cursor.column - 1 },
                        end: { row: cursor.row, column: cursor.column + 1 }
                    };
                    editor.session.replace(range, '');
                    
                    // 彻底清除配对模式
                    clearPairingState(editor);
                } else {
                    // 执行默认的退格操作
                    editor.remove('left');
                }
            }
        });
    }

    // ==========================
    // 公共 API
    // Public API
    // ==========================

    /**
     * 启用编辑器增强功能
     * Enable editor enhancement features
     * @param {Object} editor - Ace Editor 实例
     * @param {Object} options - 配置选项
     */
    window.enableEditorEnhancement = function(editor, options = {}) {
        options = Object.assign({
            autoPairing: true,
            smartBackspace: true,
            customBracketMatching: true
        }, options);

        if (options.customBracketMatching) {
            setupCustomBracketMatching(editor);
        }

        if (options.autoPairing) {
            initAutoPairing(editor);
            setupChangeListener(editor);
        }

        if (options.smartBackspace) {
            setupBackspaceHandler(editor);
        }

        console.log('Editor enhancement features enabled');
    };

    /**
     * 禁用编辑器增强功能
     * Disable editor enhancement features
     * @param {Object} editor - Ace Editor 实例
     */
    window.disableEditorEnhancement = function(editor) {
        // 清除配对模式标记
        clearPairingState(editor);

        console.log('Editor enhancement features disabled');
    };

})();

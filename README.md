# Github Markdown Writer (Jekyller)

Github Markdown Writer（原名 Jekyller）是一款面向 GitHub Pages 写作的浏览器扩展，提供内置 Markdown 编辑、实时预览与一键发布到 GitHub 的功能。

Github Markdown Writer (formerly Jekyller) is a browser extension for GitHub Pages authors, offering a built-in Markdown editor, live preview and one-click publish to GitHub.

**Key features / 主要功能**
- Markdown 编辑器：实时预览、语法高亮、Front Matter 编辑。
- Quick publish：自动提交到指定 GitHub 仓库并生成文件名/路径。
- Interface customization：多语言（中/英）、明暗主题切换、自定义编辑器配置（字体大小、自动保存、行号等）。
- 多种键绑定模式：支持 Normal / Vim / Sublime / Emacs。

**Quick start / 快速开始**
1. 点击浏览器工具栏中的扩展图标打开编辑器。
2. 在设置中配置 GitHub 信息：用户名、仓库名称与访问令牌（Token）。
  - How to get a token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token. Give at least `repo` permission.
3. 创建新文章：New Post → 填写 Front Matter（title、date、categories 等）→ Publish 上传到仓库。

**Usage highlights / 使用要点**
- 创建新文章（New Post）、编辑现有文章、保存并点击 Publish/Update 将变更推送到 GitHub。
- Front Matter 必须格式正确，否则可能导致发布失败或路径错误。

**Settings / 设置**
- 语言切换（中文 / English）。
- 编辑器配置：字体大小、自动保存、键绑定模式、显示行号等。

**Keybinding modes / 键绑定模式**
- Normal（默认）：常见快捷键如 Ctrl+S 保存、Ctrl+F 查找等。
- Vim：支持 Normal/Insert/Visual 模式以及常用 ex 命令（:w, :q, :wq 等）和扩展命令（:layout, :switch, :new, :published 等）。
- Sublime / Emacs：分别模拟对应编辑器的快捷键。

**FAQ / 常见问题**
- 无法连接 GitHub？检查网络、Token 是否有效、Token 权限是否包含 `repo`。
- 发布失败？检查仓库名称、文件路径和 Front Matter 格式是否正确。

**Links / 链接**
- 项目仓库 / GitHub: https://github.com/shinemoon/jekyller

## History / 更新历史
- 4.0.2: Refine format details
- 4.0: Critical reconstruction — switch to Ace editor, add Focus Mode, UI/Theme improvements

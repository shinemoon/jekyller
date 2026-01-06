(function(){
  function query(sel){ return document.querySelector(sel); }
  const post = query('.posttitle');
  const framePop = query('#top-banner-row .frame-pop');
  const topBannerRow = query('#top-banner-row');
  function isFramePopVisible(){
    const el = query('#top-banner-row .frame-pop');
    if (!el) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return el.offsetParent !== null;
  }

  function isTopBannerVisible(){
    const top = query('#top-banner-row');
    if (!top) return false;
    // Visible if explicitly expanded or temporarily shown
    if (top.classList.contains('expanded') || top.classList.contains('show-temp')) return true;
    // Visible if the frame-pop panel is visible
    if (isFramePopVisible()) return true;
    // Otherwise consider it hidden
    return false;
  }

  function syncPosttitle(){
    if (!post) return;
    try{
      // 在非单列布局（即 full 布局）时，posttitle 应始终可见
      if (!document.body.classList.contains('single')) {
        post.classList.remove('hidden');
        return;
      }
      const visible = isTopBannerVisible();
      if (visible) post.classList.remove('hidden'); else post.classList.add('hidden');
    }catch(e){ }
  }
  // observe class/style changes on body and top-banner-row
  const obs = new MutationObserver(()=> syncPosttitle());
  if (document.body) obs.observe(document.body, {attributes:true, attributeFilter:['class','style']});
  if (topBannerRow) obs.observe(topBannerRow, {attributes:true, attributeFilter:['class','style']});
  // also run on load and when clicks happen (some UI toggles fire clicks)
  window.addEventListener('load', ()=> setTimeout(syncPosttitle, 100));
  document.addEventListener('click', ()=> setTimeout(syncPosttitle, 50));
  // Keep .frame-pop aligned with .top-banner height and vertical position
  function alignFramePopToTopBanner() {
    try {
      const frame = query('#top-banner-row .frame-pop');
      const topBanner = query('#top-banner-row .top-banner');
      if (!topBanner) return;
      const topBannerRow = query('#top-banner-row');
      const isRotated = topBannerRow && topBannerRow.classList.contains('rotated-preview');
      
      // 如果是旋转状态且未展开，不进行对齐（此时 banner 在右下角）
      const isExpanded = topBannerRow && topBannerRow.classList.contains('expanded');
      if (isRotated && !isExpanded) {
        console.log('[alignFramePopToTopBanner] 跳过：旋转状态且未展开');
        return;
      }
      
      const rect = topBanner.getBoundingClientRect();
      // 使用 offsetHeight 获取 .top-banner 的实际内容高度（不受父元素旋转影响）
      const actualHeight = topBanner.offsetHeight;
      
      /*console.log('[alignFramePopToTopBanner]', {
        'topBanner rect.width': rect.width,
        'topBanner rect.height': rect.height,
        'topBanner.offsetHeight': topBanner.offsetHeight,
        'topBanner.offsetWidth': topBanner.offsetWidth,
        'topBanner.scrollHeight': topBanner.scrollHeight,
        'isRotated': isRotated,
        'actualHeight': actualHeight,
        'topBannerRow classes': topBannerRow ? topBannerRow.className : 'null'
      });
      */
      
      // expose banner height as a CSS variable so SCSS can compute offsets
      try {
        document.documentElement.style.setProperty('--top-banner-height', `${Math.round(actualHeight)}px`);
        // set top relative to viewport + scroll so .frame-pop can align exactly
        document.documentElement.style.setProperty('--top-banner-top', `${Math.round(rect.top + window.scrollY)}px`);
      } catch(e) {}
      
      // Also trigger tooltip repositioning after CSS variables are set
      if (window.positionTooltipToToolBanner) {
        try { window.positionTooltipToToolBanner(); } catch(e) {}
      }
      
      if (!frame) return;
      const gap = 8; // gap between banner and pop
      // Compute desired width to fill available space left of the banner, clamped
      const desiredWidth = Math.max(240, Math.min(320, Math.round(window.innerWidth - rect.width - 80)));
      const left = Math.round(rect.left - desiredWidth - gap);
      // Apply positioning using left to avoid conflict with existing 'right' rules
      frame.style.position = 'fixed';
      frame.style.left = `${Math.max(8, left)}px`;
      frame.style.right = 'auto';
      frame.style.width = `${desiredWidth}px`;
      // keep frame height in sync (JS fallback); top is controlled by CSS variable
      frame.style.height = `${Math.round(actualHeight)}px`;
      frame.style.removeProperty('top');
    } catch (e) {
      // ignore
    }
  }

  window.addEventListener('resize', alignFramePopToTopBanner);
  window.addEventListener('load', ()=> setTimeout(alignFramePopToTopBanner, 120));
  document.addEventListener('click', ()=> setTimeout(alignFramePopToTopBanner, 50));
  if (topBannerRow) {
    const obs2 = new MutationObserver(()=> alignFramePopToTopBanner());
    obs2.observe(topBannerRow, {attributes:true, attributeFilter:['class','style']});
  }
  // expose for debugging
  window.positionFramePopToTopBanner = alignFramePopToTopBanner;
  // expose for debugging
  window.__syncPosttitle = syncPosttitle;
  
  // 立即执行一次以设置初始 CSS 变量，不等待 load 事件
  // 使用 setTimeout 0 确保 DOM 已就绪
  setTimeout(alignFramePopToTopBanner, 0);
})();

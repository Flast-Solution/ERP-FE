const SELECTOR =
  '.ant-table-container > .ant-table-content, .ant-table-container > .ant-table-body';
const MIN_THUMB = 36;

export const installTableScrollbars = (root = document.body) => {
  const entries = new Map();
  let frame = null;
  let stopped = false;

  const create = (viewport) => {
    const bar = document.createElement('div');
    bar.className = 'table-visible-scrollbar';
    bar.tabIndex = 0;
    bar.setAttribute('role', 'scrollbar');
    bar.setAttribute('aria-orientation', 'horizontal');
    bar.setAttribute('aria-label', 'Cuộn ngang bảng');
    const thumb = document.createElement('div');
    thumb.className = 'table-visible-scrollbar__thumb';
    bar.append(thumb);
    viewport.after(bar);
    viewport.classList.add('table-has-visible-scrollbar');
    let drag = null;

    const update = () => {
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      bar.hidden = max <= 1 || viewport.clientWidth === 0;
      const width = bar.clientWidth;
      const thumbWidth = Math.min(
        width,
        Math.max(MIN_THUMB, (width * viewport.clientWidth) / viewport.scrollWidth),
      );
      const travel = Math.max(0, width - thumbWidth);
      thumb.style.width = `${thumbWidth}px`;
      thumb.style.transform = `translateX(${max ? (viewport.scrollLeft / max) * travel : 0}px)`;
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(Math.round(max)));
      bar.setAttribute('aria-valuenow', String(Math.round(viewport.scrollLeft)));
    };
    const pointerDown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const max = viewport.scrollWidth - viewport.clientWidth;
      const travel = bar.clientWidth - thumb.clientWidth;
      if (travel <= 0) return;
      if (event.target !== thumb) {
        const x = event.clientX - bar.getBoundingClientRect().left - thumb.clientWidth / 2;
        viewport.scrollLeft = Math.max(0, Math.min(max, (x / travel) * max));
        update();
      }
      drag = { x: event.clientX, left: viewport.scrollLeft, max, travel };
      bar.setPointerCapture(event.pointerId);
      bar.focus({ preventScroll: true });
    };
    const pointerMove = (event) => {
      if (!drag) return;
      viewport.scrollLeft = Math.max(
        0,
        Math.min(drag.max, drag.left + ((event.clientX - drag.x) / drag.travel) * drag.max),
      );
      update();
    };
    const pointerEnd = () => {
      drag = null;
    };
    const keyDown = (event) => {
      const positions = {
        ArrowLeft: viewport.scrollLeft - 60,
        ArrowRight: viewport.scrollLeft + 60,
        PageUp: viewport.scrollLeft - viewport.clientWidth,
        PageDown: viewport.scrollLeft + viewport.clientWidth,
        Home: 0,
        End: viewport.scrollWidth,
      };
      if (!(event.key in positions)) return;
      event.preventDefault();
      event.stopPropagation();
      viewport.scrollLeft = positions[event.key];
      update();
    };
    viewport.addEventListener('scroll', update, { passive: true });
    bar.addEventListener('click', (event) => event.stopPropagation());
    bar.addEventListener('pointerdown', pointerDown);
    bar.addEventListener('pointermove', pointerMove);
    bar.addEventListener('pointerup', pointerEnd);
    bar.addEventListener('pointercancel', pointerEnd);
    bar.addEventListener('lostpointercapture', pointerEnd);
    bar.addEventListener('keydown', keyDown);
    return {
      update,
      cleanup: () => {
        viewport.removeEventListener('scroll', update);
        bar.remove();
        viewport.classList.remove('table-has-visible-scrollbar');
      },
    };
  };

  const scan = () => {
    frame = null;
    if (stopped) return;
    entries.forEach((entry, viewport) => {
      if (
        !root.contains(viewport) ||
        viewport.classList.contains('table-horizontal-scroll-managed')
      ) {
        resizeObserver?.unobserve(viewport);
        resizeObserver?.unobserve(entry.table);
        entry.cleanup();
        entries.delete(viewport);
      }
    });
    root.querySelectorAll(SELECTOR).forEach((viewport) => {
      // Tenant tables can already own a persistent footer scrollbar.
      if (viewport.classList.contains('table-horizontal-scroll-managed')) return;
      const table = [...viewport.children].find((child) => child.tagName === 'TABLE');
      if (!table) return;
      let entry = entries.get(viewport);
      if (!entry) {
        entry = { ...create(viewport), table };
        entries.set(viewport, entry);
        resizeObserver?.observe(viewport);
        resizeObserver?.observe(table);
      } else if (entry.table !== table) {
        resizeObserver?.unobserve(entry.table);
        entry.table = table;
        resizeObserver?.observe(table);
      }
      entry.update();
    });
  };
  const schedule = () => {
    if (!stopped && frame == null) frame = requestAnimationFrame(scan);
  };
  const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  const mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(root, { childList: true, subtree: true });
  window.addEventListener('resize', schedule);
  schedule();
  return () => {
    stopped = true;
    if (frame != null) cancelAnimationFrame(frame);
    mutationObserver.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', schedule);
    entries.forEach((entry) => entry.cleanup());
    entries.clear();
  };
};

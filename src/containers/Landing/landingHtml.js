const escapeAttribute = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const buildMetaTags = schema => (schema?.seo?.meta ?? [])
  .filter(meta => meta?.name && meta?.value)
  .map(meta => {
    const key = String(meta.name)
    const attribute = key.startsWith('og:') ? 'property' : 'name'
    return `<meta ${attribute}="${escapeAttribute(key)}" content="${escapeAttribute(meta.value)}">`
  })
  .join('\n    ')

const getTitle = schema => (
  schema?.seo?.meta?.find(meta => meta?.name === 'title')?.value
  || schema?.name
  || 'Landing page'
)

const readStyle = style => {
  if (style.textContent) return style.textContent
  try {
    return Array.from(style.sheet?.cssRules ?? []).map(rule => rule.cssText).join('\n')
  } catch {
    return ''
  }
}

const captureStyledCss = () => Array.from(document.querySelectorAll('style[data-styled]'))
  .map(readStyle)
  .filter(Boolean)
  .join('\n')

const capturePreviewMarkup = () => {
  const source = document.querySelector('[data-landing-preview="true"]')
  if (!source) return ''
  const clone = source.cloneNode(true)
  clone.querySelectorAll('[data-landing-editor-only="true"]').forEach(node => node.remove())
  clone.querySelectorAll('.is-selected, .is-active').forEach(node => {
    node.classList.remove('is-selected', 'is-active')
  })
  clone.removeAttribute('data-landing-preview')
  clone.removeAttribute('data-device')
  return clone.outerHTML
}

export const generateLandingHtml = schema => {
  const markup = capturePreviewMarkup()
  if (!markup) throw new Error('Không tìm thấy nội dung Preview để sinh HTML.')
  const css = captureStyledCss()
  const metaTags = buildMetaTags(schema)
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeAttribute(getTitle(schema))}</title>
  ${metaTags}
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body { background: #fff; }
    ${css}
  </style>
</head>
<body>
  ${markup}
  <script>
    (() => {
      const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      document.querySelectorAll('[data-landing-navbar="true"]').forEach(navbar => {
        const trigger = navbar.querySelector('[data-mobile-menu-trigger="true"]');
        const backdrop = navbar.parentElement?.querySelector('[data-mobile-menu-backdrop="true"]');
        const drawer = navbar.parentElement?.querySelector('[data-mobile-menu-drawer="true"]');
        if (!trigger || !backdrop || !drawer) return;

        let previousOverflow = '';
        const getFocusable = () => Array.from(drawer.querySelectorAll(focusableSelector));
        const close = () => {
          drawer.hidden = true;
          backdrop.hidden = true;
          drawer.dataset.open = 'false';
          backdrop.dataset.open = 'false';
          drawer.setAttribute('aria-hidden', 'true');
          trigger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = previousOverflow;
          trigger.focus();
        };
        const open = () => {
          previousOverflow = document.body.style.overflow;
          drawer.hidden = false;
          backdrop.hidden = false;
          drawer.dataset.open = 'true';
          backdrop.dataset.open = 'true';
          drawer.setAttribute('aria-hidden', 'false');
          trigger.setAttribute('aria-expanded', 'true');
          document.body.style.overflow = 'hidden';
          window.requestAnimationFrame(() => getFocusable()[0]?.focus());
        };

        trigger.addEventListener('click', open);
        backdrop.addEventListener('click', close);
        drawer.querySelector('[data-mobile-menu-close="true"]')?.addEventListener('click', close);
        drawer.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', close));
        drawer.addEventListener('keydown', event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
          }
          if (event.key !== 'Tab') return;
          const elements = getFocusable();
          if (!elements.length) {
            event.preventDefault();
            return;
          }
          const first = elements[0];
          const last = elements[elements.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        });
      });

      document.querySelectorAll('[data-banner="true"]').forEach(banner => {
        const track = banner.firstElementChild;
        const slides = Array.from(track?.children || []);
        const dots = Array.from(banner.querySelectorAll('[data-banner-dot]'));
        if (!track || slides.length < 2) return;
        let current = 0;
        let timer = null;
        let touchStart = null;
        const interval = Math.max(2000, Number(banner.dataset.interval) || 5000);
        const render = () => {
          track.style.transform = 'translateX(-' + (current * 100) + '%)';
          dots.forEach((dot, index) => {
            dot.style.opacity = index === current ? '1' : '.45';
            dot.setAttribute('aria-current', index === current ? 'true' : 'false');
          });
        };
        const go = index => {
          current = (index + slides.length) % slides.length;
          render();
        };
        const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
        const start = () => {
          stop();
          if (banner.dataset.autoplay === 'true') timer = window.setInterval(() => go(current + 1), interval);
        };
        banner.querySelector('[data-banner-prev]')?.addEventListener('click', () => go(current - 1));
        banner.querySelector('[data-banner-next]')?.addEventListener('click', () => go(current + 1));
        dots.forEach(dot => dot.addEventListener('click', () => go(Number(dot.dataset.bannerDot) || 0)));
        if (banner.dataset.pauseOnHover === 'true') {
          banner.addEventListener('mouseenter', stop);
          banner.addEventListener('mouseleave', start);
        }
        banner.addEventListener('touchstart', event => { touchStart = event.touches[0]?.clientX ?? null; }, { passive: true });
        banner.addEventListener('touchend', event => {
          const end = event.changedTouches[0]?.clientX;
          if (touchStart == null || end == null || Math.abs(touchStart - end) < 40) return;
          go(current + (touchStart > end ? 1 : -1));
          touchStart = null;
        }, { passive: true });
        render();
        start();
      });

      document.querySelectorAll('[data-faq="true"]').forEach(faq => {
        const allowMultiple = faq.dataset.allowMultiple === 'true';
        faq.querySelectorAll('[data-faq-trigger]').forEach(trigger => {
          trigger.addEventListener('click', () => {
            const index = trigger.dataset.faqTrigger;
            const panel = faq.querySelector('[data-faq-panel="' + index + '"]');
            const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
            if (!allowMultiple) {
              faq.querySelectorAll('[data-faq-trigger]').forEach(other => {
                other.setAttribute('aria-expanded', 'false');
                const otherIcon = other.querySelector('[aria-hidden="true"]');
                if (otherIcon) otherIcon.textContent = '+';
              });
              faq.querySelectorAll('[data-faq-panel]').forEach(other => { other.hidden = true; });
            }
            trigger.setAttribute('aria-expanded', String(willOpen));
            const icon = trigger.querySelector('[aria-hidden="true"]');
            if (icon) icon.textContent = willOpen ? '−' : '+';
            if (panel) panel.hidden = !willOpen;
          });
        });
      });

      document.querySelectorAll('[data-tabs="true"]').forEach(tabs => {
        const triggers = Array.from(tabs.querySelectorAll('[role="tab"]'));
        const panels = Array.from(tabs.querySelectorAll('[role="tabpanel"]'));
        const activate = index => {
          triggers.forEach((trigger, itemIndex) => {
            trigger.setAttribute('aria-selected', String(itemIndex === index));
            trigger.tabIndex = itemIndex === index ? 0 : -1;
          });
          panels.forEach((panel, itemIndex) => { panel.hidden = itemIndex !== index; });
        };
        triggers.forEach((trigger, index) => {
          trigger.addEventListener('click', () => activate(index));
          trigger.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? triggers.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length;
            activate(next);
            triggers[next]?.focus();
          });
        });
        activate(Math.max(0, triggers.findIndex(trigger => trigger.getAttribute('aria-selected') === 'true')));
      });

      document.querySelectorAll('[data-popup="true"]').forEach(popup => {
        popup.hidden = true;
        popup.style.display = 'none';
        const key = 'landing-popup-' + (popup.closest('[id]')?.id || Math.random());
        if (popup.dataset.showOnce === 'true' && window.sessionStorage.getItem(key)) return;
        window.setTimeout(() => {
          popup.hidden = false;
          popup.style.display = 'grid';
          popup.querySelector(focusableSelector)?.focus();
          if (popup.dataset.showOnce === 'true') window.sessionStorage.setItem(key, 'shown');
        }, Math.max(0, Number(popup.dataset.delay) || 0) * 1000);
        const close = () => { popup.hidden = true; popup.style.display = 'none'; };
        popup.querySelector('[data-popup-close]')?.addEventListener('click', close);
        popup.addEventListener('click', event => { if (event.target === popup) close(); });
        popup.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
      });

      document.querySelectorAll('[data-gallery-lightbox="true"]').forEach(lightbox => {
        const block = lightbox.closest('[id]') || lightbox.parentElement;
        const close = () => { lightbox.hidden = true; lightbox.style.display = 'none'; };
        close();
        block?.querySelectorAll('[data-gallery-item="true"]').forEach(item => item.addEventListener('click', () => {
          let image = lightbox.querySelector('img');
          if (!image) {
            image = document.createElement('img');
            image.style.cssText = 'max-width:92vw;max-height:86vh;object-fit:contain';
            lightbox.appendChild(image);
          }
          image.src = item.dataset.imageUrl || '';
          image.alt = item.dataset.imageAlt || '';
          lightbox.hidden = false;
          lightbox.style.display = 'grid';
          lightbox.querySelector('[data-gallery-close]')?.focus();
        }));
        lightbox.querySelector('[data-gallery-close]')?.addEventListener('click', close);
        lightbox.addEventListener('click', event => { if (event.target === lightbox) close(); });
      });

      document.querySelectorAll('[data-video-consent="true"]').forEach(consent => {
        consent.querySelector('[data-video-consent-button]')?.addEventListener('click', () => {
          const iframe = document.createElement('iframe');
          iframe.src = consent.dataset.videoUrl || '';
          iframe.title = 'Video';
          iframe.allow = 'autoplay; fullscreen';
          iframe.allowFullscreen = true;
          iframe.style.cssText = 'width:100%;border:0;aspect-ratio:16/9';
          consent.replaceWith(iframe);
        });
      });

      document.querySelectorAll('[data-landing-form="true"]').forEach(form => {
        form.addEventListener('submit', async event => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const status = form.querySelector('[data-form-status]');
          const endpoint = form.dataset.endpoint;
          if (!endpoint) { if (status) status.textContent = 'Chưa cấu hình API nhận dữ liệu.'; return; }
          const values = Object.fromEntries(new FormData(form).entries());
          if (form.dataset.source) values.source = form.dataset.source;
          try {
            const response = await fetch(endpoint, { method: form.dataset.method || 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            form.reset();
            if (status) status.textContent = form.dataset.successMessage || 'Gửi dữ liệu thành công.';
          } catch (error) {
            if (status) status.textContent = 'Không thể gửi dữ liệu: ' + error.message;
          }
        });
      });

      const parseZonedDate = (value, timeZone) => {
        const parts = String(value).match(/^(\\d{4})-(\\d{2})-(\\d{2})[T ](\\d{2}):(\\d{2})/);
        if (!parts) return new Date(value).getTime();
        const desired = Date.UTC(+parts[1], +parts[2] - 1, +parts[3], +parts[4], +parts[5]);
        const probe = new Date(desired);
        try {
          const zonedParts = new Intl.DateTimeFormat('en-US', { timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(probe);
          const map = Object.fromEntries(zonedParts.map(part => [part.type, part.value]));
          const represented = Date.UTC(+map.year, +map.month - 1, +map.day, +map.hour, +map.minute);
          return desired + (desired - represented);
        } catch (_) { return new Date(value).getTime(); }
      };
      document.querySelectorAll('[data-countdown="true"]').forEach(countdown => {
        const target = parseZonedDate(countdown.dataset.target, countdown.dataset.timezone);
        const units = { 'Ngày': 86400000, 'Giờ': 3600000, 'Phút': 60000, 'Giây': 1000 };
        const update = () => {
          let remaining = Math.max(0, target - Date.now());
          Object.entries(units).forEach(([label, divisor]) => {
            const value = label === 'Ngày' ? Math.floor(remaining / divisor) : Math.floor((remaining / divisor) % (label === 'Giờ' ? 24 : 60));
            const element = countdown.querySelector('[data-countdown-unit="' + label + '"] strong');
            if (element) element.textContent = value;
          });
          if (!remaining) {
            const heading = countdown.querySelector('h2');
            if (heading) heading.textContent = countdown.dataset.completedText || '';
            countdown.querySelector('.landing-countdown-grid')?.remove();
          }
        };
        update();
        window.setInterval(update, 1000);
      });
    })();
  </script>
</body>
</html>`
}

export const formatLandingHtml = html => String(html ?? '').replace(/></g, '>\n<')

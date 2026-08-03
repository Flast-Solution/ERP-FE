import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { useEditorStore } from '@/store/editorStore'

dayjs.extend(utc)
dayjs.extend(timezone)

const sectionStyle = {
  padding: '40px 32px',
  maxWidth: 1180,
  margin: '0 auto',
  boxSizing: 'border-box',
}
const cardStyle = { border: '1px solid #e8e8ee', borderRadius: 14, padding: 20, background: '#fff' }
const gridStyle = { display: 'grid', gap: 18 }

const safeUrl = (value, fallback = '#') => {
  const url = String(value ?? '').trim()
  if (!url) return fallback
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url
  return fallback
}

export const sanitizeHtml = value => {
  if (typeof window === 'undefined') return ''
  const doc = new window.DOMParser().parseFromString(String(value ?? ''), 'text/html')
  const allowedTags = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'U', 'UL'])
  const allowedAttrs = new Set(['href', 'target', 'rel', 'class', 'style'])
  Array.from(doc.body.querySelectorAll('*')).forEach(node => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes)
      return
    }
    Array.from(node.attributes).forEach(attribute => {
      if (!allowedAttrs.has(attribute.name.toLowerCase())) node.removeAttribute(attribute.name)
    })
    const inlineStyle = node.getAttribute('style')
    if (inlineStyle && /(url\s*\(|expression\s*\(|@import|javascript:)/i.test(inlineStyle)) {
      node.removeAttribute('style')
    }
    if (node.tagName === 'A') {
      node.setAttribute('href', safeUrl(node.getAttribute('href')))
      if (node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer')
    }
  })
  return doc.body.innerHTML
}

const FormPreview = ({ props, lead = false, primaryColor }) => {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    const endpoint = safeUrl(props.endpoint, '')
    if (!endpoint) {
      setError('Chưa cấu hình API nhận dữ liệu.')
      return
    }

    const values = Object.fromEntries(new window.FormData(event.currentTarget).entries())
    const payload = lead ? { ...values, source: props.source || 'LANDING_PAGE' } : values
    setStatus('submitting')
    setError('')
    try {
      const response = await window.fetch(endpoint, {
        method: props.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`API trả về HTTP ${response.status}`)
      setStatus('success')
      event.currentTarget.reset()
    } catch (submitError) {
      setStatus('error')
      setError(submitError.message || 'Không thể gửi dữ liệu.')
    }
  }

  return (
    <section style={sectionStyle}>
      <form
        data-landing-form="true"
        data-endpoint={props.endpoint || ''}
        data-method={props.method || 'POST'}
        data-source={lead ? (props.source || 'LANDING_PAGE') : ''}
        data-success-message={props.successMessage || 'Gửi dữ liệu thành công.'}
        style={{ ...cardStyle, maxWidth: 720, margin: '0 auto' }}
        onSubmit={submit}
      >
        <h2 style={{ marginTop: 0 }}>{props.title}</h2>
        {(props.fields ?? []).map((field, index) => (
          <label key={`${field.name}-${index}`} style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 7 }}>
              {field.label}{field.required ? ' *' : ''}
            </span>
            {field.type === 'textarea'
              ? <textarea name={field.name} required={Boolean(field.required)} rows={4} placeholder={field.placeholder} style={{ width: '100%', padding: 11, border: '1px solid #ddd', borderRadius: 8 }} />
              : <input name={field.name} required={Boolean(field.required)} type={field.type || 'text'} placeholder={field.placeholder} style={{ width: '100%', padding: 11, border: '1px solid #ddd', borderRadius: 8 }} />
            }
          </label>
        ))}
        <button disabled={status === 'submitting'} type="submit" style={{ border: 0, borderRadius: 8, padding: '11px 20px', color: '#fff', background: primaryColor || '#6550d8', fontWeight: 650 }}>
          {status === 'submitting' ? 'Đang gửi...' : (props.submitText || (lead ? 'Đăng ký' : 'Gửi'))}
        </button>
        <div aria-live="polite" data-form-status="true" style={{ marginTop: 12, color: status === 'error' ? '#c62828' : '#18794e' }}>
          {status === 'success' ? props.successMessage : error}
        </div>
      </form>
    </section>
  )
}

const Countdown = ({ props }) => {
  const targetTime = useMemo(() => {
    try {
      const parsed = dayjs.tz(props.targetDate, props.timezone || 'Asia/Ho_Chi_Minh')
      return parsed.isValid() ? parsed.valueOf() : Number.NaN
    } catch {
      return Number.NaN
    }
  }, [props.targetDate, props.timezone])
  const [remaining, setRemaining] = useState(() => Math.max(0, targetTime - Date.now()))
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, targetTime - Date.now()))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [targetTime])
  const units = [
    ['Ngày', Math.floor(remaining / 86400000)],
    ['Giờ', Math.floor((remaining / 3600000) % 24)],
    ['Phút', Math.floor((remaining / 60000) % 60)],
    ['Giây', Math.floor((remaining / 1000) % 60)],
  ]
  return (
    <section
      className="landing-countdown"
      data-countdown="true"
      data-target={props.targetDate || ''}
      data-timezone={props.timezone || 'Asia/Ho_Chi_Minh'}
      data-completed-text={props.completedText || ''}
      style={{ ...sectionStyle, textAlign: 'center' }}
    >
      {Number.isNaN(targetTime) && <p role="alert" style={{ color: '#c62828' }}>Ngày kết thúc không hợp lệ.</p>}
      <h2>{remaining ? props.title : props.completedText}</h2>
      {remaining > 0 && <div className="landing-countdown-grid" style={{ ...gridStyle, gridTemplateColumns: 'repeat(4, minmax(70px, 120px))', justifyContent: 'center' }}>
        {units.map(([label, value]) => <div data-countdown-unit={label} key={label} style={cardStyle}><strong style={{ fontSize: 26 }}>{value}</strong><div>{label}</div></div>)}
      </div>}
    </section>
  )
}

const InteractiveTabs = ({ items = [], variant = 'underline', blockId = 'tabs' }) => {
  const [active, setActive] = useState(0)
  const safeActive = active < items.length ? active : 0
  return (
    <section data-tabs="true" data-tabs-variant={variant} style={sectionStyle}>
      <div className="landing-tabs-list" role="tablist" aria-label="Nội dung theo tab" style={{ display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '1px solid #ddd' }}>
        {items.map((item, index) => <button type="button" role="tab" id={`${blockId}-tab-${index}`} aria-selected={index === safeActive} aria-controls={`${blockId}-panel-${index}`} tabIndex={index === safeActive ? 0 : -1} data-tab-index={index} key={`${item.label}-${index}`} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (safeActive + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length
          setActive(next)
          event.currentTarget.parentElement?.children[next]?.focus()
        }} onClick={() => setActive(index)} style={{ flex: '0 0 auto', border: variant === 'box' ? '1px solid #ddd' : 0, borderBottom: variant === 'underline' && index === safeActive ? '2px solid #6550d8' : '2px solid transparent', borderRadius: variant === 'pill' ? 999 : variant === 'box' ? 8 : 0, padding: '10px 14px', background: variant === 'pill' && index === safeActive ? '#eee9ff' : 'transparent', fontWeight: 650 }}>{item.label}</button>)}
      </div>
      {items.map((item, index) => (
        <div key={`${item.label}-panel-${index}`} role="tabpanel" id={`${blockId}-panel-${index}`} aria-labelledby={`${blockId}-tab-${index}`} data-tab-panel={index} hidden={index !== safeActive} style={{ padding: '22px 8px' }}>{item.content}</div>
      ))}
    </section>
  )
}

const Faq = ({ props, blockId }) => {
  const [openItems, setOpenItems] = useState([0])
  const toggle = index => setOpenItems(current => {
    const isOpen = current.includes(index)
    if (props.allowMultiple) return isOpen ? current.filter(item => item !== index) : [...current, index]
    return isOpen ? [] : [index]
  })
  return <section data-faq="true" data-allow-multiple={Boolean(props.allowMultiple)} style={sectionStyle}><h2>{props.title}</h2>{(props.items ?? []).map((item, index) => {
    const isOpen = openItems.includes(index)
    return <div key={`${item.question}-${index}`} style={{ borderBottom: '1px solid #e8e8ee' }}><h3 style={{ margin: 0 }}><button type="button" data-faq-trigger={index} aria-expanded={isOpen} aria-controls={`${blockId}-faq-panel-${index}`} onClick={() => toggle(index)} style={{ width: '100%', padding: '16px 0', border: 0, background: 'transparent', display: 'flex', justifyContent: 'space-between', fontWeight: 650, textAlign: 'left' }}>{item.question}<span aria-hidden="true">{isOpen ? '−' : '+'}</span></button></h3><div id={`${blockId}-faq-panel-${index}`} data-faq-panel={index} hidden={!isOpen} style={{ overflow: 'hidden', transition: 'height .2s ease' }}><p style={{ marginTop: 0, color: '#626272' }}>{item.answer}</p></div></div>
  })}</section>
}

const normalizeVideoUrl = (value, autoplay = false) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  try {
    const url = new URL(raw)
    let embedUrl = raw
    if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
      embedUrl = `https://www.youtube-nocookie.com/embed/${url.searchParams.get('v') || ''}`
    } else if (url.hostname === 'youtu.be') {
      embedUrl = `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`
    } else if (url.hostname.includes('vimeo.com') && !url.hostname.startsWith('player.')) {
      embedUrl = `https://player.vimeo.com/video/${url.pathname.split('/').filter(Boolean)[0] || ''}`
    }
    const embed = new URL(embedUrl)
    if (autoplay) embed.searchParams.set('autoplay', '1')
    return embed.toString()
  } catch {
    return ''
  }
}

const VideoPreview = ({ props }) => {
  const [consented, setConsented] = useState(!props.requireConsent)
  const embedUrl = normalizeVideoUrl(props.url, props.autoplay)
  return (
    <section style={sectionStyle}>
      <h2>{props.title}</h2>
      {!embedUrl && <div role="alert" style={cardStyle}>URL video không hợp lệ. Hỗ trợ YouTube, Vimeo hoặc URL embed HTTPS.</div>}
      {embedUrl && !consented && (
        <div data-video-consent="true" data-video-url={embedUrl} style={{ ...cardStyle, display: 'grid', placeItems: 'center', minHeight: 260, background: props.thumbnailUrl ? `center/cover url(${props.thumbnailUrl})` : '#f5f5f8' }}>
          <button data-video-consent-button="true" type="button" onClick={() => setConsented(true)}>{props.consentText || 'Cho phép tải video'}</button>
        </div>
      )}
      {embedUrl && consented && <iframe loading="lazy" title={props.title || 'Video'} src={embedUrl} allow={props.autoplay ? 'autoplay; fullscreen' : 'fullscreen'} allowFullScreen style={{ width: '100%', border: 0, aspectRatio: props.aspectRatio || '16/9', background: props.thumbnailUrl ? `center/cover url(${props.thumbnailUrl})` : undefined }} />}
    </section>
  )
}

const Gallery = ({ props }) => {
  const [activeImage, setActiveImage] = useState(null)
  return (
    <section style={sectionStyle}>
      <h2>{props.title}</h2>
      <div className="landing-gallery-grid" style={{ ...gridStyle, '--gallery-columns': Math.max(1, Math.min(8, Number(props.columns) || 3)), '--gallery-mobile-columns': Math.max(1, Math.min(3, Number(props.mobileColumns) || 1)) }}>
        {(props.images ?? []).map((image, index) => (
          <figure key={`${image.url}-${index}`} style={{ margin: 0 }}>
            <button type="button" data-gallery-item={props.enableLightbox ? 'true' : undefined} data-image-url={image.url} data-image-alt={image.alt || ''} disabled={!props.enableLightbox} onClick={() => props.enableLightbox && setActiveImage(image)} style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', cursor: props.enableLightbox ? 'zoom-in' : 'default' }}>
              <img loading="lazy" src={image.url} alt={image.alt || ''} style={{ display: 'block', width: '100%', aspectRatio: props.aspectRatio || '4/3', objectFit: 'cover', objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%`, borderRadius: 10 }} />
            </button>
            {image.caption && <figcaption style={{ marginTop: 7, color: '#6f6f82', fontSize: 12 }}>{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <div data-gallery-lightbox="true" hidden={!activeImage} role="dialog" aria-modal="true" aria-label="Xem ảnh lớn" onClick={() => setActiveImage(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, padding: 24, background: 'rgba(0,0,0,.82)', placeItems: 'center', display: activeImage ? 'grid' : 'none' }}>
        <button data-gallery-close="true" type="button" aria-label="Đóng" onClick={() => setActiveImage(null)} style={{ position: 'absolute', top: 18, right: 18, color: '#fff', background: 'transparent', border: 0, fontSize: 30 }}>×</button>
        {activeImage && <img src={activeImage.url} alt={activeImage.alt || ''} style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain' }} />}
      </div>
    </section>
  )
}

const AnimatedStat = ({ item, animate }) => {
  const numericValue = Number(String(item.value ?? '').replace(/[^0-9.-]/g, ''))
  const [displayValue, setDisplayValue] = useState(animate && Number.isFinite(numericValue) ? 0 : item.value)
  useEffect(() => {
    if (!animate || !Number.isFinite(numericValue)) {
      setDisplayValue(item.value)
      return undefined
    }
    const start = performance.now()
    const duration = 900
    let frame
    const tick = now => {
      const progress = Math.min(1, (now - start) / duration)
      setDisplayValue(Math.round(numericValue * progress))
      if (progress < 1) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [animate, item.value, numericValue])
  return <div style={{ ...cardStyle, textAlign: 'center', background: 'rgba(255,255,255,.08)' }}>{item.icon && <div aria-hidden="true" style={{ fontSize: 24 }}>{item.icon}</div>}<strong data-stat-value={item.value} style={{ fontSize: 30 }}>{item.prefix}{displayValue}{item.suffix}</strong><div>{item.label}</div></div>
}

const DataList = ({ props, type }) => {
  const [page, setPage] = useState(1)
  const items = props.items ?? []
  const pageSize = Math.max(1, Number(props.pageSize) || 6)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  return (
    <section style={sectionStyle}>
      <h2>{props.title}</h2>{props.description && <p>{props.description}</p>}
      {items.length ? <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>{visibleItems.map((item, index) => <a key={`${item.title}-${index}`} href={safeUrl(item.url)} style={{ ...cardStyle, color: 'inherit', textDecoration: 'none' }}>{item.imageUrl && <img loading="lazy" src={item.imageUrl} alt={item.title || ''} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 9 }} />}<h3>{item.title}</h3>{type === 'postList' && <div style={{ color: '#777', fontSize: 12 }}>{[item.publishedDate, item.author, item.category].filter(Boolean).join(' · ')}</div>}{type === 'teamList' && <div style={{ color: '#777', fontSize: 12 }}>{[item.jobTitle, item.department].filter(Boolean).join(' · ')}</div>}<p>{item.description}</p></a>)}</div> : <p>{props.emptyText}</p>}
      {pageCount > 1 && <nav aria-label="Phân trang" style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 22 }}>{Array.from({ length: pageCount }, (_, index) => <button type="button" aria-current={currentPage === index + 1 ? 'page' : undefined} onClick={() => setPage(index + 1)} key={index + 1}>{index + 1}</button>)}</nav>}
    </section>
  )
}

const Popup = ({ props, blockId }) => {
  const viewMode = useEditorStore(state => state.viewMode)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (viewMode === 'edit') return undefined
    const storageKey = `landing-popup-${blockId}`
    if (props.showOnce && window.sessionStorage.getItem(storageKey)) return undefined
    const timer = window.setTimeout(() => {
      setOpen(true)
      if (props.showOnce) window.sessionStorage.setItem(storageKey, 'shown')
    }, Math.max(0, Number(props.delay) || 0) * 1000)
    return () => window.clearTimeout(timer)
  }, [blockId, props.delay, props.showOnce, viewMode])

  if (viewMode === 'edit') return <section style={sectionStyle}><div style={{ ...cardStyle, maxWidth: 520, margin: '0 auto' }}><small>Preview popup · sau {props.delay || 0}s</small><h2>{props.title}</h2><p>{props.content}</p></div></section>
  return <div data-popup="true" data-delay={props.delay || 0} data-show-once={Boolean(props.showOnce)} hidden={!open} role="dialog" aria-modal="true" aria-labelledby={`${blockId}-title`} style={{ position: 'fixed', inset: 0, zIndex: 999, display: open ? 'grid' : 'none', placeItems: 'center', padding: 20, background: 'rgba(15,17,24,.55)' }} onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}><div style={{ ...cardStyle, position: 'relative', width: 'min(100%, 520px)', boxShadow: '0 20px 60px rgba(0,0,0,.22)' }}><button data-popup-close="true" type="button" aria-label="Đóng popup" onClick={() => setOpen(false)} style={{ position: 'absolute', top: 10, right: 10, border: 0, background: 'transparent', fontSize: 24 }}>×</button><h2 id={`${blockId}-title`}>{props.title}</h2><p>{props.content}</p><a href={safeUrl(props.buttonUrl)}>{props.buttonText}</a></div></div>
}

export const ExtendedBlockRenderer = ({ section, primaryColor = '#6550d8', renderNestedBlock }) => {
  const props = section?.props ?? {}
  const html = useMemo(() => sanitizeHtml(props.html), [props.html])
  switch (section?.type) {
    case 'container': return <section style={{ ...sectionStyle, maxWidth: Number(props.maxWidth) || 1120, padding: Number(props.padding) || 32, background: props.background }}>{(props.blocks ?? []).length ? props.blocks.map(block => <div key={block.id}>{renderNestedBlock?.(block)}</div>) : <><h2>{props.title}</h2><p>{props.content}</p></>}</section>
    case 'columns': return <section className="landing-responsive-columns" style={{ ...sectionStyle, display: 'flex', flexWrap: 'wrap', gap: Number(props.gap) || 20 }}>{(props.columns ?? []).map((column, index) => <div className="landing-responsive-column" key={`${column.title}-${index}`} style={{ ...cardStyle, minWidth: 0, flex: `1 1 calc(${Math.min(100, Math.max(10, Number(column.width) || 50))}% - ${Number(props.gap) || 20}px)` }}>{(column.blocks ?? []).length ? column.blocks.map(block => <div key={block.id}>{renderNestedBlock?.(block)}</div>) : <><h3>{column.title}</h3><p>{column.content}</p>{column.buttonText && <a href={safeUrl(column.buttonUrl)}>{column.buttonText}</a>}</>}</div>)}</section>
    case 'richText':
    case 'customHtml': return <section style={sectionStyle} dangerouslySetInnerHTML={{ __html: html }} />
    case 'cta': {
      const align = ['left', 'center', 'right'].includes(props.layout) ? props.layout : 'center'
      return <section style={{ ...sectionStyle, position: 'relative', maxWidth: 'none', overflow: 'hidden', textAlign: align, color: props.textColor || '#16161a', background: props.backgroundImageUrl ? `center/cover url(${props.backgroundImageUrl})` : props.background }}><div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: props.overlayColor || '#000', opacity: Math.min(100, Math.max(0, Number(props.overlayOpacity) || 0)) / 100 }} /><div style={{ position: 'relative' }}><h2>{props.title}</h2><p>{props.description}</p><div style={{ display: 'flex', gap: 10, justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center', flexWrap: 'wrap' }}><a href={safeUrl(props.buttonUrl)} target={props.buttonOpenInNewTab ? '_blank' : undefined} rel={props.buttonOpenInNewTab ? 'noopener noreferrer' : undefined} style={{ display: 'inline-block', padding: '11px 20px', borderRadius: 8, color: '#fff', background: primaryColor, textDecoration: 'none' }}>{props.buttonText}</a>{props.secondaryButtonText && <a href={safeUrl(props.secondaryButtonUrl)} target={props.secondaryButtonOpenInNewTab ? '_blank' : undefined} rel={props.secondaryButtonOpenInNewTab ? 'noopener noreferrer' : undefined} style={{ display: 'inline-block', padding: '10px 19px', border: `1px solid ${primaryColor}`, borderRadius: 8, color: primaryColor, background: '#fff', textDecoration: 'none' }}>{props.secondaryButtonText}</a>}</div></div></section>
    }
    case 'contactForm': return <FormPreview props={props} primaryColor={primaryColor} />
    case 'leadForm': return <FormPreview props={props} lead primaryColor={primaryColor} />
    case 'video': return <VideoPreview props={props} />
    case 'gallery': return <Gallery props={props} />
    case 'faq': return <Faq props={props} blockId={section.id} />
    case 'testimonials': return <section style={sectionStyle}><h2>{props.title}</h2><div className={props.carousel ? 'landing-testimonial-carousel' : undefined} style={{ ...gridStyle, display: props.carousel ? 'flex' : 'grid', overflowX: props.carousel ? 'auto' : undefined, scrollSnapType: props.carousel ? 'x mandatory' : undefined, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>{(props.items ?? []).map((item, index) => <blockquote key={`${item.name}-${index}`} style={{ ...cardStyle, flex: props.carousel ? '0 0 min(85%, 360px)' : undefined, scrollSnapAlign: 'start', margin: 0, border: props.cardStyle === 'minimal' ? 0 : cardStyle.border, boxShadow: props.cardStyle === 'shadow' ? '0 12px 30px rgba(20,20,30,.1)' : 'none' }}>{item.companyLogo && <img loading="lazy" src={item.companyLogo} alt={item.company || ''} style={{ maxWidth: 100, height: 34, objectFit: 'contain' }} />}<div aria-label={`${Math.min(5, Math.max(1, Number(item.rating) || 5))} trên 5 sao`} style={{ color: '#f5a623', letterSpacing: 2 }}>{'★'.repeat(Math.min(5, Math.max(1, Number(item.rating) || 5)))}</div><p>“{item.quote}”</p><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{item.avatar && <img loading="lazy" src={item.avatar} alt={item.name || ''} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />}<div><strong>{item.name}</strong><div>{[item.role, item.company].filter(Boolean).join(' · ')}</div></div></div></blockquote>)}</div></section>
    case 'logos': return <section style={{ ...sectionStyle, textAlign: 'center' }}><h2>{props.title}</h2><div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, alignItems: 'center', justifyContent: 'center' }}>{(props.images ?? []).map((image, index) => {
      const logo = <img className={props.grayscale ? 'landing-logo-grayscale' : undefined} loading="lazy" src={image.url} alt={image.alt || ''} style={{ maxWidth: 160, height: Math.max(24, Number(props.logoHeight) || 64), objectFit: 'contain' }} />
      return image.link ? <a key={`${image.url}-${index}`} href={safeUrl(image.link)} target={image.openInNewTab ? '_blank' : undefined} rel={image.openInNewTab ? 'noopener noreferrer' : undefined} title={image.alt || undefined}>{logo}</a> : <span key={`${image.url}-${index}`} title={image.alt || undefined}>{logo}</span>
    })}</div></section>
    case 'stats': return <section style={{ ...sectionStyle, ...gridStyle, maxWidth: 'none', color: props.textColor || '#16161a', background: props.background || '#fff', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>{(props.items ?? []).map((item, index) => <AnimatedStat key={`${item.label}-${index}`} item={item} animate={Boolean(props.animate)} />)}</section>
    case 'map': {
      const mapUrl = safeUrl(props.embedUrl, '')
      return <section style={sectionStyle}><h2>{props.title}</h2><p>{props.address}</p>{mapUrl ? <iframe className="landing-map-frame" title={props.title || 'Bản đồ'} src={mapUrl} style={{ '--map-height': `${Math.max(220, Number(props.height) || 360)}px`, '--map-mobile-height': `${Math.max(180, Number(props.mobileHeight) || 260)}px`, width: '100%', border: 0 }} loading="lazy" /> : <div role="status" style={cardStyle}>Chưa có Google Maps embed URL hợp lệ.</div>}</section>
    }
    case 'social': {
      const socialIcons = { facebook: 'f', youtube: '▶', instagram: '◎', linkedin: 'in', tiktok: '♪', zalo: 'Z', other: '↗' }
      const socialColors = { facebook: '#1877f2', youtube: '#ff0000', instagram: '#c13584', linkedin: '#0a66c2', tiktok: '#111', zalo: '#0068ff', other: primaryColor }
      return <section style={{ ...sectionStyle, textAlign: 'center' }}><h2>{props.title}</h2><div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>{(props.links ?? []).map((link, index) => <a key={`${link.label}-${index}`} href={safeUrl(link.url)} target={link.openInNewTab ? '_blank' : undefined} rel={link.openInNewTab ? 'noopener noreferrer' : undefined} aria-label={link.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, color: '#fff', background: socialColors[link.platform] || primaryColor, textDecoration: 'none' }}><span aria-hidden="true">{socialIcons[link.platform] || '↗'}</span>{link.label}</a>)}</div></section>
    }
    case 'productList':
    case 'postList':
    case 'teamList': return <DataList props={props} type={section.type} />
    case 'countdown': return <Countdown props={props} />
    case 'popup': return <Popup props={props} blockId={section.id} />
    case 'tabs': return <InteractiveTabs items={props.items} variant={props.style} blockId={section.id} />
    case 'timeline': return <section className="landing-timeline" style={sectionStyle}><h2>{props.title}</h2><div style={{ position: 'relative' }}>{(props.items ?? []).map((item, index) => <div className="landing-timeline-item" key={`${item.time}-${index}`} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '120px 24px 1fr', gap: 12, padding: '0 0 26px' }}><strong>{item.time}</strong><span className="landing-timeline-dot" aria-hidden="true" style={{ position: 'relative', zIndex: 1, width: 14, height: 14, marginTop: 3, border: `3px solid ${primaryColor}`, borderRadius: '50%', background: '#fff' }} /><div><h3 style={{ margin: 0 }}>{item.title}</h3><p style={{ marginBottom: 0 }}>{item.description}</p></div>{index < (props.items?.length ?? 0) - 1 && <span className="landing-timeline-line" aria-hidden="true" style={{ position: 'absolute', top: 17, bottom: 0, left: 138, width: 2, background: '#dedee8' }} />}</div>)}</div></section>
    default: return null
  }
}

export const isExtendedBlock = type => new Set([
  'container', 'columns', 'richText', 'cta', 'contactForm', 'leadForm', 'video', 'gallery', 'faq',
  'testimonials', 'logos', 'stats', 'map', 'social', 'productList', 'postList', 'teamList', 'countdown',
  'popup', 'tabs', 'timeline', 'customHtml',
]).has(type)

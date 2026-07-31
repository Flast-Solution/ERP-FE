import { useEffect, useMemo, useState } from 'react'

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

const sanitizeHtml = value => {
  if (typeof window === 'undefined') return ''
  const doc = new window.DOMParser().parseFromString(String(value ?? ''), 'text/html')
  const allowedTags = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4', 'HR', 'I', 'LI', 'OL', 'P', 'PRE', 'SPAN', 'STRONG', 'U', 'UL'])
  const allowedAttrs = new Set(['href', 'target', 'rel', 'class'])
  Array.from(doc.body.querySelectorAll('*')).forEach(node => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes)
      return
    }
    Array.from(node.attributes).forEach(attribute => {
      if (!allowedAttrs.has(attribute.name.toLowerCase())) node.removeAttribute(attribute.name)
    })
    if (node.tagName === 'A') {
      node.setAttribute('href', safeUrl(node.getAttribute('href')))
      if (node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer')
    }
  })
  return doc.body.innerHTML
}

const FormPreview = ({ props, lead = false }) => (
  <section style={sectionStyle}>
    <div style={{ ...cardStyle, maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>{props.title}</h2>
      {(props.fields ?? []).map((field, index) => (
        <label key={`${field.name}-${index}`} style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 7 }}>
            {field.label}{field.required ? ' *' : ''}
          </span>
          {field.type === 'textarea'
            ? <textarea rows={4} placeholder={field.placeholder} style={{ width: '100%', padding: 11, border: '1px solid #ddd', borderRadius: 8 }} />
            : <input type={field.type || 'text'} placeholder={field.placeholder} style={{ width: '100%', padding: 11, border: '1px solid #ddd', borderRadius: 8 }} />
          }
        </label>
      ))}
      <button type="button" style={{ border: 0, borderRadius: 8, padding: '11px 20px', color: '#fff', background: '#6550d8', fontWeight: 650 }}>
        {props.submitText || (lead ? 'Đăng ký' : 'Gửi')}
      </button>
    </div>
  </section>
)

const Countdown = ({ props }) => {
  const targetTime = useMemo(() => new Date(props.targetDate).getTime(), [props.targetDate])
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
    <section style={{ ...sectionStyle, textAlign: 'center' }}>
      <h2>{remaining ? props.title : props.completedText}</h2>
      {remaining > 0 && <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(4, minmax(70px, 120px))', justifyContent: 'center' }}>
        {units.map(([label, value]) => <div key={label} style={cardStyle}><strong style={{ fontSize: 26 }}>{value}</strong><div>{label}</div></div>)}
      </div>}
    </section>
  )
}

const InteractiveTabs = ({ items = [] }) => {
  const [active, setActive] = useState(0)
  const safeActive = active < items.length ? active : 0
  return (
    <section style={sectionStyle}>
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #ddd' }}>
        {items.map((item, index) => <button type="button" key={`${item.label}-${index}`} onClick={() => setActive(index)} style={{ border: 0, borderBottom: index === safeActive ? '2px solid #6550d8' : '2px solid transparent', padding: 12, background: 'transparent', fontWeight: 650 }}>{item.label}</button>)}
      </div>
      <div style={{ padding: '22px 8px' }}>{items[safeActive]?.content}</div>
    </section>
  )
}

const Faq = ({ props }) => {
  const [open, setOpen] = useState(0)
  return <section style={sectionStyle}><h2>{props.title}</h2>{(props.items ?? []).map((item, index) => <div key={`${item.question}-${index}`} style={{ borderBottom: '1px solid #e8e8ee' }}><button type="button" onClick={() => setOpen(open === index ? -1 : index)} style={{ width: '100%', padding: '16px 0', border: 0, background: 'transparent', display: 'flex', justifyContent: 'space-between', fontWeight: 650, textAlign: 'left' }}>{item.question}<span>{open === index ? '−' : '+'}</span></button>{open === index && <p style={{ marginTop: 0, color: '#626272' }}>{item.answer}</p>}</div>)}</section>
}

const DataList = ({ props }) => (
  <section style={sectionStyle}>
    <h2>{props.title}</h2>{props.description && <p>{props.description}</p>}
    {(props.items ?? []).length ? <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>{props.items.map((item, index) => <a key={`${item.title}-${index}`} href={safeUrl(item.url)} style={{ ...cardStyle, color: 'inherit', textDecoration: 'none' }}>{item.imageUrl && <img src={item.imageUrl} alt={item.title || ''} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 9 }} />}<h3>{item.title}</h3><p>{item.description}</p></a>)}</div> : <p>{props.emptyText}</p>}
  </section>
)

export const ExtendedBlockRenderer = ({ section }) => {
  const props = section?.props ?? {}
  const html = useMemo(() => sanitizeHtml(props.html), [props.html])
  switch (section?.type) {
    case 'container': return <section style={{ ...sectionStyle, maxWidth: Number(props.maxWidth) || 1120, padding: Number(props.padding) || 32, background: props.background }}><h2>{props.title}</h2><p>{props.content}</p></section>
    case 'columns': return <section className="landing-responsive-columns" style={{ ...sectionStyle, display: 'flex', flexWrap: 'wrap', gap: Number(props.gap) || 20 }}>{(props.columns ?? []).map((column, index) => <div className="landing-responsive-column" key={`${column.title}-${index}`} style={{ ...cardStyle, flex: `1 1 calc(${Math.min(100, Math.max(10, Number(column.width) || 50))}% - ${Number(props.gap) || 20}px)` }}><h3>{column.title}</h3><p>{column.content}</p>{column.buttonText && <a href={safeUrl(column.buttonUrl)}>{column.buttonText}</a>}</div>)}</section>
    case 'richText':
    case 'customHtml': return <section style={sectionStyle} dangerouslySetInnerHTML={{ __html: html }} />
    case 'cta': return <section style={{ ...sectionStyle, maxWidth: 'none', textAlign: 'center', background: props.background }}><h2>{props.title}</h2><p>{props.description}</p><a href={safeUrl(props.buttonUrl)} target={props.buttonOpenInNewTab ? '_blank' : undefined} rel="noopener noreferrer" style={{ display: 'inline-block', padding: '11px 20px', borderRadius: 8, color: '#fff', background: '#6550d8', textDecoration: 'none' }}>{props.buttonText}</a></section>
    case 'contactForm': return <FormPreview props={props} />
    case 'leadForm': return <FormPreview props={props} lead />
    case 'video': return <section style={sectionStyle}><h2>{props.title}</h2>{props.url ? <iframe title={props.title || 'Video'} src={safeUrl(props.url, '')} allow={props.autoplay ? 'autoplay; fullscreen' : 'fullscreen'} style={{ width: '100%', border: 0, aspectRatio: props.aspectRatio || '16/9' }} /> : <div style={cardStyle}>Nhập URL video để xem trước.</div>}</section>
    case 'gallery': return <section style={sectionStyle}><h2>{props.title}</h2><div style={{ ...gridStyle, gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, Number(props.columns) || 3))}, 1fr)` }}>{(props.images ?? []).map((image, index) => <a href={safeUrl(image.link)} key={`${image.url}-${index}`}><img src={image.url} alt={image.alt || ''} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10 }} /></a>)}</div></section>
    case 'faq': return <Faq props={props} />
    case 'testimonials': return <section style={sectionStyle}><h2>{props.title}</h2><div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>{(props.items ?? []).map((item, index) => <blockquote key={`${item.name}-${index}`} style={{ ...cardStyle, margin: 0 }}>{item.avatar && <img src={item.avatar} alt={item.name || ''} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />}<p>“{item.quote}”</p><strong>{item.name}</strong><div>{item.role}</div></blockquote>)}</div></section>
    case 'logos': return <section style={{ ...sectionStyle, textAlign: 'center' }}><h2>{props.title}</h2><div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, alignItems: 'center', justifyContent: 'center' }}>{(props.images ?? []).map((image, index) => <img key={`${image.url}-${index}`} src={image.url} alt={image.alt || ''} style={{ maxWidth: 140, height: 64, objectFit: 'contain' }} />)}</div></section>
    case 'stats': return <section style={{ ...sectionStyle, ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>{(props.items ?? []).map((item, index) => <div key={`${item.label}-${index}`} style={{ ...cardStyle, textAlign: 'center' }}><strong style={{ fontSize: 30 }}>{item.value}</strong><div>{item.label}</div></div>)}</section>
    case 'map': return <section style={sectionStyle}><h2>{props.title}</h2><p>{props.address}</p>{props.embedUrl && <iframe title={props.title || 'Bản đồ'} src={safeUrl(props.embedUrl, '')} style={{ width: '100%', height: Math.max(220, Number(props.height) || 360), border: 0 }} loading="lazy" />}</section>
    case 'social': return <section style={{ ...sectionStyle, textAlign: 'center' }}><h2>{props.title}</h2><div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>{(props.links ?? []).map((link, index) => <a key={`${link.label}-${index}`} href={safeUrl(link.url)} style={{ ...cardStyle, padding: '9px 14px', color: 'inherit', textDecoration: 'none' }}>{link.label}</a>)}</div></section>
    case 'productList':
    case 'postList':
    case 'teamList': return <DataList props={props} />
    case 'countdown': return <Countdown props={props} />
    case 'popup': return <section style={sectionStyle}><div style={{ ...cardStyle, boxShadow: '0 12px 36px rgba(0,0,0,.12)', maxWidth: 520, margin: '0 auto' }}><small>POPUP · hiển thị sau {props.delay || 0}s</small><h2>{props.title}</h2><p>{props.content}</p><a href={safeUrl(props.buttonUrl)}>{props.buttonText}</a></div></section>
    case 'tabs': return <InteractiveTabs items={props.items} />
    case 'timeline': return <section style={sectionStyle}><h2>{props.title}</h2>{(props.items ?? []).map((item, index) => <div key={`${item.time}-${index}`} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 20, padding: '16px 0', borderBottom: '1px solid #e8e8ee' }}><strong>{item.time}</strong><div><h3 style={{ margin: 0 }}>{item.title}</h3><p>{item.description}</p></div></div>)}</section>
    default: return null
  }
}

export const isExtendedBlock = type => new Set([
  'container', 'columns', 'richText', 'cta', 'contactForm', 'leadForm', 'video', 'gallery', 'faq',
  'testimonials', 'logos', 'stats', 'map', 'social', 'productList', 'postList', 'teamList', 'countdown',
  'popup', 'tabs', 'timeline', 'customHtml',
]).has(type)

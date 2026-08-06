import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '@/store/editorStore'
import {
  Page, Nav, Brand, BrandLogo, NavLinks, CtaSm,
  NavActions,
  MobileMenuButton, MobileDrawerBackdrop, MobileDrawer, MobileDrawerHead,
  MobileDrawerLinks, MobileDrawerActions,
  BlockTitle,
  Hero, HeroMedia, HeroOverlay, HeroContent, HeroInner, HeroVisual,
  Eyebrow, HeroTitle, HeroDesc, HeroActions, CtaPrimary, CtaGhost,
  FeaturesGrid, FeatCard, FeatIcon, FeatTitle, FeatDesc,
  FeatImage, FeatCta,
  Pricing, PriceHead, Plans, Plan, PlanTag, PlanName, PlanPrice, PlanSub,
  PlanMedia, PlanIcon,
  PlanCtaPrimary, PlanCtaGhost, PlanBenefits, PlanCycle,
  Footer, FooterMain, FooterBrand, FooterLogo, FooterColumns, FooterColumn,
  FooterSocial, FooterBottom,
  ContentBlock, ContentHeading, ContentText, ContentImage, ImageCaption,
  ContentButtonWrap, ContentButton, DividerBlock, SpacerBlock, UnknownBlock,
  Banner, BannerTrack, BannerSlide, BannerEmpty, BannerArrow, BannerDots, BannerDot,
  BannerTicker, BannerTickerTrack, BannerTickerGroup, BannerTickerItem,
} from './PreviewCanvas.style'
import { EditableHighlight } from './EditableHighlight'
import { ExtendedBlockRenderer, isExtendedBlock, sanitizeHtml } from './ExtendedBlockRenderer'
import { getLandingOverlayRoot } from './landingOverlayRoot'
import { CustomJsxBlockRenderer } from './CustomJsxBlockRenderer'
import { CUSTOM_JSX_TYPE } from './customJsx'
import { useWebData } from './WebDataContext'
import { matchLandingRoute } from './landingRoutes'

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
  </svg>
)

const BlockIcon = ({ name = 'bolt' }) => {
  if (name === 'none') return null
  if (name === 'check') return <span>✓</span>
  if (name === 'star') return <span>★</span>
  if (name === 'heart') return <span>♥</span>
  return <BoltIcon />
}

const BUTTON_ICONS = {
  arrow: '→',
  download: '↓',
  phone: '☎',
  email: '✉',
}

const formatPlanPrice = (price, currency) => {
  const value = String(price ?? '')
  const unit = String(currency ?? '')
  return unit && value && !value.includes(unit) ? `${value}${unit}` : value
}

const normalizeAnchorId = value => String(value ?? '')
  .trim()
  .replace(/^#/, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')

const getSectionBackgroundImage = props => {
  const layers = []
  if (props.sectionBackgroundPattern === 'woven') {
    layers.push('repeating-linear-gradient(45deg, rgba(35,45,75,.055) 0 2px, transparent 2px 14px)', 'repeating-linear-gradient(-45deg, rgba(35,45,75,.055) 0 2px, transparent 2px 14px)')
  } else if (props.sectionBackgroundPattern === 'grid') {
    layers.push('linear-gradient(rgba(35,45,75,.06) 1px, transparent 1px)', 'linear-gradient(90deg, rgba(35,45,75,.06) 1px, transparent 1px)')
  } else if (props.sectionBackgroundPattern === 'dots') {
    layers.push('radial-gradient(circle, rgba(35,45,75,.12) 1px, transparent 1.5px)')
  }
  if (props.sectionBackgroundImage) layers.push(`url("${String(props.sectionBackgroundImage).replace(/"/g, '%22')}")`)
  return layers.length ? layers.join(', ') : undefined
}

const getSectionPresentation = (props, theme) => {
  const maxWidth = Number(props.sectionMaxWidth) || 0
  const desktopPadding = Math.max(0, Number(props.sectionPaddingDesktop) || 0)
  const mobilePadding = Math.max(0, Number(props.sectionPaddingMobile) || 0)
  return {
    className: [
      'landing-section-shell',
      props.hideOnDesktop && 'landing-hide-desktop',
      props.hideOnMobile && 'landing-hide-mobile',
    ].filter(Boolean).join(' '),
    style: {
      '--section-padding-desktop': `${desktopPadding}px`,
      '--section-padding-mobile': `${mobilePadding}px`,
      maxWidth: maxWidth > 0 ? `${maxWidth}px` : undefined,
      marginRight: maxWidth > 0 ? 'auto' : undefined,
      marginLeft: maxWidth > 0 ? 'auto' : undefined,
      color: props.sectionTextColor || undefined,
      backgroundColor: props.sectionBackground || undefined,
      backgroundImage: getSectionBackgroundImage(props),
      backgroundPosition: props.sectionBackgroundImage ? 'center' : undefined,
      backgroundSize: props.sectionBackgroundImage ? 'cover' : props.sectionBackgroundPattern === 'dots' ? '14px 14px' : props.sectionBackgroundPattern === 'grid' ? '24px 24px' : undefined,
      borderRadius: maxWidth > 0 ? `${Math.max(0, Number(theme?.borderRadius) || 0)}px` : undefined,
    },
    animation: props.entranceAnimation || 'none',
  }
}

const nestedBoxShadows = {
  none: 'none',
  soft: '0 8px 24px rgba(20, 20, 30, .08)',
  medium: '0 14px 36px rgba(20, 20, 30, .14)',
  strong: '0 20px 52px rgba(20, 20, 30, .22)',
}

const nestedBoxNumber = (value, fallback = 0) => {
  if (value == null || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getNestedBlockStyle = props => {
  const borderWidth = Math.max(0, nestedBoxNumber(props.boxBorderWidth, 0))
  return {
    boxSizing: 'border-box',
    height: props.fillContainer ? '100%' : undefined,
    marginTop: `${Math.max(0, nestedBoxNumber(props.boxMarginTop, 0))}px`,
    marginRight: `${Math.max(0, nestedBoxNumber(props.boxMarginRight, 0))}px`,
    marginBottom: `${Math.max(0, nestedBoxNumber(props.boxMarginBottom, 0))}px`,
    marginLeft: `${Math.max(0, nestedBoxNumber(props.boxMarginLeft, 0))}px`,
    paddingTop: `${Math.max(0, nestedBoxNumber(props.boxPaddingTop, 0))}px`,
    paddingRight: `${Math.max(0, nestedBoxNumber(props.boxPaddingRight, 0))}px`,
    paddingBottom: `${Math.max(0, nestedBoxNumber(props.boxPaddingBottom, 0))}px`,
    paddingLeft: `${Math.max(0, nestedBoxNumber(props.boxPaddingLeft, 0))}px`,
    background: props.boxBackground || 'transparent',
    border: borderWidth > 0
      ? `${borderWidth}px ${props.boxBorderStyle || 'solid'} ${props.boxBorderColor || '#e8e8ee'}`
      : 'none',
    borderRadius: `${Math.max(0, nestedBoxNumber(props.boxBorderRadius, 0))}px`,
    boxShadow: nestedBoxShadows[props.boxShadow] || 'none',
  }
}

const renderNestedBlockFrame = (section, primaryColor) => (
  <div className="landing-nested-block" style={getNestedBlockStyle(section?.props ?? {})}>
    {renderBlock(section, primaryColor)}
  </div>
)

const NavbarBlock = ({ props, primaryColor, menuId = 'navbar' }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const drawerRef = useRef(null)
  const actions = props.actions?.length
    ? props.actions
    : (props.buttonText ? [{ label: props.buttonText, url: '#' }] : [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const menuButton = menuButtonRef.current
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusableElements = () => Array.from(drawerRef.current?.querySelectorAll(focusableSelector) ?? [])
    const focusTimer = window.requestAnimationFrame(() => focusableElements()[0]?.focus())

    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const elements = focusableElements()
      if (!elements.length) {
        event.preventDefault()
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusTimer)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      menuButton?.focus()
    }
  }, [menuOpen])

  const brandTarget = props.brandOpenInNewTab ? '_blank' : undefined
  const brandRel = props.brandOpenInNewTab ? 'noopener noreferrer' : undefined
  const navBackground = props.backgroundColor || '#ffffff'
  const navTextColor = props.textColor || '#16161a'

  const brand = (
    <Brand
      as="a"
      href={props.brandUrl || '#'}
      target={brandTarget}
      rel={brandRel}
      aria-label={props.logoAlt || props.brandName || 'Trang chủ'}
    >
      <BrandLogo style={{ background: props.logoUrl ? 'transparent' : primaryColor }}>
        {props.logoUrl
          ? <img src={props.logoUrl} alt={props.logoAlt || props.brandName || 'Logo'} />
          : <BoltIcon />
        }
      </BrandLogo>
      {props.brandName}
    </Brand>
  )

  const portalTarget = getLandingOverlayRoot()
  const mobileMenu = (
    <>
      <MobileDrawerBackdrop
        type="button"
        aria-label="Đóng menu"
        data-mobile-menu-backdrop="true"
        data-mobile-menu-id={menuId}
        data-open={menuOpen ? 'true' : 'false'}
        hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <MobileDrawer
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        aria-hidden={!menuOpen}
        data-mobile-menu-drawer="true"
        data-mobile-menu-id={menuId}
        data-open={menuOpen ? 'true' : 'false'}
        hidden={!menuOpen}
        style={{ background: navBackground, color: navTextColor }}
      >
        <MobileDrawerHead>
          {brand}
          <button
            type="button"
            aria-label="Đóng menu"
            data-mobile-menu-close="true"
            style={{ color: navTextColor }}
            onClick={() => setMenuOpen(false)}
          >×</button>
        </MobileDrawerHead>
        <MobileDrawerLinks style={{ color: navTextColor }}>
          {(props.links ?? []).map((link, index) => (
            <a href={link.url || '#'} key={`${link.label}-mobile-${index}`} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </MobileDrawerLinks>
        <MobileDrawerActions>
          {actions.map((action, index) => (
            <a
              key={`${action.label}-mobile-${index}`}
              href={action.url || '#'}
              target={action.openInNewTab ? '_blank' : undefined}
              rel={action.openInNewTab ? 'noopener noreferrer' : undefined}
              style={{ background: primaryColor }}
              onClick={() => setMenuOpen(false)}
            >
              {action.label}
            </a>
          ))}
        </MobileDrawerActions>
      </MobileDrawer>
    </>
  )

  return (
    <>
      <Nav
        data-landing-navbar="true"
        data-mobile-menu-id={menuId}
        $sticky={Boolean(props.sticky)}
        style={{ background: navBackground, color: navTextColor }}
      >
        {brand}
        <NavLinks className="landing-desktop-nav" style={{ color: navTextColor }}>
          {(props.links ?? []).map((link, index) => (
            <a href={link.url || '#'} key={`${link.label}-${index}`}>{link.label}</a>
          ))}
        </NavLinks>
        <NavActions className="landing-desktop-nav">
          {actions.map((action, index) => (
            <CtaSm
              as="a"
              key={`${action.label}-${index}`}
              href={action.url || '#'}
              target={action.openInNewTab ? '_blank' : undefined}
              rel={action.openInNewTab ? 'noopener noreferrer' : undefined}
            >
              {action.label}
            </CtaSm>
          ))}
        </NavActions>
        <MobileMenuButton
          ref={menuButtonRef}
          className="landing-mobile-menu-button"
          data-mobile-menu-trigger="true"
          data-mobile-menu-id={menuId}
          type="button"
          aria-label="Mở menu"
          aria-expanded={menuOpen}
          style={{ background: navBackground, color: navTextColor }}
          onClick={() => setMenuOpen(true)}
        >
          <span />
        </MobileMenuButton>
      </Nav>
      {portalTarget ? createPortal(mobileMenu, portalTarget) : mobileMenu}
    </>
  )
}

const BannerSlider = ({ props }) => {
  const images = Array.isArray(props.images) ? props.images : []
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartRef = useRef(null)
  const intervalMs = Math.max(2, Number(props.interval) || 5) * 1000

  useEffect(() => {
    if (current < images.length) return
    setCurrent(0)
  }, [current, images.length])

  useEffect(() => {
    if (!props.autoplay || paused || images.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setCurrent(index => (index + 1) % images.length)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [images.length, intervalMs, paused, props.autoplay])

  if (props.displayMode === 'ticker') {
    const announcements = Array.isArray(props.announcements)
      ? props.announcements.filter(item => String(item?.text ?? '').trim())
      : []
    const renderGroup = group => (
      <BannerTickerGroup aria-hidden={group === 'duplicate'} key={group}>
        {announcements.map((item, index) => (
          <BannerTickerItem
            as={item.url ? 'a' : 'span'}
            href={item.url || undefined}
            key={`${group}-${item.text}-${index}`}
          >
            <span>{item.text}</span>
            <b aria-hidden="true">{props.tickerSeparator || '◆'}</b>
          </BannerTickerItem>
        ))}
      </BannerTickerGroup>
    )

    return (
      <BannerTicker
        data-banner-ticker="true"
        data-pause-on-hover={Boolean(props.pauseOnHover)}
        style={{
          '--ticker-duration': `${Math.max(5, Number(props.tickerSpeed) || 28)}s`,
          '--ticker-direction': props.tickerDirection === 'ltr' ? 'reverse' : 'normal',
          '--ticker-background': props.tickerBackground || '#232D4B',
          '--ticker-color': props.tickerTextColor || '#FAF7EF',
          '--ticker-accent': props.tickerAccentColor || '#D9A441',
        }}
      >
        {announcements.length
          ? <BannerTickerTrack>{renderGroup('primary')}{renderGroup('duplicate')}</BannerTickerTrack>
          : <span>Thêm nội dung để hiển thị dòng chữ chạy.</span>
        }
      </BannerTicker>
    )
  }

  if (!images.length) {
    return (
      <BannerEmpty
        className="landing-banner"
        style={{
          '--banner-height': `${Math.max(180, Number(props.height) || 420)}px`,
          '--banner-mobile-height': `${Math.max(160, Number(props.mobileHeight) || 280)}px`,
        }}
      >
        Tải ảnh lên để tạo banner slide
      </BannerEmpty>
    )
  }

  const goTo = index => {
    const total = images.length
    setCurrent((index + total) % total)
  }

  return (
    <Banner
      className="landing-banner"
      data-banner="true"
      data-autoplay={Boolean(props.autoplay)}
      data-pause-on-hover={Boolean(props.pauseOnHover)}
      data-interval={Math.max(2, Number(props.interval) || 5) * 1000}
      style={{
        '--banner-height': `${Math.max(180, Number(props.height) || 420)}px`,
        '--banner-mobile-height': `${Math.max(160, Number(props.mobileHeight) || 280)}px`,
      }}
      onMouseEnter={() => props.pauseOnHover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={event => { touchStartRef.current = event.touches[0]?.clientX ?? null }}
      onTouchEnd={event => {
        const startX = touchStartRef.current
        const endX = event.changedTouches[0]?.clientX
        touchStartRef.current = null
        if (startX == null || endX == null || Math.abs(startX - endX) < 40) return
        goTo(current + (startX > endX ? 1 : -1))
      }}
    >
      <BannerTrack style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((image, index) => (
          <BannerSlide
            as={image.link ? 'a' : 'div'}
            key={`${image.url}-${index}`}
            href={image.link || undefined}
            target={image.openInNewTab ? '_blank' : undefined}
            rel={image.openInNewTab ? 'noopener noreferrer' : undefined}
          >
            <img
              src={image.url}
              alt={image.alt || `Banner ${index + 1}`}
              loading="lazy"
              style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
            />
          </BannerSlide>
        ))}
      </BannerTrack>
      {images.length > 1 && (
        <>
          <BannerArrow data-banner-prev="true" type="button" $left onClick={() => goTo(current - 1)} aria-label="Slide trước">
            ‹
          </BannerArrow>
          <BannerArrow data-banner-next="true" type="button" onClick={() => goTo(current + 1)} aria-label="Slide tiếp theo">
            ›
          </BannerArrow>
          {props.showDots && (
            <BannerDots>
              {images.map((image, index) => (
                <BannerDot
                  type="button"
                  data-banner-dot={index}
                  key={`${image.url}-dot-${index}`}
                  $active={index === current}
                  onClick={() => goTo(index)}
                  aria-label={`Đi tới slide ${index + 1}`}
                />
              ))}
            </BannerDots>
          )}
        </>
      )}
    </Banner>
  )
}

const renderBlock = (section, primaryColor) => {
  const props = section?.props ?? {}

  switch (section?.type) {
    case CUSTOM_JSX_TYPE:
      return <CustomJsxBlockRenderer section={section} />

    case 'breadcrumb':
      return (
        <nav
          aria-label="Breadcrumb"
          style={{
            padding: '14px 24px',
            background: props.background || 'transparent',
            color: props.textColor || primaryColor,
            textAlign: props.align || 'left',
          }}
        >
          {(props.items ?? []).map((item, index) => (
            <span key={item.id || `${item.text}-${index}`}>
              {index > 0 && (
                <span aria-hidden="true" style={{ margin: '0 8px', opacity: .55 }}>
                  {props.separator || '/'}
                </span>
              )}
              <a href={item.url || '#'} style={{ color: 'inherit' }}>{item.text}</a>
            </span>
          ))}
        </nav>
      )

    case 'navbar':
      return <NavbarBlock props={props} primaryColor={primaryColor} menuId={section.id || 'navbar'} />

    case 'hero': {
      const heroLayout = ['left', 'center', 'right'].includes(props.layout) ? props.layout : 'center'
      const backgroundType = props.backgroundType || 'color'
      const hasBackgroundImage = backgroundType === 'image' && Boolean(props.backgroundImageUrl)
      const hasBackgroundVideo = backgroundType === 'video' && Boolean(props.backgroundVideoUrl)
      const overlayOpacity = Math.min(100, Math.max(0, Number(props.overlayOpacity) || 0)) / 100
      const visualBlocks = props.visualBlocks ?? []
      const splitLayout = Boolean(props.splitLayout)

      return (
        <Hero
          className="landing-hero"
          $bg={props.background}
          data-layout={heroLayout}
          style={{
            '--hero-min-height': `${Math.max(240, Number(props.minHeight) || 520)}px`,
            '--hero-mobile-min-height': `${Math.max(240, Number(props.mobileMinHeight) || 420)}px`,
            '--hero-title-size': `${Math.max(20, Number(props.titleFontSize) || 48)}px`,
            '--hero-mobile-title-size': `${Math.max(20, Number(props.mobileTitleFontSize) || 36)}px`,
            '--hero-description-size': `${Math.max(12, Number(props.descriptionFontSize) || 18)}px`,
            '--hero-mobile-description-size': `${Math.max(12, Number(props.mobileDescriptionFontSize) || 16)}px`,
            '--hero-text-color': props.textColor || '#16161a',
          }}
        >
          {(hasBackgroundImage || hasBackgroundVideo) && (
            <HeroMedia aria-hidden="true">
              {hasBackgroundVideo
                ? (
                  <video
                    src={props.backgroundVideoUrl}
                    poster={props.backgroundImageUrl || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                )
                : <img src={props.backgroundImageUrl} alt="" />
              }
            </HeroMedia>
          )}
          {(hasBackgroundImage || hasBackgroundVideo) && overlayOpacity > 0 && (
            <HeroOverlay
              aria-hidden="true"
              style={{ background: props.overlayColor || '#000000', opacity: overlayOpacity }}
            />
          )}
          <HeroInner data-split={splitLayout ? 'true' : 'false'} data-visual-position={props.visualPosition || 'right'}>
            <HeroContent className="landing-hero-content">
              {props.eyebrow?.trim() && (
                <Eyebrow style={{ color: props.textColor || primaryColor }}>{props.eyebrow}</Eyebrow>
              )}
              {props.title?.trim() && <HeroTitle>{props.title}</HeroTitle>}
              {props.description?.trim() && <HeroDesc>{props.description}</HeroDesc>}
              <HeroActions data-hero-actions="true">
                {props.primaryButtonText && (
                  <CtaPrimary
                    as="a"
                    href={props.primaryButtonUrl || '#'}
                    target={props.primaryButtonOpenInNewTab ? '_blank' : undefined}
                    rel={props.primaryButtonOpenInNewTab ? 'noopener noreferrer' : undefined}
                    style={{ background: primaryColor }}
                  >
                    {props.primaryButtonText}
                  </CtaPrimary>
                )}
                {props.secondaryButtonText && (
                  <CtaGhost
                    as="a"
                    href={props.secondaryButtonUrl || '#'}
                    target={props.secondaryButtonOpenInNewTab ? '_blank' : undefined}
                    rel={props.secondaryButtonOpenInNewTab ? 'noopener noreferrer' : undefined}
                  >
                    {props.secondaryButtonText}
                  </CtaGhost>
                )}
              </HeroActions>
            </HeroContent>
            {splitLayout && (
              <HeroVisual className="landing-hero-visual" aria-hidden={visualBlocks.length === 0}>
                {visualBlocks.map(child => (
                  <div key={child.id}>{renderNestedBlockFrame(child, primaryColor)}</div>
                ))}
              </HeroVisual>
            )}
          </HeroInner>
        </Hero>
      )
    }

    case 'bannerSlider':
      return <BannerSlider props={props} />

    case 'heading': {
      if (!String(props.text ?? '').trim()) return null
      const tag = ['h1', 'h2', 'h3'].includes(props.level) ? props.level : 'h2'
      return (
        <ContentBlock
          className="landing-heading-block"
          style={{
            '--heading-size': `${Math.max(12, Number(props.fontSize) || 36)}px`,
            '--heading-mobile-size': `${Math.max(12, Number(props.mobileFontSize) || 28)}px`,
            '--heading-max-width': `${Math.max(120, Number(props.maxWidth) || 1120)}px`,
            '--heading-margin-top': `${Math.max(0, Number(props.marginTop) || 0)}px`,
            '--heading-margin-bottom': `${Math.max(0, Number(props.marginBottom) || 0)}px`,
          }}
        >
          <ContentHeading
            as={tag}
            $align={props.align}
            style={{ color: props.color || '#16161a', fontWeight: Number(props.fontWeight) || 700 }}
          >{props.text}</ContentHeading>
        </ContentBlock>
      )
    }

    case 'text': {
      if (!String(props.text ?? '').replace(/<[^>]*>/g, '').trim()) return null
      return (
        <ContentBlock>
          <ContentText
            as="div"
            $align={props.align}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.text) }}
          />
        </ContentBlock>
      )
    }

    case 'image': {
      const fillContainer = Boolean(props.fillContainer)
      const image = (
        <ContentImage
          className="landing-content-image"
          src={props.src}
          alt={props.alt || ''}
          loading={props.lazyLoad === false ? 'eager' : 'lazy'}
          style={{
            borderRadius: `${Number(props.radius) || 0}px`,
            aspectRatio: props.aspectRatio === 'auto' ? 'auto' : (props.aspectRatio || 'auto'),
            objectFit: props.objectFit || 'cover',
            objectPosition: `${props.focalX ?? 50}% ${props.focalY ?? 50}%`,
            flex: fillContainer ? '1 1 auto' : undefined,
            height: fillContainer ? '100%' : undefined,
            minHeight: fillContainer ? 0 : undefined,
            maxHeight: fillContainer ? 'none' : undefined,
            '--image-width': `${Math.min(100, Math.max(5, Number(props.width) || 100))}%`,
            '--image-mobile-width': `${Math.min(100, Math.max(5, Number(props.mobileWidth) || 100))}%`,
          }}
        />
      )
      return (
        <ContentBlock
          className={fillContainer ? 'landing-image-fill-container' : undefined}
          style={fillContainer ? { display: 'flex', flexDirection: 'column', height: '100%', padding: 0 } : undefined}
        >
          {props.link
            ? <a href={props.link} target={props.openInNewTab ? '_blank' : undefined} rel={props.openInNewTab ? 'noopener noreferrer' : undefined}>{image}</a>
            : image
          }
          {props.caption && (
            <ImageCaption
              style={{
                color: props.captionColor || '#8a8a96',
                background: props.captionBackground || 'transparent',
              }}
            >
              {props.caption}
            </ImageCaption>
          )}
        </ContentBlock>
      )
    }

    case 'button': {
      const buttonIcon = BUTTON_ICONS[props.icon]
      const sizes = {
        small: '8px 14px', medium: '11px 20px', large: '14px 26px',
      }
      const isLink = props.style === 'link'
      const isSecondary = props.style === 'secondary'
      return (
        <ContentButtonWrap $align={props.align}>
          <ContentButton
            className={props.fullWidthMobile ? 'landing-button-full-mobile' : undefined}
            href={props.disabled ? undefined : (props.url || '#')}
            aria-disabled={Boolean(props.disabled)}
            tabIndex={props.disabled ? -1 : undefined}
            style={{
              padding: sizes[props.size] || sizes.medium,
              background: isLink ? 'transparent' : (isSecondary ? 'transparent' : (props.color || primaryColor)),
              border: isSecondary ? `1px solid ${props.color || primaryColor}` : '1px solid transparent',
              color: props.textColor || (isLink || isSecondary ? (props.color || primaryColor) : '#ffffff'),
              opacity: props.disabled ? 0.5 : 1,
              pointerEvents: props.disabled ? 'none' : undefined,
            }}
            target={props.openInNewTab ? '_blank' : undefined}
            rel={props.openInNewTab ? 'noopener noreferrer' : undefined}
          >
            {buttonIcon && props.iconPosition !== 'right' && <span aria-hidden="true">{buttonIcon}</span>}
            {props.text}
            {buttonIcon && props.iconPosition === 'right' && <span aria-hidden="true">{buttonIcon}</span>}
          </ContentButton>
        </ContentButtonWrap>
      )
    }

    case 'features':
      return (
        <FeaturesGrid
          className="landing-features-grid"
          style={{
            '--features-columns': Math.max(1, Math.min(6, Number(props.desktopColumns) || 3)),
            '--features-tablet-columns': Math.max(1, Math.min(4, Number(props.tabletColumns) || 2)),
            '--features-mobile-columns': Math.max(1, Math.min(2, Number(props.mobileColumns) || 1)),
          }}
        >
          {(props.items ?? []).map((item, index) => (
            <FeatCard
              key={`${item.title}-${index}`}
              data-hover={props.hoverStyle || 'lift'}
              style={{ background: props.cardBackground || '#ffffff' }}
            >
              {item.imageUrl ? (
                <FeatImage src={item.imageUrl} alt={item.title || `Tính năng ${index + 1}`} />
              ) : item.icon !== 'none' && (
                <FeatIcon style={{ color: primaryColor }}>
                  <BlockIcon name={item.icon || 'bolt'} />
                </FeatIcon>
              )}
              <FeatTitle>{item.title}</FeatTitle>
              <FeatDesc>{item.description}</FeatDesc>
              {props.showButtons !== false && item.buttonText && (
                <FeatCta
                  href={item.buttonUrl || '#'}
                  target={item.buttonOpenInNewTab ? '_blank' : undefined}
                  rel={item.buttonOpenInNewTab ? 'noopener noreferrer' : undefined}
                  style={{ color: primaryColor }}
                >
                  {item.buttonText} →
                </FeatCta>
              )}
            </FeatCard>
          ))}
        </FeaturesGrid>
      )

    case 'pricing':
      return (
        <Pricing
          className="landing-pricing"
          $radius={props.borderRadius}
          style={{
            background: props.background || '#0e0e10',
            color: props.textColor || '#ffffff',
            '--pricing-columns': Math.max(1, Math.min(5, Number(props.columns) || 3)),
            ...(props.textColor
              ? { '--pricing-desc-color': props.textColor, '--pricing-desc-opacity': '0.72' }
              : {}),
          }}
        >
          <PriceHead>
            <h2>{props.title}</h2>
            <p>{props.description}</p>
          </PriceHead>
          <Plans className="landing-pricing-plans">
            {(props.plans ?? []).map((plan, index) => {
              const accent = plan.accentColor || primaryColor
              const buttonBackground = plan.buttonBackground || (plan.featured ? accent : undefined)
              const buttonTextColor = plan.buttonTextColor || (buttonBackground ? '#ffffff' : undefined)
              const planStyle = {
                ...(plan.background ? { background: plan.background } : {}),
                ...(plan.textColor ? { color: plan.textColor } : {}),
                ...(plan.borderColor ? { borderColor: plan.borderColor } : {}),
                ...(plan.mutedColor || plan.textColor
                  ? {
                    '--plan-muted': plan.mutedColor || plan.textColor,
                    '--plan-name-color': plan.mutedColor || plan.textColor,
                  }
                  : {}),
              }
              const buttonStyle = {
                ...(buttonBackground ? { background: buttonBackground, borderColor: buttonBackground } : {}),
                ...(buttonTextColor ? { color: buttonTextColor } : {}),
                ...(!plan.featured && !plan.buttonBackground && (plan.borderColor || plan.textColor)
                  ? { borderColor: plan.borderColor || plan.textColor, color: plan.textColor || undefined }
                  : {}),
              }

              return (
                <Plan key={`${plan.name}-${index}`} $hot={plan.featured} style={planStyle}>
                  {plan.featured && <PlanTag style={{ background: accent }}>Phổ biến</PlanTag>}
                  {plan.imageUrl ? (
                    <PlanMedia src={plan.imageUrl} alt={plan.name || `Gói ${index + 1}`} />
                  ) : plan.icon && plan.icon !== 'none' ? (
                    <PlanIcon style={{ color: accent, background: `${accent}22` }}>
                      <BlockIcon name={plan.icon} />
                    </PlanIcon>
                  ) : null}
                  <PlanName>{plan.name}</PlanName>
                  <div>
                    <PlanPrice>{formatPlanPrice(plan.price, props.currency)}</PlanPrice>
                    <PlanCycle>{props.billingCycle}</PlanCycle>
                  </div>
                  <PlanSub>{plan.description}</PlanSub>
                  <PlanBenefits>
                    {(plan.benefits ?? []).map((benefit, benefitIndex) => (
                      <li key={`${benefit.text}-${benefitIndex}`}>✓ {benefit.text}</li>
                    ))}
                  </PlanBenefits>
                  {plan.featured
                    ? (
                      <PlanCtaPrimary
                        as="a"
                        href={plan.buttonUrl || '#'}
                        target={plan.buttonOpenInNewTab ? '_blank' : undefined}
                        rel={plan.buttonOpenInNewTab ? 'noopener noreferrer' : undefined}
                        style={buttonStyle}
                      >
                        {plan.buttonText || 'Chọn gói'}
                      </PlanCtaPrimary>
                    )
                    : (
                      <PlanCtaGhost
                        as="a"
                        href={plan.buttonUrl || '#'}
                        target={plan.buttonOpenInNewTab ? '_blank' : undefined}
                        rel={plan.buttonOpenInNewTab ? 'noopener noreferrer' : undefined}
                        style={buttonStyle}
                      >
                        {plan.buttonText || 'Chọn gói'}
                      </PlanCtaGhost>
                    )
                  }
                </Plan>
              )
            })}
          </Plans>
        </Pricing>
      )

    case 'divider':
      return (
        <ContentBlock
          className="landing-divider-editor-zone"
          style={{
            '--divider-space-top': `${Math.max(0, Number(props.spaceTop ?? 22) || 0)}px`,
            '--divider-space-bottom': `${Math.max(0, Number(props.spaceBottom ?? 22) || 0)}px`,
            '--divider-space-left': `${Math.max(0, Number(props.spaceLeft ?? 32) || 0)}px`,
            '--divider-space-right': `${Math.max(0, Number(props.spaceRight ?? 32) || 0)}px`,
            '--divider-mobile-space-top': `${Math.max(0, Number(props.mobileSpaceTop ?? 16) || 0)}px`,
            '--divider-mobile-space-bottom': `${Math.max(0, Number(props.mobileSpaceBottom ?? 16) || 0)}px`,
            '--divider-mobile-space-left': `${Math.max(0, Number(props.mobileSpaceLeft ?? 16) || 0)}px`,
            '--divider-mobile-space-right': `${Math.max(0, Number(props.mobileSpaceRight ?? 16) || 0)}px`,
          }}
        >
          <DividerBlock
            aria-label="Đường phân cách"
            style={{
              borderColor: props.color,
              width: `${Math.min(100, Math.max(1, Number(props.width) || 100))}%`,
            }}
          />
        </ContentBlock>
      )

    case 'spacer':
      return (
        <SpacerBlock style={{ height: `${Math.max(8, Number(props.height) || 48)}px` }}>
          <span data-landing-editor-only="true">Khoảng trống · {Math.max(8, Number(props.height) || 48)}px</span>
        </SpacerBlock>
      )

    case 'footer':
      return (
        <Footer style={{ background: props.background || '#111827', color: props.textColor || '#ffffff' }}>
          <FooterMain>
            <FooterBrand>
              {props.logoUrl && <FooterLogo src={props.logoUrl} alt={props.brandName || 'Logo'} loading="lazy" />}
              <strong>{props.brandName}</strong>
              {props.description && <p>{props.description}</p>}
              {props.businessInfo && <p>{props.businessInfo}</p>}
            </FooterBrand>
            <FooterColumns>
              {(props.columns ?? []).map((column, index) => (
                <FooterColumn key={`${column.title}-${index}`}>
                  <strong>{column.title}</strong>
                  {(column.links ?? []).map((link, linkIndex) => (
                    <a key={`${link.label}-${linkIndex}`} href={link.url || '#'} target={link.openInNewTab ? '_blank' : undefined} rel={link.openInNewTab ? 'noopener noreferrer' : undefined}>{link.label}</a>
                  ))}
                </FooterColumn>
              ))}
            </FooterColumns>
          </FooterMain>
          <FooterBottom>
            <span>{props.text}</span>
            <FooterSocial>
              {(props.socialLinks ?? []).map((link, index) => (
                <a key={`${link.label}-${index}`} href={link.url || '#'} target={link.openInNewTab ? '_blank' : undefined} rel={link.openInNewTab ? 'noopener noreferrer' : undefined}>{link.label}</a>
              ))}
            </FooterSocial>
          </FooterBottom>
        </Footer>
      )

    default:
      if (isExtendedBlock(section?.type)) {
        return (
          <ExtendedBlockRenderer
            section={section}
            primaryColor={primaryColor}
            renderNestedBlock={child => renderNestedBlockFrame(child, primaryColor)}
          />
        )
      }
      return <UnknownBlock>Không hỗ trợ block “{section?.type}”</UnknownBlock>
  }
}

export function PreviewCanvas({ schema: providedSchema, mode: providedMode } = {}) {
  const runtime = useWebData()
  const selected = useEditorStore((state) => state.selected)
  const editorSchema = useEditorStore((state) => state.draftSchema)
  const device = useEditorStore((state) => state.device)
  const editorViewMode = useEditorStore((state) => state.viewMode)
  const openEdit = useEditorStore((state) => state.openEdit)
  const schema = providedSchema || editorSchema
  const viewMode = providedMode || editorViewMode
  const primaryColor = schema?.theme?.primaryColor

  useEffect(() => {
    const url = String(schema?.theme?.fontStylesheetUrl ?? '').trim()
    const id = 'landing-editor-font-stylesheet'
    let link = document.getElementById(id)
    if (!url) {
      link?.remove()
      return undefined
    }
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = url
    return undefined
  }, [schema?.theme?.fontStylesheetUrl])

  return (
    <Page
      className="patch-light"
      data-landing-preview="true"
      data-device={device}
      style={{
        fontFamily: schema?.theme?.fontFamily,
        color: schema?.theme?.textColor || '#16161a',
        background: schema?.theme?.surfaceColor || '#ffffff',
        '--landing-primary': primaryColor || '#7c5cff',
        '--landing-font': schema?.theme?.fontFamily || 'Inter, sans-serif',
        '--landing-secondary': schema?.theme?.secondaryColor || '#d9a441',
        '--landing-surface': schema?.theme?.surfaceColor || '#ffffff',
        '--landing-surface-alt': schema?.theme?.surfaceAltColor || '#f7f5ff',
        '--landing-text': schema?.theme?.textColor || '#16161a',
        '--landing-muted': schema?.theme?.mutedColor || '#6f6f82',
        '--landing-display-font': schema?.theme?.displayFontFamily || schema?.theme?.fontFamily,
        '--landing-mono-font': schema?.theme?.monoFontFamily || 'monospace',
        '--landing-container-width': `${Math.max(320, Number(schema?.theme?.containerWidth) || 1180)}px`,
        '--landing-radius': `${Math.max(0, Number(schema?.theme?.borderRadius) || 0)}px`,
        '--landing-section-spacing-desktop': `${Math.max(0, Number(schema?.theme?.sectionSpacingDesktop) || 0)}px`,
        '--landing-section-spacing-mobile': `${Math.max(0, Number(schema?.theme?.sectionSpacingMobile) || 0)}px`,
      }}
      onClickCapture={event => {
        if (viewMode !== 'edit') return
        if (event.target.closest?.('[data-landing-editor-only="true"]')) return
        if (event.target.closest?.('a, button, input, textarea, select, iframe')) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      {(schema?.sections ?? [])
        .filter(section => viewMode !== 'runtime' || matchLandingRoute(section.props?.routePath, runtime.route?.pathname))
        .map(section => {
        const presentation = getSectionPresentation(section.props ?? {}, schema?.theme)
        return (
          <EditableHighlight
          key={section.id}
          elementId={section.id}
          domId={normalizeAnchorId(section.props?.anchorId) || section.id}
          className={`${presentation.className}${section.type === 'divider' ? ' landing-divider-section' : ''}`}
          data-entrance-animation={presentation.animation}
          style={section.type === 'navbar' && section.props?.sticky
            ? { ...presentation.style, position: 'sticky', top: 0, zIndex: 40 }
            : presentation.style
          }
          data-block-type={section.type}
          data-block-id={section.id}
          data-has-block-title={Boolean(
            typeof section.props?.blockTitle === 'string' && section.props.blockTitle.trim(),
          )}
          selected={selected === section.id}
          onEdit={openEdit}
          disabled={viewMode !== 'edit'}
          showTrigger={viewMode === 'edit'}
        >
          {typeof section.props?.blockTitle === 'string' && section.props.blockTitle.trim() && (
            <BlockTitle style={{ '--block-title-accent': primaryColor }}>
              {section.props.blockTitle.trim()}
            </BlockTitle>
          )}
          {renderBlock(section, primaryColor)}
          </EditableHighlight>
        )
      })}
    </Page>
  )
}

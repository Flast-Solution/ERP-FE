import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import {
  Page, Nav, Brand, BrandLogo, NavLinks, CtaSm,
  NavActions,
  MobileMenuButton, MobileDrawerBackdrop, MobileDrawer, MobileDrawerHead,
  MobileDrawerLinks, MobileDrawerActions,
  BlockTitle,
  Hero, HeroMedia, HeroOverlay, HeroContent,
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
} from './PreviewCanvas.style'
import { EditableHighlight } from './EditableHighlight'
import { ExtendedBlockRenderer, isExtendedBlock, sanitizeHtml } from './ExtendedBlockRenderer'

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

const NavbarBlock = ({ props, primaryColor }) => {
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

  return (
    <>
      <Nav
        data-landing-navbar="true"
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
          type="button"
          aria-label="Mở menu"
          aria-expanded={menuOpen}
          style={{ background: navBackground, color: navTextColor }}
          onClick={() => setMenuOpen(true)}
        >
          <span />
        </MobileMenuButton>
      </Nav>

      <MobileDrawerBackdrop
        type="button"
        aria-label="Đóng menu"
        data-mobile-menu-backdrop="true"
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
    case 'navbar':
      return <NavbarBlock props={props} primaryColor={primaryColor} />

    case 'hero': {
      const heroLayout = ['left', 'center', 'right'].includes(props.layout) ? props.layout : 'center'
      const backgroundType = props.backgroundType || 'color'
      const hasBackgroundImage = backgroundType === 'image' && Boolean(props.backgroundImageUrl)
      const hasBackgroundVideo = backgroundType === 'video' && Boolean(props.backgroundVideoUrl)
      const overlayOpacity = Math.min(100, Math.max(0, Number(props.overlayOpacity) || 0)) / 100

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
          <HeroContent className="landing-hero-content">
            <Eyebrow style={{ color: props.textColor || primaryColor }}>{props.eyebrow}</Eyebrow>
            <HeroTitle>{props.title}</HeroTitle>
            <HeroDesc>{props.description}</HeroDesc>
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
        </Hero>
      )
    }

    case 'bannerSlider':
      return <BannerSlider props={props} />

    case 'heading': {
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

    case 'text':
      return (
        <ContentBlock>
          <ContentText
            as="div"
            $align={props.align}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.text) }}
          />
        </ContentBlock>
      )

    case 'image': {
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
            '--image-width': `${Math.min(100, Math.max(5, Number(props.width) || 100))}%`,
            '--image-mobile-width': `${Math.min(100, Math.max(5, Number(props.mobileWidth) || 100))}%`,
          }}
        />
      )
      return (
        <ContentBlock>
          {props.link
            ? <a href={props.link} target={props.openInNewTab ? '_blank' : undefined} rel={props.openInNewTab ? 'noopener noreferrer' : undefined}>{image}</a>
            : image
          }
          {props.caption && <ImageCaption>{props.caption}</ImageCaption>}
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
              {item.buttonText && (
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
          }}
        >
          <PriceHead>
            <h2>{props.title}</h2>
            <p>{props.description}</p>
          </PriceHead>
          <Plans className="landing-pricing-plans">
            {(props.plans ?? []).map((plan, index) => (
              <Plan key={`${plan.name}-${index}`} $hot={plan.featured}>
                {plan.featured && <PlanTag style={{ background: primaryColor }}>Phổ biến</PlanTag>}
                {plan.imageUrl ? (
                  <PlanMedia src={plan.imageUrl} alt={plan.name || `Gói ${index + 1}`} />
                ) : plan.icon && plan.icon !== 'none' ? (
                  <PlanIcon style={{ color: primaryColor }}>
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
                      style={{ background: primaryColor }}
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
                    >
                      {plan.buttonText || 'Chọn gói'}
                    </PlanCtaGhost>
                  )
                }
              </Plan>
            ))}
          </Plans>
        </Pricing>
      )

    case 'divider':
      return (
        <ContentBlock className="landing-divider-editor-zone">
          <span data-landing-editor-only="true">Đường phân cách · {props.width || 100}%</span>
          <DividerBlock
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
            renderNestedBlock={child => renderBlock(child, primaryColor)}
          />
        )
      }
      return <UnknownBlock>Không hỗ trợ block “{section?.type}”</UnknownBlock>
  }
}

export function PreviewCanvas() {
  const selected = useEditorStore((state) => state.selected)
  const schema = useEditorStore((state) => state.draftSchema)
  const device = useEditorStore((state) => state.device)
  const viewMode = useEditorStore((state) => state.viewMode)
  const openEdit = useEditorStore((state) => state.openEdit)
  const primaryColor = schema?.theme?.primaryColor

  return (
    <Page
      className="patch-light"
      data-landing-preview="true"
      data-device={device}
      style={{ fontFamily: schema?.theme?.fontFamily }}
      onClickCapture={event => {
        if (viewMode !== 'edit') return
        if (event.target.closest?.('[data-landing-editor-only="true"]')) return
        if (event.target.closest?.('a, button, input, textarea, select, iframe')) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      {(schema?.sections ?? []).map(section => (
        <EditableHighlight
          key={section.id}
          elementId={section.id}
          style={section.type === 'navbar' && section.props?.sticky
            ? { position: 'sticky', top: 0, zIndex: 40 }
            : undefined
          }
          data-block-type={section.type}
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
      ))}
    </Page>
  )
}

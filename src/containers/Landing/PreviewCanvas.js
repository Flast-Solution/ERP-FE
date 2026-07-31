import { useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import {
  Page, Nav, Brand, BrandLogo, NavLinks, CtaSm,
  NavActions,
  MobileMenuButton, MobileDrawerBackdrop, MobileDrawer, MobileDrawerHead,
  MobileDrawerLinks, MobileDrawerActions,
  BlockTitle,
  Hero, Eyebrow, HeroTitle, HeroDesc, HeroActions, CtaPrimary, CtaGhost,
  FeaturesGrid, FeatCard, FeatIcon, FeatTitle, FeatDesc,
  FeatImage, FeatCta,
  Pricing, PriceHead, Plans, Plan, PlanTag, PlanName, PlanPrice, PlanSub,
  PlanMedia, PlanIcon,
  PlanCtaPrimary, PlanCtaGhost, Footer,
  ContentBlock, ContentHeading, ContentText, ContentImage, ImageCaption,
  ContentButtonWrap, ContentButton, DividerBlock, SpacerBlock, UnknownBlock,
  Banner, BannerTrack, BannerSlide, BannerEmpty, BannerArrow, BannerDots, BannerDot,
} from './PreviewCanvas.style'
import { EditableHighlight } from './EditableHighlight'
import { ExtendedBlockRenderer, isExtendedBlock } from './ExtendedBlockRenderer'

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

const NavbarBlock = ({ props, primaryColor }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = props.actions?.length
    ? props.actions
    : (props.buttonText ? [{ label: props.buttonText, url: '#' }] : [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnEscape = event => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const brand = (
    <Brand>
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
      <Nav>
        {brand}
        <NavLinks className="landing-desktop-nav">
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
          className="landing-mobile-menu-button"
          type="button"
          aria-label="Mở menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span />
        </MobileMenuButton>
      </Nav>

      {menuOpen && (
        <>
          <MobileDrawerBackdrop type="button" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />
          <MobileDrawer role="dialog" aria-modal="true" aria-label="Menu điều hướng">
            <MobileDrawerHead>
              {brand}
              <button type="button" aria-label="Đóng menu" onClick={() => setMenuOpen(false)}>×</button>
            </MobileDrawerHead>
            <MobileDrawerLinks>
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
      )}
    </>
  )
}

const BannerSlider = ({ props }) => {
  const images = Array.isArray(props.images) ? props.images : []
  const [current, setCurrent] = useState(0)
  const intervalMs = Math.max(2, Number(props.interval) || 5) * 1000

  useEffect(() => {
    if (current < images.length) return
    setCurrent(0)
  }, [current, images.length])

  useEffect(() => {
    if (!props.autoplay || images.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setCurrent(index => (index + 1) % images.length)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [images.length, intervalMs, props.autoplay])

  if (!images.length) {
    return (
      <BannerEmpty style={{ height: `${Math.max(180, Number(props.height) || 420)}px` }}>
        Tải ảnh lên để tạo banner slide
      </BannerEmpty>
    )
  }

  const goTo = index => {
    const total = images.length
    setCurrent((index + total) % total)
  }

  return (
    <Banner style={{ height: `${Math.max(180, Number(props.height) || 420)}px` }}>
      <BannerTrack style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((image, index) => (
          <BannerSlide
            as={image.link ? 'a' : 'div'}
            key={`${image.url}-${index}`}
            href={image.link || undefined}
            target={image.openInNewTab ? '_blank' : undefined}
            rel={image.openInNewTab ? 'noopener noreferrer' : undefined}
          >
            <img src={image.url} alt={image.alt || `Banner ${index + 1}`} />
          </BannerSlide>
        ))}
      </BannerTrack>
      {images.length > 1 && (
        <>
          <BannerArrow type="button" $left onClick={() => goTo(current - 1)} aria-label="Slide trước">
            ‹
          </BannerArrow>
          <BannerArrow type="button" onClick={() => goTo(current + 1)} aria-label="Slide tiếp theo">
            ›
          </BannerArrow>
          {props.showDots && (
            <BannerDots>
              {images.map((image, index) => (
                <BannerDot
                  type="button"
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

    case 'hero':
      return (
        <Hero $bg={props.background}>
          <Eyebrow style={{ color: primaryColor }}>{props.eyebrow}</Eyebrow>
          <HeroTitle>{props.title}</HeroTitle>
          <HeroDesc>{props.description}</HeroDesc>
          <HeroActions>
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
        </Hero>
      )

    case 'bannerSlider':
      return <BannerSlider props={props} />

    case 'heading': {
      const tag = ['h1', 'h2', 'h3'].includes(props.level) ? props.level : 'h2'
      return (
        <ContentBlock>
          <ContentHeading as={tag} $align={props.align}>{props.text}</ContentHeading>
        </ContentBlock>
      )
    }

    case 'text':
      return (
        <ContentBlock>
          <ContentText $align={props.align}>{props.text}</ContentText>
        </ContentBlock>
      )

    case 'image':
      return (
        <ContentBlock>
          <ContentImage
            src={props.src}
            alt={props.alt || ''}
            style={{ borderRadius: `${Number(props.radius) || 0}px` }}
          />
          {props.caption && <ImageCaption>{props.caption}</ImageCaption>}
        </ContentBlock>
      )

    case 'button':
      return (
        <ContentButtonWrap $align={props.align}>
          <ContentButton
            href={props.url || '#'}
            style={{ background: primaryColor }}
            target={props.openInNewTab ? '_blank' : undefined}
            rel={props.openInNewTab ? 'noopener noreferrer' : undefined}
          >
            {props.text}
          </ContentButton>
        </ContentButtonWrap>
      )

    case 'features':
      return (
        <FeaturesGrid className="landing-features-grid">
          {(props.items ?? []).map((item, index) => (
            <FeatCard key={`${item.title}-${index}`}>
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
        <Pricing className="landing-pricing" $radius={props.borderRadius}>
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
                <PlanPrice>{plan.price}</PlanPrice>
                <PlanSub>{plan.description}</PlanSub>
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
        <ContentBlock>
          <DividerBlock
            style={{
              borderColor: props.color,
              width: `${Math.min(100, Math.max(1, Number(props.width) || 100))}%`,
            }}
          />
        </ContentBlock>
      )

    case 'spacer':
      return <SpacerBlock style={{ height: `${Math.max(8, Number(props.height) || 48)}px` }} />

    case 'footer':
      return <Footer>{props.text}</Footer>

    default:
      if (isExtendedBlock(section?.type)) return <ExtendedBlockRenderer section={section} />
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

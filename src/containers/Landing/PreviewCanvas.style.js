import styled from 'styled-components'
import { t } from '@/css/landing'

export const Page = styled.div`
  position: relative;
  min-height: 100%;
  font-family: ${t.fontSans};
  color: #16161a;
  background: #fff;
  scroll-behavior: smooth;

  > [id] {
    scroll-margin-top: 16px;
  }

  > [data-has-block-title='true'] {
    padding-top: 44px;
  }

  > [data-has-block-title='true'] .landing-features-grid,
  > [data-has-block-title='true'] .landing-pricing,
  > [data-has-block-title='true'] .landing-responsive-columns {
    padding-top: 10px;
  }

  &[data-device='mobile'] .landing-features-grid,
  &[data-device='mobile'] .landing-pricing-plans {
    grid-template-columns: repeat(var(--features-mobile-columns, 1), minmax(0, 1fr));
  }

  &[data-device='mobile'] .landing-pricing-plans { grid-template-columns: 1fr; }

  &[data-device='mobile'] .landing-features-grid {
    padding: 28px 16px;
  }

  &[data-device='mobile'] .landing-pricing {
    margin: 8px 8px 28px;
    padding: 28px 16px;
  }

  &[data-device='mobile'] .landing-responsive-columns {
    flex-direction: column;
    padding: 28px 16px !important;
  }

  &[data-device='mobile'] .landing-responsive-column {
    width: 100%;
    flex-basis: auto !important;
  }

  &[data-device='mobile'] .landing-desktop-nav {
    display: none;
  }

  &[data-device='mobile'] .landing-mobile-menu-button {
    display: inline-flex;
  }

  &[data-device='mobile'] .landing-hero {
    min-height: var(--hero-mobile-min-height);
    padding: 44px 20px;
  }

  &[data-device='mobile'] .landing-hero h1 {
    font-size: var(--hero-mobile-title-size);
  }

  &[data-device='mobile'] .landing-hero p {
    font-size: var(--hero-mobile-description-size);
  }

  &[data-device='mobile'] .landing-hero [data-hero-actions='true'] {
    flex-direction: column;
    align-items: stretch;
  }

  &[data-device='mobile'] .landing-banner {
    height: var(--banner-mobile-height) !important;
  }

  &[data-device='mobile'] .landing-heading-block h1,
  &[data-device='mobile'] .landing-heading-block h2,
  &[data-device='mobile'] .landing-heading-block h3 {
    font-size: var(--heading-mobile-size);
  }

  &[data-device='mobile'] .landing-content-image {
    width: var(--image-mobile-width);
  }

  &[data-device='mobile'] .landing-button-full-mobile {
    width: 100%;
  }

  &[data-device='mobile'] .landing-gallery-grid {
    grid-template-columns: repeat(var(--gallery-mobile-columns, 1), minmax(0, 1fr)) !important;
  }

  &[data-device='mobile'] .landing-map-frame {
    height: var(--map-mobile-height) !important;
  }

  &[data-device='mobile'] .landing-countdown-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  &[data-device='mobile'] .landing-timeline-item {
    grid-template-columns: 22px 1fr !important;
  }

  &[data-device='mobile'] .landing-timeline-item > strong {
    grid-column: 2;
  }

  &[data-device='mobile'] .landing-timeline-dot {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  &[data-device='mobile'] .landing-timeline-item > div {
    grid-column: 2;
  }

  &[data-device='mobile'] .landing-timeline-line {
    left: 6px !important;
  }

  @media (max-width: 600px) {
    .landing-features-grid,
    .landing-pricing-plans {
      grid-template-columns: repeat(var(--features-mobile-columns, 1), minmax(0, 1fr));
    }

    .landing-pricing-plans { grid-template-columns: 1fr; }

    .landing-features-grid {
      padding: 28px 16px;
    }

    .landing-pricing {
      margin: 8px 8px 28px;
      padding: 28px 16px;
    }

    .landing-responsive-columns {
      flex-direction: column;
      padding: 28px 16px !important;
    }

    .landing-responsive-column {
      width: 100%;
      flex-basis: auto !important;
    }

    .landing-desktop-nav {
      display: none;
    }

    .landing-mobile-menu-button {
      display: inline-flex;
    }

    .landing-hero {
      min-height: var(--hero-mobile-min-height);
      padding: 44px 20px;
    }

    .landing-hero h1 { font-size: var(--hero-mobile-title-size); }
    .landing-hero p { font-size: var(--hero-mobile-description-size); }

    .landing-hero [data-hero-actions='true'] {
      flex-direction: column;
      align-items: stretch;
    }


    .landing-banner { height: var(--banner-mobile-height) !important; }
    .landing-heading-block h1,
    .landing-heading-block h2,
    .landing-heading-block h3 { font-size: var(--heading-mobile-size); }
    .landing-content-image { width: var(--image-mobile-width); }
    .landing-button-full-mobile { width: 100%; }
    .landing-gallery-grid { grid-template-columns: repeat(var(--gallery-mobile-columns, 1), minmax(0, 1fr)) !important; }
    .landing-map-frame { height: var(--map-mobile-height) !important; }
    .landing-countdown-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .landing-timeline-item { grid-template-columns: 22px 1fr !important; }
    .landing-timeline-item > strong { grid-column: 2; }
    .landing-timeline-dot { grid-column: 1; grid-row: 1 / span 2; }
    .landing-timeline-item > div { grid-column: 2; }
    .landing-timeline-line { left: 6px !important; }
  }

  @media (min-width: 601px) and (max-width: 900px) {
    .landing-features-grid {
      grid-template-columns: repeat(var(--features-tablet-columns, 2), minmax(0, 1fr));
    }
  }

  .landing-gallery-grid {
    grid-template-columns: repeat(var(--gallery-columns, 3), minmax(0, 1fr));
  }

  .landing-map-frame { height: var(--map-height, 360px); }

  .landing-logo-grayscale {
    filter: grayscale(1);
    opacity: .68;
    transition: filter .2s ease, opacity .2s ease, transform .2s ease;
  }

  .landing-logo-grayscale:hover {
    filter: grayscale(0);
    opacity: 1;
    transform: translateY(-2px);
  }

  [data-tabs-variant='underline'] [role='tab'][aria-selected='true'] {
    border-bottom-color: ${t.violet500} !important;
  }

  [data-tabs-variant='pill'] [role='tab'][aria-selected='true'] {
    border-radius: 999px;
    background: ${t.brandSubtle} !important;
  }

  [data-tabs-variant='box'] [role='tab'][aria-selected='true'] {
    border-color: ${t.violet500} !important;
    color: ${t.violet700};
  }

  .landing-divider-editor-zone {
    position: relative;
    min-height: 44px;
  }

  .landing-divider-editor-zone > span {
    display: block;
    margin-bottom: 8px;
    color: #777789;
    font-size: 10px;
    text-align: center;
  }
`

export const Nav = styled.header`
  position: ${({ $sticky }) => ($sticky ? 'sticky' : 'relative')};
  top: ${({ $sticky }) => ($sticky ? '0' : 'auto')};
  z-index: ${({ $sticky }) => ($sticky ? '40' : 'auto')};
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 18px 32px;
  border-bottom: 1px solid #eee;
`

export const BlockTitle = styled.h2`
  width: calc(100% - 64px);
  margin: 0 32px 18px;
  padding: 3px 0 3px 14px;
  border-left: 4px solid var(--block-title-accent, ${t.violet500});
  color: #16161a;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;

  @media (max-width: 600px) {
    width: calc(100% - 32px);
    margin: 0 16px 14px;
    padding-left: 11px;
    font-size: 22px;
  }
`

export const MobileMenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-left: auto;
  border: 1px solid #e2e2ea;
  border-radius: 9px;
  background: #fff;
  color: #16161a;
  cursor: pointer;

  span,
  span::before,
  span::after {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 2px;
    background: currentColor;
  }

  span { position: relative; }
  span::before,
  span::after { content: ''; position: absolute; left: 0; }
  span::before { top: -6px; }
  span::after { top: 6px; }
`

export const MobileDrawerBackdrop = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  z-index: 50;
  border: 0;
  background: rgba(15, 17, 24, 0.46);
  cursor: pointer;
`

export const MobileDrawer = styled.aside`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 51;
  display: flex;
  flex-direction: column;
  width: min(82%, 320px);
  height: 100vh;
  height: 100dvh;
  padding: 20px;
  overflow-y: auto;
  background: #fff;
  box-shadow: 16px 0 40px rgba(20, 20, 32, 0.2);
  animation: landingDrawerIn 180ms ease-out;

  @keyframes landingDrawerIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
`

export const MobileDrawerHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid #eee;

  button {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 8px;
    background: #f4f4f8;
    font-size: 22px;
    cursor: pointer;
  }
`

export const MobileDrawerLinks = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 0;

  a {
    padding: 12px 10px;
    border-radius: 8px;
    color: inherit;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
  }

  a:hover { background: #f4f2ff; }
`

export const MobileDrawerActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: auto;

  a {
    padding: 11px 14px;
    border-radius: 9px;
    color: #fff;
    font-weight: 650;
    text-align: center;
    text-decoration: none;
  }
`

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.02em;
  color: inherit;
  text-decoration: none;
`

export const BrandLogo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: ${t.violet500};
  color: #fff;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

export const NavLinks = styled.nav`
  display: flex;
  gap: 20px;
  margin-left: 8px;
  font-size: 14px;
  color: #54545f;

  a {
    color: inherit;
    text-decoration: none;
  }
`

export const CtaSm = styled.button`
  border: 1px solid #e2e2ea;
  background: #fff;
  color: #16161a;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
`

export const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`

export const Hero = styled.section`
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  min-height: var(--hero-min-height, 520px);
  padding: 64px 32px 56px;
  overflow: hidden;
  color: var(--hero-text-color, #16161a);
  text-align: ${({ 'data-layout': layout }) => layout || 'center'};
  background: ${({ $bg }) => $bg || '#fafaff'};
`

export const HeroMedia = styled.div`
  position: absolute;
  inset: 0;
  z-index: -2;

  img,
  video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
`

export const HeroContent = styled.div`
  width: min(100%, 720px);

  ${Hero}[data-layout='left'] & { margin-right: auto; margin-left: 0; }
  ${Hero}[data-layout='center'] & { margin-right: auto; margin-left: auto; }
  ${Hero}[data-layout='right'] & { margin-right: 0; margin-left: auto; }

  ${Hero}[data-layout='center'] & h1,
  ${Hero}[data-layout='center'] & p { margin-right: auto; margin-left: auto; }

  ${Hero}[data-layout='right'] & h1,
  ${Hero}[data-layout='right'] & p { margin-left: auto; }
`

export const Eyebrow = styled.span`
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${t.violet600};
  margin-bottom: 14px;
`

export const HeroTitle = styled.h1`
  margin: 0 0 14px;
  max-width: 580px;
  font-size: var(--hero-title-size, 48px);
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-wrap: balance;
`

export const HeroDesc = styled.p`
  margin: 0 0 24px;
  max-width: 480px;
  font-size: var(--hero-description-size, 18px);
  line-height: 1.5;
  color: inherit;
  opacity: 0.82;
`

export const HeroActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: inherit;

  ${Hero}[data-layout='left'] & { justify-content: flex-start; }
  ${Hero}[data-layout='center'] & { justify-content: center; }
  ${Hero}[data-layout='right'] & { justify-content: flex-end; }
`

export const CtaPrimary = styled.button`
  border: none;
  background: ${t.violet500};
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 11px 20px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(124, 92, 255, 0.32);
  text-decoration: none;
`

export const CtaGhost = styled.button`
  border: 1px solid #e2e2ea;
  background: #fff;
  color: #16161a;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 11px 20px;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
`

export const FeaturesGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(var(--features-columns, 3), minmax(0, 1fr));
  gap: 20px;
  padding: 48px 32px;
`

export const FeatCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 22px;
  border: 1px solid #eee;
  border-radius: 14px;
  background: #fff;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;

  &[data-hover='lift']:hover {
    transform: translateY(-5px);
    box-shadow: 0 14px 30px rgba(24, 24, 35, .1);
  }

  &[data-hover='border']:hover { border-color: ${t.violet500}; }
`

export const FeatImage = styled.img`
  display: block;
  width: 100%;
  height: 150px;
  margin-bottom: 14px;
  border-radius: 10px;
  object-fit: cover;
`

export const FeatIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #f3f0ff;
  color: ${t.violet600};
  margin-bottom: 12px;
`

export const FeatTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
`

export const FeatDesc = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: #6f6f82;
`

export const FeatCta = styled.a`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  margin-top: auto;
  padding-top: 14px;
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
`

export const Pricing = styled.section`
  margin: 8px 24px 40px;
  padding: 40px 28px;
  background: #0e0e10;
  color: #fff;
  border-radius: ${({ $radius }) => $radius || '16px'};
`

export const PriceHead = styled.div`
  text-align: center;
  margin-bottom: 28px;

  h2 {
    margin: 0 0 6px;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    color: #b4b4c0;
    font-size: 14px;
  }
`

export const Plans = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--pricing-columns, 3), minmax(0, 1fr));
  gap: 16px;
  max-width: 720px;
  margin: 0 auto;
`

export const Plan = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 22px;
  border: 1px solid ${({ $hot }) => ($hot ? t.violet500 : 'rgba(255,255,255,.12)')};
  border-radius: 14px;
  background: ${({ $hot }) => ($hot ? 'rgba(124,92,255,.1)' : 'rgba(255,255,255,.03)')};
`

export const PlanMedia = styled.img`
  display: block;
  width: 100%;
  height: 110px;
  margin-bottom: 10px;
  border-radius: 9px;
  object-fit: cover;
`

export const PlanIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-bottom: 5px;
  border-radius: 9px;
  background: rgba(124, 92, 255, .14);
  font-size: 17px;
`

export const PlanTag = styled.span`
  position: absolute;
  top: -10px;
  right: 16px;
  background: ${t.violet500};
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
`

export const PlanName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #b4b4c0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

export const PlanPrice = styled.span`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
`

export const PlanSub = styled.span`
  font-size: 13px;
  color: #8a8a96;
  margin-bottom: 8px;
`

export const PlanCycle = styled.span`
  margin-left: 5px;
  color: currentColor;
  font-size: 12px;
  opacity: .65;
`

export const PlanBenefits = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  min-height: 20px;
  margin: 5px 0 14px;
  padding: 0;
  list-style: none;
  font-size: 12px;
  opacity: .88;
`

export const PlanCtaPrimary = styled(CtaPrimary)`
  width: 100%;
  text-align: center;
  font-size: 13px;
  padding: 9px 0;
  text-decoration: none;
`

export const PlanCtaGhost = styled.button`
  width: 100%;
  text-align: center;
  font-size: 13px;
  padding: 9px 0;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  font: inherit;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
`

export const Footer = styled.footer`
  padding: 44px 32px 24px;
  font-size: 13px;
  border-top: 1px solid #eee;
`

export const FooterMain = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1.3fr) 2fr;
  gap: 40px;
  max-width: 1120px;
  margin: 0 auto 34px;

  @media (max-width: 600px) { grid-template-columns: 1fr; gap: 26px; }
`

export const FooterBrand = styled.div`
  strong { display: block; margin-bottom: 10px; font-size: 18px; }
  p { margin: 5px 0; line-height: 1.55; opacity: .72; white-space: pre-line; }
`

export const FooterLogo = styled.img`
  display: block;
  max-width: 150px;
  height: 46px;
  margin-bottom: 14px;
  object-fit: contain;
  object-position: left center;
`

export const FooterColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 24px;
`

export const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
  strong { margin-bottom: 3px; }
  a { color: inherit; text-decoration: none; opacity: .72; }
  a:hover { opacity: 1; }
`

export const FooterBottom = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  max-width: 1120px;
  margin: 0 auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, .14);
  opacity: .78;

  @media (max-width: 600px) { flex-direction: column; }
`

export const FooterSocial = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  a { color: inherit; text-decoration: none; }
`

export const ContentBlock = styled.section`
  padding: 22px 32px;
`

export const ContentHeading = styled.h2`
  width: min(100%, var(--heading-max-width, 1120px));
  margin: var(--heading-margin-top, 0) auto var(--heading-margin-bottom, 0);
  color: #16161a;
  font-size: var(--heading-size, 36px);
  line-height: 1.25;
  text-align: ${({ $align }) => $align || 'left'};
`

export const ContentText = styled.p`
  margin: 0;
  color: #54545f;
  font-size: 16px;
  line-height: 1.7;
  white-space: pre-wrap;
  text-align: ${({ $align }) => $align || 'left'};
`

export const ContentImage = styled.img`
  display: block;
  width: var(--image-width, 100%);
  margin: 0 auto;
  max-height: 560px;
  object-fit: cover;
`

export const ImageCaption = styled.p`
  margin: 8px 0 0;
  color: #8a8a96;
  font-size: 12px;
  text-align: center;
`

export const ContentButtonWrap = styled.div`
  padding: 18px 32px;
  text-align: ${({ $align }) => $align || 'left'};
`

export const ContentButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
`

export const DividerBlock = styled.hr`
  margin: 0 auto;
  border: 0;
  border-top: 1px solid #e8e8ee;
`

export const SpacerBlock = styled.div`
  position: relative;
  min-height: 8px;

  > span {
    position: absolute;
    inset: 4px 12px;
    display: grid;
    place-items: center;
    border: 1px dashed #b9b9c8;
    border-radius: 7px;
    background-image: repeating-linear-gradient(135deg, #fafafe, #fafafe 7px, #f0f0f6 7px, #f0f0f6 14px);
    color: #777789;
    font-size: 11px;
  }
`

export const UnknownBlock = styled.div`
  margin: 12px 32px;
  padding: 18px;
  border: 1px dashed #d7d7e0;
  color: #8a8a96;
  text-align: center;
`

export const Banner = styled.section`
  position: relative;
  min-height: 180px;
  overflow: hidden;
  background: #f2f2f6;
  height: var(--banner-height, 420px);
  touch-action: pan-y;
`

export const BannerTrack = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform .45s ease;
`

export const BannerSlide = styled.div`
  display: block;
  width: 100%;
  height: 100%;
  flex: 0 0 100%;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const BannerEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  height: var(--banner-height, 420px);
  border: 1px dashed #cfcfd8;
  background: #f7f7fa;
  color: #8a8a96;
  font-size: 14px;
`

export const BannerArrow = styled.button`
  position: absolute;
  top: 50%;
  ${({ $left }) => ($left ? 'left: 16px;' : 'right: 16px;')}
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0 0 3px;
  border: 1px solid rgba(255, 255, 255, .55);
  border-radius: 50%;
  background: rgba(16, 16, 24, .42);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
`

export const BannerDots = styled.div`
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 7px;
`

export const BannerDot = styled.button`
  width: ${({ $active }) => ($active ? '22px' : '8px')};
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,.55)')};
  box-shadow: 0 1px 4px rgba(0,0,0,.2);
  cursor: pointer;
  transition: width .2s ease, background .2s ease;
`

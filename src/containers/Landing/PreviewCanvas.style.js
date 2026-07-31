import styled from 'styled-components'
import { t } from '@/css/landing'

export const Page = styled.div`
  font-family: ${t.fontSans};
  color: #16161a;
  background: #fff;
`

export const Nav = styled.header`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 18px 32px;
  border-bottom: 1px solid #eee;
`

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.02em;
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
  padding: 64px 32px 56px;
  text-align: center;
  background: ${({ $bg }) => $bg || '#fafaff'};
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
  margin: 0 auto 14px;
  max-width: 580px;
  font-size: 42px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-wrap: balance;
`

export const HeroDesc = styled.p`
  margin: 0 auto 24px;
  max-width: 480px;
  font-size: 16px;
  line-height: 1.5;
  color: #54545f;
`

export const HeroActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
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
  grid-template-columns: repeat(3, 1fr);
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
  margin-top: 14px;
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
  grid-template-columns: repeat(3, 1fr);
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
  padding: 24px 32px;
  text-align: center;
  font-size: 13px;
  color: #8a8a96;
  border-top: 1px solid #eee;
`

export const ContentBlock = styled.section`
  padding: 22px 32px;
`

export const ContentHeading = styled.h2`
  margin: 0;
  color: #16161a;
  font-size: 30px;
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
  width: 100%;
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
  min-height: 8px;
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

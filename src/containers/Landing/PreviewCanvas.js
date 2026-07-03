import { useEditorStore } from '@/store/editorStore'
import {
  Page, Nav, Brand, BrandLogo, NavLinks, CtaSm,
  Hero, Eyebrow, HeroTitle, HeroDesc, HeroActions, CtaPrimary, CtaGhost,
  FeaturesGrid, FeatCard, FeatIcon, FeatTitle, FeatDesc,
  Pricing, PriceHead, Plans, Plan, PlanTag, PlanName, PlanPrice, PlanSub,
  PlanCtaPrimary, PlanCtaGhost, Footer,
} from './PreviewCanvas.style'
import { EditableHighlight } from './EditableHighlight'

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
  </svg>
)

const FEATURES = [
  ['Triển khai tức thì', 'Đẩy code lên production chỉ với một cú nhấp.'],
  ['Cộng tác thời gian thực', 'Cả nhóm cùng làm việc trên một bản xem trước.'],
  ['Phân tích tích hợp', 'Theo dõi hiệu suất ngay trong bảng điều khiển.'],
]

const PLANS = [
  ['Free', '0₫', 'Cho cá nhân'],
  ['Team', '290k', 'Cho nhóm nhỏ'],
  ['Scale', 'Liên hệ', 'Cho doanh nghiệp'],
]

export function PreviewCanvas() {
  const selected = useEditorStore((s) => s.selected)
  const edits = useEditorStore((s) => s.edits)
  const openEdit = useEditorStore((s) => s.openEdit)
  const e = edits || {}

  return (
    <Page className="patch-light">
      <EditableHighlight elementId="nav" selected={selected === 'nav'} onEdit={openEdit}>
        <Nav>
          <Brand>
            <BrandLogo><BoltIcon /></BrandLogo>
            Nimbus
          </Brand>
          <NavLinks>
            <span>Sản phẩm</span>
            <span>Giải pháp</span>
            <span>Bảng giá</span>
          </NavLinks>
          <CtaSm>Dùng thử</CtaSm>
        </Nav>
      </EditableHighlight>

      <EditableHighlight elementId="hero" selected={selected === 'hero'} onEdit={openEdit}>
        <Hero $bg={e.heroBg}>
          <Eyebrow>Nền tảng vận hành</Eyebrow>
          <HeroTitle>{e.heroTitle || 'Đưa sản phẩm ra thị trường nhanh hơn'}</HeroTitle>
          <HeroDesc>Nimbus giúp đội ngũ của bạn xây dựng, triển khai và mở rộng — tất cả trong một nơi.</HeroDesc>
          <HeroActions>
            <CtaPrimary>Bắt đầu miễn phí</CtaPrimary>
            <CtaGhost>Xem demo</CtaGhost>
          </HeroActions>
        </Hero>
      </EditableHighlight>

      <EditableHighlight elementId="features" selected={selected === 'features'} onEdit={openEdit}>
        <FeaturesGrid>
          {FEATURES.map(([t, d], i) => (
            <FeatCard key={i}>
              <FeatIcon><BoltIcon /></FeatIcon>
              <FeatTitle>{t}</FeatTitle>
              <FeatDesc>{d}</FeatDesc>
            </FeatCard>
          ))}
        </FeaturesGrid>
      </EditableHighlight>

      <EditableHighlight elementId="pricing" selected={selected === 'pricing'} onEdit={openEdit}>
        <Pricing $radius={e.pricingRadius}>
          <PriceHead>
            <h2>Bảng giá linh hoạt</h2>
            <p>Bắt đầu miễn phí, nâng cấp khi nhóm phát triển.</p>
          </PriceHead>
          <Plans>
            {PLANS.map(([n, p, s], i) => (
              <Plan key={i} $hot={i === 1}>
                {i === 1 && <PlanTag>Phổ biến</PlanTag>}
                <PlanName>{n}</PlanName>
                <PlanPrice>{p}</PlanPrice>
                <PlanSub>{s}</PlanSub>
                {i === 1
                  ? <PlanCtaPrimary>Chọn gói</PlanCtaPrimary>
                  : <PlanCtaGhost>Chọn gói</PlanCtaGhost>
                }
              </Plan>
            ))}
          </Plans>
        </Pricing>
      </EditableHighlight>

      <Footer>© 2026 Nimbus · Được tạo với Patch</Footer>
    </Page>
  )
}

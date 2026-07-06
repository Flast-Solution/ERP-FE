import { useEditorStore } from '@/store/editorStore'
import {
  Page, Nav, Brand, BrandLogo, NavLinks, CtaSm,
  Hero, Eyebrow, HeroTitle, HeroDesc, HeroActions, CtaPrimary, CtaGhost,
  FeaturesGrid, FeatCard, FeatIcon, FeatTitle, FeatDesc,
  Pricing, PriceHead, Plans, Plan, PlanTag, PlanName, PlanPrice, PlanSub,
  PlanCtaPrimary, PlanCtaGhost, Footer,
} from './PreviewCanvas.style'
import { EditableHighlight } from './EditableHighlight'
import { RenderJsx } from './RenderJsx'
import { DownOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

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

/* Dữ liệu menu truyền vào Headers({ serviceItems }) của file .tsx fetch về */
const SERVICE_ITEMS = [
  {
    key: '1',
    label: <a style={{ fontWeight: 600, textTransform: 'uppercase' }}>Văn Phòng trọn gói</a>,
    expandIcon: <DownOutlined style={{ fontSize: 11, marginTop: 5 }} />,
    children: [
      { key: '1-1', label: <a href="/van-phong-tron-goi-mpro-duy-tan" style={{ fontWeight: 600 }}>MPRO DUY TÂN</a> },
      { key: '1-2', label: <a href="/van-phong-tron-goi-mpro-nguyen-phong-sac" style={{ fontWeight: 600 }}>MPRO NGUYỄN PHONG SẮC</a> },
      { key: '1-3', label: <a href="/van-phong-tron-goi-mpro-pham-hung" style={{ fontWeight: 600 }}>MPRO PHẠM HÙNG 8</a> },
      { key: '1-4', label: <a href="/van-phong-tron-goi-mpro-pham-hung-23" style={{ fontWeight: 600 }}>MPRO PHẠM HÙNG 23</a> },
      { key: '1-5', label: <a href="/van-phong-tron-goi-mpro-kico-le-van-luong" style={{ fontWeight: 600 }}>MPRO KICO LÊ VĂN LƯƠNG</a> },
      {
        key: '1-6',
        label: (
          <a href="/van-phong-tron-goi-mpro-eco-nguyen-hoang-ton" style={{ fontWeight: 600 }}>
            MPRO <span style={{ color: 'red' }}>ECO</span> Nguyễn Hoàng Tôn
          </a>
        ),
      },
    ],
  },
  { key: '2', label: <a href="/van-phong-ao" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Văn Phòng Ảo</a> },
  { key: '3', label: <a href="/cho-ngoi-lam-viec" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Chỗ Ngồi Làm Việc</a> },
  { key: '4', label: <a href="/cho-thue-phong-hop" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Phòng Họp – đào tạo</a> },
  { key: '5', label: <a href="/su-kien" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Địa điểm tổ chức sự kiện</a> },
  { key: '6', label: <a href="/dich-vu-he-sinh-thai-mpro-office" style={{ fontWeight: 600, textTransform: 'uppercase' }}>DỊCH VỤ HỆ SINH THÁI</a> },
]

export function PreviewCanvas() {
  const selected = useEditorStore((s) => s.selected)
  const edits = useEditorStore((s) => s.edits)
  const openEdit = useEditorStore((s) => s.openEdit)
  const e = edits || {}
  const viewjsx = useEditorStore((s) => s.viewJsxFile)
  const [jsxPreview, setJsxPreview] = useState('')

  useEffect(() => {
    const fetchJsx = async () => {
      const jsx = await viewjsx('test/dcd5de0b-02f4-49ce-bd6f-139a4c423711.tsx')
      setJsxPreview(jsx)
    }
    fetchJsx()
  }, [viewjsx])
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

      {jsxPreview && <RenderJsx code={jsxPreview} props={{ serviceItems: SERVICE_ITEMS }} />}

      <Footer>© 2026 Nimbus · Được tạo với Patch</Footer>
    </Page>
  )
}

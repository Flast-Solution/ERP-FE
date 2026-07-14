import axios from 'axios'
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
import { ApiConfigModal } from './ApiConfigModal'
import { useCallback, useEffect, useState } from 'react'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

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
  const viewjsx = useEditorStore((s) => s.viewJsxFile)

  const getConfig = useEditorStore((s) => s.getConfig)
  const setApiConfig = useEditorStore((s) => s.setApiConfig)
  const setSeoConfig = useEditorStore((s) => s.setSeoConfig)
  const setCrumbConfig = useEditorStore((s) => s.setCrumbConfig)
  const setJsxConfig = useEditorStore((s) => s.setJsxConfig)
  const setPageMeta = useEditorStore((s) => s.setPageMeta)
  const [pageConfig, setPageConfig] = useState(null)
  const [jsxSources, setJsxSources] = useState({})
  const [apiData, setApiData] = useState({})

  const loadConfig = useCallback(async () => {
    try {
      const data = await getConfig('home')
      if (!data) return

      setPageMeta({ id: data.id, bizId: data.bizId, name: data.name, slug: data.slug, title: data.title })

      const nextApiConfig = {}
      const nextJsxConfig = {}
        ; (data.configs || []).forEach(({ tag, apis, urlJsx }) => {
          nextApiConfig[tag] = (apis || []).map((api) => ({
            id: api.id || uid(),
            key: api.key || '',
            method: api.method || 'GET',
            url: api.url || '',
          }))

          nextJsxConfig[tag] = (urlJsx || []).map((path) => ({
            id: uid(),
            name: path.split('/').pop(),
            path,
          }))
        })

      const nextCrumbConfig = (data.breadcrumds || []).map(({ page, url }) => ({
        id: uid(),
        text: page,
        url,
      }))

      const nextSeoConfig = (data.seos || []).flatMap((seo) =>
        Object.entries(seo)
          .filter(([, value]) => value != null && value !== '')
          .map(([name, value]) => ({ id: uid(), name, value }))
      )

      setApiConfig(nextApiConfig)
      setJsxConfig(nextJsxConfig)
      setCrumbConfig(nextCrumbConfig)
      setSeoConfig(nextSeoConfig)

      setPageConfig({
        apiConfig: nextApiConfig,
        jsxConfig: nextJsxConfig,
        crumbConfig: nextCrumbConfig,
        seoConfig: nextSeoConfig,
      })

      const tags = Object.keys(nextJsxConfig)

      tags.forEach((tag) => {
        ; (nextJsxConfig[tag] || []).forEach((f) => {
          viewjsx(f.path)
            .then((code) => {
              setJsxSources((prev) => ({
                ...prev,
                [tag]: [...(prev[tag] || []), { path: f.path, code }],
              }))
            })
            .catch((err) => {
              console.error(`[PreviewCanvas] viewJsxFile lỗi (tag=${tag}, path=${f.path}):`, err)
            })
        });

        (nextApiConfig[tag] || [])
          .filter((api) => api.url)
          .forEach((api) => {
            axios({ method: api.method || 'GET', url: api.url })
              .then((res) => {
                setApiData((prev) => ({
                  ...prev,
                  [tag]: { ...(prev[tag] || {}), [api.key]: res.data },
                }))
              })
              .catch((err) => {
                console.error(`[PreviewCanvas] Gọi API lỗi (tag=${tag}, key=${api.key}):`, err)
              })
          })
      })
    } catch (err) {
      console.error('[PreviewCanvas] getConfig lỗi:', err)
    }
  }, [getConfig, viewjsx, setApiConfig, setJsxConfig, setCrumbConfig, setSeoConfig, setPageMeta])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

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

      {Object.entries(jsxSources).map(([tag, files]) =>
        files.map((f) => (
          <RenderJsx key={f.path} code={f.code} props={apiData[tag]} />
        ))
      )}

      <Footer>© 2026 Nimbus · Được tạo với Patch</Footer>

      <ApiConfigModal config={pageConfig} onReload={loadConfig} />
    </Page>
  )
}

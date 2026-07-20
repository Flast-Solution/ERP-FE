import React from 'react'
import { Drawer, Empty, Segmented } from 'antd'
import DocumentNodeContent from './DocumentNodeContent'
import { A4ContentGrid, A4Page, CanvasViewport, CodePreview } from './styles'

const PreviewDrawer = ({ open, template, data, onClose }) => {
  const [mode, setMode] = React.useState('preview')

  return (
    <Drawer
      open={open}
      width="min(980px, 92vw)"
      title="Xem trước chứng từ"
      onClose={onClose}
      extra={<Segmented value={mode} onChange={setMode} options={[{ value: 'preview', label: 'Chứng từ' }, { value: 'json', label: 'Template JSON' }]} />}
      styles={{ body: { padding: 0, background: '#eef1f5' } }}
    >
      {mode === 'json' ? (
        <div style={{ padding: 20 }}><CodePreview>{JSON.stringify(template, null, 2)}</CodePreview></div>
      ) : (
        <CanvasViewport>
          <A4Page $margin={template.page?.margin}>
            <A4ContentGrid
              $columns={template.layout?.columns}
              $columnGap={template.layout?.columnGap}
              $rowGap={template.layout?.rowGap}
            >
              {(template.nodes ?? []).length
                ? template.nodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      gridColumn: node.layout?.startNewRow
                        ? `1 / span ${node.layout?.columnSpan ?? 12}`
                        : `span ${node.layout?.columnSpan ?? 12}`,
                      minWidth: 0,
                      minHeight: node.layout?.minHeight || undefined,
                    }}
                  >
                    <DocumentNodeContent node={node} data={data} preview />
                  </div>
                ))
                : <div style={{ gridColumn: '1 / -1' }}><Empty description="Template chưa có thành phần" /></div>}
            </A4ContentGrid>
          </A4Page>
        </CanvasViewport>
      )}
    </Drawer>
  )
}

export default PreviewDrawer

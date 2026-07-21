import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Drawer, Empty, List, Space, Spin, Tag, Typography } from 'antd'
import { DownloadOutlined, FilePdfOutlined, PrinterOutlined } from '@ant-design/icons'

const { Text } = Typography

const GeneratedDocumentViewer = ({
  open,
  title = 'Chứng từ PDF',
  loading = false,
  documents = [],
  onClose,
}) => {
  const iframeRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!open) return
    const preferredDocument = documents.find(item => item.isDefault) || documents[0]
    setSelectedId(preferredDocument?.id ?? null)
  }, [documents, open])

  const selectedDocument = useMemo(() => (
    documents.find(item => String(item.id) === String(selectedId)) || documents[0] || null
  ), [documents, selectedId])

  const handlePrint = () => {
    const url = selectedDocument?.viewUrl
    if (!url) return

    try {
      const frameWindow = iframeRef.current?.contentWindow
      if (frameWindow) {
        frameWindow.focus()
        frameWindow.print()
        return
      }
    } catch (error) {
      // Trình duyệt chặn gọi print trực tiếp khi PDF nằm khác domain.
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width="92vw"
      styles={{ body: { padding: 0, height: '100%', overflow: 'hidden' } }}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {!loading && documents.length === 0 ? (
          <div style={{ height: 'calc(100vh - 56px)', display: 'grid', placeItems: 'center' }}>
            <Empty description="Đơn hàng chưa có file báo giá PDF" />
          </div>
        ) : (
          <div style={{ height: 'calc(100vh - 56px)', display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)' }}>
            <aside style={{ borderRight: '1px solid #f0f0f0', overflow: 'auto', padding: 12 }}>
              <List
                dataSource={documents}
                renderItem={item => (
                  <List.Item
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      cursor: 'pointer',
                      padding: 12,
                      borderRadius: 8,
                      background: String(item.id) === String(selectedDocument?.id) ? '#e6f4ff' : 'transparent',
                    }}
                  >
                    <List.Item.Meta
                      avatar={<FilePdfOutlined style={{ color: '#cf1322', fontSize: 22 }} />}
                      title={item.fileName || 'Báo giá.pdf'}
                      description={(
                        <Space size={6} wrap>
                          {item.version ? <Tag>{item.version}</Tag> : null}
                          <Text type="secondary">{item.createdAt || ''}</Text>
                        </Space>
                      )}
                    />
                  </List.Item>
                )}
              />
            </aside>

            <section style={{ minWidth: 0, display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
              <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong ellipsis>{selectedDocument?.fileName || 'Báo giá PDF'}</Text>
                <Space>
                  <Button
                    icon={<DownloadOutlined />}
                    href={selectedDocument?.downloadUrl || selectedDocument?.viewUrl}
                    target="_blank"
                    disabled={!selectedDocument?.viewUrl && !selectedDocument?.downloadUrl}
                  >
                    Tải PDF
                  </Button>
                  <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} disabled={!selectedDocument?.viewUrl}>
                    In
                  </Button>
                </Space>
              </div>
              {selectedDocument?.viewUrl ? (
                <iframe
                  key={selectedDocument.id}
                  ref={iframeRef}
                  title={selectedDocument.fileName || 'PDF preview'}
                  src={selectedDocument.viewUrl}
                  style={{ width: '100%', flex: 1, border: 0, background: '#fff' }}
                />
              ) : null}
            </section>
          </div>
        )}
      </Spin>
    </Drawer>
  )
}

export default GeneratedDocumentViewer

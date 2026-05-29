import React from 'react'
import { NodeIndexOutlined, SwapOutlined } from '@ant-design/icons'
import {
  useSelectedItem,
  useSelectedType,
} from '@/hooks/useWorkflowStore'
import StepForm from './StepForm'
import TransitionForm from './TransitionForm'
import { PanelHeader, PanelTitle, PanelBody, EmptySelection } from './styles'

const DetailPanel = () => {
  const selectedType = useSelectedType()
  const selectedItem = useSelectedItem()

  const renderContent = () => {
    if (!selectedItem) {
      return (
        <EmptySelection>
          <NodeIndexOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
          <span>Chọn một step hoặc transition để chỉnh sửa</span>
        </EmptySelection>
      )
    } else if (selectedType === 'node') {
      return <StepForm node={selectedItem} />
    } else if (selectedType === 'edge') {
      return <TransitionForm edge={selectedItem} />
    } else {
      return null
    }
  }

  const titleMap = {
    node: 'Cấu hình Step',
    edge: 'Cấu hình Transition',
  }

  return (
    <>
      <PanelHeader>
        <PanelTitle>
          {selectedType ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {selectedType === 'node' ? (
                <NodeIndexOutlined />
              ) : (
                <SwapOutlined />
              )}
              {titleMap[selectedType]}
            </span>
          ) : (
            'Detail'
          )}
        </PanelTitle>
      </PanelHeader>

      <PanelBody $padding={selectedItem ? '14px' : '0'}>
        {renderContent()}
      </PanelBody>
    </>
  )
}

export default DetailPanel

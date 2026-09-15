import React from 'react'
import { Button } from 'antd'
import { formatTime } from '@flast-erp/core/utils'

import {
  ExistingLotItem,
  ExistingLotList,
  ExistingLotsEmpty,
  ExistingLotsHeader,
  ExistingLotsPanel,
} from '../styles'

const ExistingLotsSection = ({
  lots,
  activeLotId,
  allowCreateNew,
  onSelect,
  onCreateNew,
}) => (
  <ExistingLotsPanel>
    <ExistingLotsHeader>
      <div>
        <h3>Danh sách lô hàng đã tạo</h3>
        <span>Click vào lô hàng để chỉnh sửa thông tin bên dưới.</span>
      </div>
      {allowCreateNew ? (
        <Button size="small" onClick={onCreateNew}>
          Tạo lô mới
        </Button>
      ) : null}
    </ExistingLotsHeader>

    {lots.length > 0 ? (
      <ExistingLotList>
        {lots.map((lot, index) => (
          <ExistingLotItem
            key={lot?.id ?? lot?.code ?? index}
            type="button"
            $active={String(activeLotId ?? '') === String(lot?.id ?? '')}
            onClick={() => onSelect(lot)}
          >
            <div className="lot-main">
              <span>{lot?.name || `Lô hàng ${index + 1}`}</span>
              <span>{lot?.code || '-'}</span>
            </div>
            <div className="lot-meta">
              <span>Số lượng: {lot?.total ?? lot?.quantity ?? 0}</span>
              <span>Loại: {lot?.type || '-'}</span>
              <span>Ưu tiên: {lot?.priorityLevel || '-'}</span>
              <span>Ngày dự kiến: {formatTime(lot?.expectedDate) || '-'}</span>
            </div>
          </ExistingLotItem>
        ))}
      </ExistingLotList>
    ) : (
      <ExistingLotsEmpty>
        Chưa có lô hàng nào được tạo cho đơn này.
      </ExistingLotsEmpty>
    )}
  </ExistingLotsPanel>
)

export default ExistingLotsSection

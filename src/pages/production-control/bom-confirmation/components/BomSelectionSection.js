import React from 'react';
import { FormInput, FormSelect } from '@flast-erp/core/components';

const BomSelectionSection = ({
  bomItems = [],
  bomVersions = [],
  bomLoading = false,
  onVersionChange,
}) => (
  <section className="section">
    <div className="section-head"><span className="section-no">1</span><h2>Phiên bản BOM</h2></div>
    <div className="bom-selection-list">
      {bomItems.map((item, index) => {
        const productVersions = bomVersions
          .filter(bom => String(bom.productId) === String(item.productId))
          .map(bom => ({ value: bom.version, name: bom.version }));
        return (
          <div className="bom-selection-card" key={item.key}>
            <div className="bom-selection-card__title">
              <span>BOM {index + 1}</span>
              <strong>{item.name}</strong>
            </div>
            <div className="bom-selection-grid">
              <FormInput
                name={['bomSelections', item.key, 'orderLabel']}
                label="Đơn hàng cho BOM"
                disabled
              />
              <FormSelect
                required
                name={['bomSelections', item.key, 'version']}
                label="Version"
                placeholder={bomLoading ? 'Đang tải BOM' : 'Chọn Version'}
                resourceData={productVersions}
                valueProp="value"
                titleProp="name"
                disabled={bomLoading || productVersions.length === 0}
                onChange={version => onVersionChange(item, version)}
              />
              <FormInput
                name={['bomSelections', item.key, 'status']}
                label="Trạng thái BOM"
                disabled
              />
            </div>
            {productVersions.length === 0 && !bomLoading && (
              <div className="bom-selection-card__empty">Sản phẩm chưa có BOM.</div>
            )}
          </div>
        );
      })}
    </div>
  </section>
);

export default BomSelectionSection;

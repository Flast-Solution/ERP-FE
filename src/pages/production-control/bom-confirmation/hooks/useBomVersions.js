import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { RequestUtils } from '@flast-erp/core/utils';
import {
  buildBomItems,
  buildBomMaterialGroups,
  buildBomSelectionValues,
  buildProducts,
  getBomStatusLabel,
  getResponseItems,
  mergeBomMaterialRows,
  resolveDefaultBom,
} from '../utils';

export const useBomVersions = ({ productionOrder, form, onVersionChange }) => {
  const [bomVersions, setBomVersions] = useState([]);
  const [selectedBomsByProductId, setSelectedBomsByProductId] = useState({});
  const [bomLoading, setBomLoading] = useState(false);

  const bomItems = useMemo(
    () => buildBomItems(productionOrder),
    [productionOrder?.orderDetails, productionOrder?.productDetails],
  );

  const products = useMemo(() => buildProducts(bomItems), [bomItems]);

  const bomMaterialGroups = useMemo(
    () => buildBomMaterialGroups(bomItems, selectedBomsByProductId),
    [bomItems, selectedBomsByProductId],
  );

  const bomRows = useMemo(
    () => mergeBomMaterialRows(bomMaterialGroups.flatMap(group => group.rows)),
    [bomMaterialGroups],
  );

  const handleVersionChange = useCallback((item, version) => {
    const selectedBom = bomVersions.find(bom => (
      String(bom.productId) === String(item.productId)
      && String(bom.version) === String(version)
    ));
    setSelectedBomsByProductId(current => ({
      ...current,
      [item.key]: selectedBom,
    }));
    form.setFieldsValue({
      bomSelections: {
        ...(form.getFieldValue('bomSelections') ?? {}),
        [item.key]: {
          orderLabel: item.orderLabel,
          version: selectedBom?.version,
          status: selectedBom ? getBomStatusLabel(selectedBom.status) : undefined,
          bomProductId: selectedBom?.bomProductId ?? null,
        },
      },
    });
    onVersionChange?.();
  }, [bomVersions, form, onVersionChange]);

  useEffect(() => {
    let mounted = true;

    const fetchBoms = async () => {
      if (products.length === 0) {
        setBomVersions([]);
        setSelectedBomsByProductId({});
        setBomLoading(false);
        form.resetFields(['bomSelections']);
        return;
      }

      setBomLoading(true);
      const results = await Promise.all(products.map(async (product) => {
        try {
          const response = await RequestUtils.Get(`/product-material/find-by-product/${product.id}`, {});
          return { product, items: getResponseItems(response), failed: false };
        } catch (error) {
          return { product, items: [], failed: true };
        }
      }));

      if (!mounted) return;

      const failedProducts = results.filter(result => result.failed);
      if (failedProducts.length > 0) {
        message.warning(`Không tải được BOM của ${failedProducts.length} sản phẩm.`);
      }

      const nextBomVersions = results.flatMap(({ product, items }) => {
        const versions = items.some(item => Array.isArray(item?.productMaterials))
          ? items
          : [{
              bomProductId: null,
              productId: product.id,
              version: 'v1.0',
              status: 1,
              productMaterials: items,
            }];

        return versions.map(bom => ({
          ...bom,
          productId: bom.productId ?? product.id,
          productName: product.name,
        }));
      });

      setBomVersions(nextBomVersions);
      const defaultBoms = Object.fromEntries(bomItems.map((item) => {
        const productBoms = nextBomVersions.filter(bom => String(bom.productId) === String(item.productId));
        const savedBomProductId = (productionOrder?.manufactureDetails ?? [])
          .find(detail => String(detail.productId) === String(item.productId))
          ?.bomProductId;
        return [item.key, resolveDefaultBom(productBoms, savedBomProductId)];
      }));
      setSelectedBomsByProductId(defaultBoms);
      form.setFieldsValue({
        bomSelections: buildBomSelectionValues(bomItems, defaultBoms),
      });
      onVersionChange?.();
      setBomLoading(false);
    };

    fetchBoms().catch(() => {
      if (mounted) {
        setBomVersions([]);
        setSelectedBomsByProductId({});
        setBomLoading(false);
        message.error('Không tải được danh sách BOM.');
      }
    });

    return () => {
      mounted = false;
    };
  }, [bomItems, form, onVersionChange, productionOrder?.manufactureDetails, products]);

  return {
    bomItems,
    bomVersions,
    bomLoading,
    bomMaterialGroups,
    bomRows,
    handleVersionChange,
  };
};

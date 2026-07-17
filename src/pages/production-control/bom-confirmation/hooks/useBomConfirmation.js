import { useCallback, useRef } from 'react';
import { Form, message } from 'antd';
import { useAllocations } from './useAllocations';
import { useBomVersions } from './useBomVersions';
import { useConfirmUsers } from './useConfirmUsers';
import { useInventories } from './useInventories';
import {
  buildMaterialConfirmationPayload,
  validateSubmitAllocations,
} from '../utils';

export const useBomConfirmation = ({
  productionOrder,
  mode = 'create',
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const resetAllocationsRef = useRef(() => {});
  const handleBomVersionReset = useCallback(() => {
    resetAllocationsRef.current();
  }, []);

  const {
    bomItems,
    bomVersions,
    bomLoading,
    bomMaterialGroups,
    bomRows,
    handleVersionChange,
  } = useBomVersions({
    productionOrder,
    form,
    onVersionChange: handleBomVersionReset,
  });

  const {
    inventoriesByMaterialId,
    inventoryLoading,
  } = useInventories(bomRows);

  const allocationsState = useAllocations({
    bomRows,
    inventoriesByMaterialId,
    mode,
    outbounds: productionOrder?.outbound,
  });

  resetAllocationsRef.current = allocationsState.resetAllocations;

  const usersState = useConfirmUsers();

  const handleSubmit = useCallback((values) => {
    const validationError = validateSubmitAllocations(bomRows, allocationsState.allocations);
    if (validationError) {
      message.error(validationError);
      return;
    }

    const materialConfirmation = buildMaterialConfirmationPayload(values, allocationsState.allocations);
    if (onConfirm) {
      onConfirm({ productionOrder, materialConfirmation });
      return;
    }
    message.success('Đã xác nhận và phân bổ vật tư');
  }, [allocationsState.allocations, bomRows, onConfirm, productionOrder]);

  return {
    form,
    bomItems,
    bomVersions,
    bomLoading,
    bomMaterialGroups,
    bomRows,
    handleVersionChange,
    inventoryLoading,
    ...allocationsState,
    ...usersState,
    handleSubmit,
  };
};

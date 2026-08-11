import { useCallback, useEffect, useRef } from "react";
import { Form, message } from "antd";
import { useAllocations } from "./useAllocations";
import { useBomVersions } from "./useBomVersions";
import { useConfirmUsers } from "./useConfirmUsers";
import { useInventories } from "./useInventories";
import {
  buildMaterialConfirmationPayload,
  validateSubmitAllocations,
} from "../utils";

export const useBomConfirmation = ({
  productionOrder,
  mode = "create",
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

  const { inventoriesByMaterialId, inventoryLoading } = useInventories(
    bomRows,
    productionOrder?.outbound,
  );

  const allocationsState = useAllocations({
    bomRows,
    inventoriesByMaterialId,
    mode,
    outbounds: productionOrder?.outbound,
  });

  resetAllocationsRef.current = allocationsState.resetAllocations;

  const usersState = useConfirmUsers();

  useEffect(() => {
    if (mode === "create") return;

    const confirmedById = productionOrder?.confirmedBy;
    if (confirmedById == null) return;

    const confirmer = usersState.users.find(
      (user) => String(user.id) === String(confirmedById),
    );
    if (confirmer) {
      form.setFieldValue("confirmedBy", confirmer.id);
    }
  }, [form, mode, productionOrder?.confirmedBy, usersState.users]);

  const handleSubmit = useCallback(
    (values) => {
      const validationError = validateSubmitAllocations(
        bomRows,
        allocationsState.allocations,
      );
      if (validationError) {
        message.error(validationError);
        return;
      }

      const materialConfirmation = buildMaterialConfirmationPayload(
        values,
        allocationsState.allocations,
      );
      if (onConfirm) {
        onConfirm({ productionOrder, materialConfirmation });
        return;
      }
      message.success("Đã xác nhận và phân bổ vật tư");
    },
    [allocationsState.allocations, bomRows, onConfirm, productionOrder],
  );

  return {
    form,
    bomItems,
    bomVersions,
    bomLoading,
    bomMaterialGroups,
    bomRows,
    handleVersionChange,
    onVersionChange: handleVersionChange,
    inventoryLoading,
    ...allocationsState,
    onOpenAllocationModal: allocationsState.openAllocationModal,
    onCloseAllocationModal: allocationsState.closeAllocationModal,
    onAddAllocation: allocationsState.addAllocation,
    onRemoveAllocation: allocationsState.removeAllocation,
    ...usersState,
    onUserDropdownOpen: usersState.handleUserDropdownOpen,
    onUserPopupScroll: usersState.handleUserPopupScroll,
    handleSubmit,
  };
};

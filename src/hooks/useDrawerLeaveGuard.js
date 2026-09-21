import { useCallback, useEffect, useRef } from 'react';
import { Modal } from 'antd';

const DEFAULT_TITLE = 'Xác nhận rời khỏi';
const DEFAULT_CONTENT = 'Các thay đổi chưa được lưu sẽ bị mất. Bạn có chắc chắn muốn rời khỏi màn hình này?';

/**
 * Cơ chế cảnh báo dùng chung cho các Drawer có form.
 *
 * - Gọi markDirty trong Form.onValuesChange.
 * - Dùng requestClose cho nút đóng, mask, ESC và nút Huỷ.
 * - Dùng closeAfterSubmit sau khi API lưu thành công để đóng mà không cảnh báo.
 */
const useDrawerLeaveGuard = ({
  open,
  onClose,
  enabled = true,
  confirmOnOpen = true,
  resetKey,
  title = DEFAULT_TITLE,
  content = DEFAULT_CONTENT,
}) => {
  const dirtyRef = useRef(Boolean(open && enabled && confirmOnOpen));
  const confirmRef = useRef(null);

  const destroyConfirm = useCallback(() => {
    confirmRef.current?.destroy?.();
    confirmRef.current = null;
  }, []);

  const markDirty = useCallback(() => {
    if (open && enabled) dirtyRef.current = true;
  }, [enabled, open]);

  const markClean = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  const closeAfterSubmit = useCallback((...args) => {
    markClean();
    destroyConfirm();
    onClose?.(...args);
  }, [destroyConfirm, markClean, onClose]);

  const guardClose = useCallback((close = onClose) => {
    if (!enabled || !dirtyRef.current) {
      markClean();
      destroyConfirm();
      close?.();
      return;
    }

    if (confirmRef.current) return;

    confirmRef.current = Modal.confirm({
      title,
      content,
      okText: 'Rời khỏi',
      okButtonProps: { danger: true },
      cancelText: 'Tiếp tục chỉnh sửa',
      centered: true,
      onOk: () => {
        confirmRef.current = null;
        markClean();
        close?.();
      },
      onCancel: () => {
        confirmRef.current = null;
      },
    });
  }, [content, destroyConfirm, enabled, markClean, onClose, title]);

  const requestClose = useCallback(() => {
    guardClose(onClose);
  }, [guardClose, onClose]);

  useEffect(() => {
    // Drawer nhập liệu luôn cần xác nhận khi người dùng chủ động rời đi.
    // Chỉ closeAfterSubmit/markClean mới bỏ qua cảnh báo này.
    dirtyRef.current = Boolean(open && enabled && confirmOnOpen);
    destroyConfirm();
  }, [confirmOnOpen, destroyConfirm, enabled, open, resetKey]);

  useEffect(() => {
    if (!open || !enabled) return undefined;

    const handleBeforeUnload = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, open]);

  useEffect(() => destroyConfirm, [destroyConfirm]);

  return {
    closeAfterSubmit,
    guardClose,
    markClean,
    markDirty,
    requestClose,
  };
};

export default useDrawerLeaveGuard;

import React from 'react';
import BomConfirmationView from './bom-confirmation/components/BomConfirmationView';
import { useBomConfirmation } from './bom-confirmation/hooks/useBomConfirmation';

const BomConfirmation = ({
  productionOrder,
  mode = 'create',
  submitting = false,
  onConfirm,
  onCancel,
  onBack,
}) => {
  const { handleSubmit, ...confirmationState } = useBomConfirmation({
    productionOrder,
    mode,
    onConfirm,
  });

  return (
    <BomConfirmationView
      mode={mode}
      submitting={submitting}
      onCancel={onCancel}
      onBack={onBack}
      onSubmit={handleSubmit}
      {...confirmationState}
    />
  );
};

export default BomConfirmation;

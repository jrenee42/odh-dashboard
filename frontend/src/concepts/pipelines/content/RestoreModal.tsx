import React from 'react';
import { usePipelinesAPI } from '#~/concepts/pipelines/context';
import FormModal from '#~/components/modals/FormModal';
import { fireFormTrackingEvent } from '#~/concepts/analyticsTracking/segmentIOUtils';
import {
  FormTrackingEventProperties,
  TrackingOutcome,
} from '#~/concepts/analyticsTracking/trackingProperties';

interface RestoreModalProps {
  onCancel: () => void;
  onSubmit: () => Promise<void[]>;
  title: string;
  alertTitle: string;
  children: React.ReactNode;
  testId: string;
  what: 'run' | 'experiment';
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  onCancel,
  onSubmit,
  title,
  children,
  testId,
  alertTitle,
  what,
}) => {
  const { refreshAllAPI } = usePipelinesAPI();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<Error>();

  const fireFormTrackingEventForRestore = React.useCallback(
    (properties: FormTrackingEventProperties) => {
      fireFormTrackingEvent(
        what === 'run' ? 'Archived Pipeline Run Restored' : 'Archived Experiment Restored',
        properties,
      );
    },
    [what],
  );

  const onConfirm = React.useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
      fireFormTrackingEventForRestore({ outcome: TrackingOutcome.submit, success: true });
      refreshAllAPI();
      setIsSubmitting(false);
      onCancel();
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
      fireFormTrackingEventForRestore({
        outcome: TrackingOutcome.submit,
        success: false,
        error: e instanceof Error ? e.message : 'unknown error',
      });

      setIsSubmitting(false);
    }
  }, [onSubmit, fireFormTrackingEventForRestore, refreshAllAPI, onCancel]);

  // right now; since this is a 'form' modal; the entire key does the submit: which is to un-archive/restore
  // the runs.  is this what we want??? figure this out TBD
  return (
    <FormModal
      title={title}
      onClose={onCancel}
      onSubmit={onConfirm}
      canSubmit={!isSubmitting}
      isSubmitting={isSubmitting}
      submitLabel="Restore"
      variant="small"
      dataTestId={testId}
      error={error}
      alertTitle={alertTitle}
      contents={children}
    />
  );
};

import * as React from 'react';
import { Flex, FlexItem, Stack, StackItem, TextInput } from '@patternfly/react-core';
import { usePipelinesAPI } from '#~/concepts/pipelines/context';
import { fireFormTrackingEvent } from '#~/concepts/analyticsTracking/segmentIOUtils';
import { TrackingOutcome } from '#~/concepts/analyticsTracking/trackingProperties';
import FormModal from '#~/components/modals/FormModal';

interface ArchiveModalProps {
  confirmMessage: string;
  title: string;
  alertTitle: string;
  onCancel: () => void;
  onSubmit: () => Promise<void[]>;
  children: React.ReactNode;
  testId: string;
  whatToArchive: 'runs' | 'experiments';
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  onCancel,
  onSubmit,
  confirmMessage,
  title,
  alertTitle,
  children,
  testId,
  whatToArchive,
}) => {
  const { refreshAllAPI } = usePipelinesAPI();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<Error>();
  const [confirmInputValue, setConfirmInputValue] = React.useState('');
  const canSubmit = confirmInputValue.trim() === confirmMessage && !isSubmitting;

  const eventName =
    whatToArchive === 'runs' ? 'Pipeline Runs Archived' : 'Pipeline Experiment Archived';

  const onClose = React.useCallback(() => {
    setConfirmInputValue('');
    onCancel();
  }, [onCancel]);

  const onCancelClose = React.useCallback(() => {
    fireFormTrackingEvent(eventName, {
      outcome: TrackingOutcome.cancel,
    });
    onClose();
  }, [onClose, eventName]);

  const onConfirm = React.useCallback(async () => {
    setIsSubmitting(true);

    try {
      await onSubmit();
      fireFormTrackingEvent(eventName, { outcome: TrackingOutcome.submit, success: true });
      refreshAllAPI();
      setIsSubmitting(false);
      onClose();
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
      fireFormTrackingEvent(eventName, {
        outcome: TrackingOutcome.submit,
        success: false,
        error: e instanceof Error ? e.message : 'unknown error',
      });

      setIsSubmitting(false);
    }
  }, [onSubmit, onClose, refreshAllAPI, eventName]);

  return (
    <FormModal
      title={title}
      onClose={onCancelClose}
      onSubmit={onConfirm}
      canSubmit={canSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Archive"
      submitButtonVariant="danger"
      variant="small"
      dataTestId={testId}
      error={error}
      alertTitle={alertTitle}
      contents={
        <Stack hasGutter>
          {children}
          <StackItem>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                Type <strong>{confirmMessage}</strong> to confirm archiving:
              </FlexItem>
              <TextInput
                id="confirm-archive-input"
                data-testid="confirm-archive-input"
                aria-label="confirm archive input"
                value={confirmInputValue}
                onChange={(_e, newValue) => setConfirmInputValue(newValue)}
              />
            </Flex>
          </StackItem>
        </Stack>
      }
    />
  );
};

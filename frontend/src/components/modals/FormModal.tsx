import * as React from 'react';
import { useRef, useEffect, useId, useCallback } from 'react';
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Button,
  ModalProps,
  ActionList,
  ActionListItem,
  ActionListGroup,
  Alert,
  Stack,
  StackItem,
  ButtonProps,
} from '@patternfly/react-core';
import '#~/concepts/dashboard/ModalStyles.scss';

type FormModalProps = {
  onClose: () => void;
  onSubmit: () => void;
  onCancel?: () => void;
  canSubmit: boolean;
  isSubmitting?: boolean;
  submitLabel: string;
  submitButtonVariant?: ButtonProps['variant'];
  contents: React.ReactNode;
  title: string | React.ReactNode;
  description?: React.ReactNode;
  disableFocusTrap?: boolean;
  dataTestId?: string;
  bodyClassName?: string;
  variant?: ModalProps['variant'];
  bodyLabel?: string;
  error?: Error | React.ReactNode;
  alertTitle?: string;
  alertLinks?: React.ReactNode;
};

// Footer component - the callbacks are stable via refs so the footer only re-renders
// when isSubmitDisabled, isSubmitting, or error changes
const FormModalFooter = React.memo(
  ({
    submitLabel,
    submitButtonVariant = 'primary',
    onSubmitClick,
    onCancelClick,
    submitButtonRef,
    cancelButtonRef,
    isSubmitDisabled,
    isSubmitting,
    error,
    alertTitle,
    alertLinks,
  }: {
    submitLabel: string;
    submitButtonVariant?: ButtonProps['variant'];
    onSubmitClick: () => void;
    onCancelClick: () => void;
    submitButtonRef: React.RefObject<HTMLButtonElement | null>;
    cancelButtonRef: React.RefObject<HTMLButtonElement | null>;
    isSubmitDisabled?: boolean;
    isSubmitting?: boolean;
    error?: Error | React.ReactNode;
    alertTitle?: string;
    alertLinks?: React.ReactNode;
  }) => (
    <Stack hasGutter style={{ flex: 'auto' }}>
      {error && (
        <StackItem>
          <Alert
            data-testid="error-message-alert"
            isInline
            variant="danger"
            title={alertTitle}
            actionLinks={alertLinks}
          >
            {error instanceof Error ? error.message : error}
          </Alert>
        </StackItem>
      )}
      <StackItem>
        <ActionList>
          <ActionListGroup>
            <ActionListItem>
              <Button
                ref={submitButtonRef}
                key="submit"
                variant={submitButtonVariant}
                isDisabled={isSubmitDisabled}
                onClick={onSubmitClick}
                isLoading={isSubmitting}
                data-testid="modal-submit-button"
              >
                {submitLabel}
              </Button>
            </ActionListItem>
            <ActionListItem>
              <Button
                ref={cancelButtonRef}
                key="cancel"
                variant="link"
                onClick={onCancelClick}
                data-testid="modal-cancel-button"
              >
                Cancel
              </Button>
            </ActionListItem>
          </ActionListGroup>
        </ActionList>
      </StackItem>
    </Stack>
  ),
);
FormModalFooter.displayName = 'FormModalFooter';

/**
 * Form Modal component with Enter key handling based on form validity.
 *
 * When canSubmit is true, pressing Enter will trigger the submit action.
 * When canSubmit is false, pressing Enter will trigger the cancel action.
 *
 * The footer uses stable callbacks via refs, so the buttons only re-render
 * when the disabled/loading state changes (which is necessary for visual feedback),
 * not when the callback functions are recreated.
 */
const FormModal: React.FC<FormModalProps> = ({
  onClose,
  onSubmit,
  onCancel,
  canSubmit,
  isSubmitting,
  submitLabel,
  submitButtonVariant,
  contents,
  title,
  description,
  disableFocusTrap = false,
  dataTestId = 'form-modal',
  bodyClassName = 'odh-modal__content-height',
  variant = 'medium',
  bodyLabel,
  error,
  alertTitle,
  alertLinks,
}) => {
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const enterPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingId = useId();

  // Use refs for callbacks so handlers don't need to re-render
  const canSubmitRef = useRef(canSubmit);
  const onSubmitRef = useRef(onSubmit);
  // Use onCancel if provided, otherwise fall back to onClose
  const onCancelRef = useRef(onCancel ?? onClose);

  // Update refs when values change
  useEffect(() => {
    canSubmitRef.current = canSubmit;
  }, [canSubmit]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    onCancelRef.current = onCancel ?? onClose;
  }, [onCancel, onClose]);

  // Clear the enter press timeout on unmount to prevent stale callbacks
  useEffect(
    () => () => {
      if (enterPressTimeoutRef.current !== null) {
        clearTimeout(enterPressTimeoutRef.current);
      }
    },
    [],
  );

  // Handle Enter key - trigger submit or cancel based on form validity
  const handleEnterPress = useCallback(() => {
    const shouldSubmit = canSubmitRef.current;
    const button = shouldSubmit ? submitButtonRef.current : cancelButtonRef.current;

    if (button) {
      // Focus the button to show visual feedback
      button.focus();

      // Clear any existing timeout before setting a new one
      if (enterPressTimeoutRef.current !== null) {
        clearTimeout(enterPressTimeoutRef.current);
      }

      // the timeout allows the user to see the button being pressed; else the modal just closes
      enterPressTimeoutRef.current = setTimeout(() => {
        if (shouldSubmit) {
          onSubmitRef.current();
        } else {
          onCancelRef.current();
        }
      }, 200);
    }
  }, []);

  // Attach native keydown listener to the modal wrapper
  // This captures Enter from any focused element inside the modal
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    // Focus the wrapper on mount so it can receive keyboard events
    wrapper.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') {
        return;
      }
      // Don't capture Enter for textareas (they need it for newlines)
      if (event.target instanceof HTMLTextAreaElement) {
        return;
      }
      // Don't capture Enter for buttons - let them handle it natively
      // This ensures that when Cancel (or any button) is focused, Enter activates it
      if (event.target instanceof HTMLButtonElement) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      handleEnterPress();
    };

    // Refocus wrapper when focus leaves the modal (e.g., after dropdown portal closes)
    const handleFocusOut = (event: FocusEvent) => {
      // Check if focus is moving outside the wrapper
      const { relatedTarget } = event;
      const isRelatedTargetInWrapper =
        relatedTarget instanceof Node && wrapper.contains(relatedTarget);
      if (!isRelatedTargetInWrapper) {
        // Use requestAnimationFrame to allow the focus to settle, then refocus if needed
        requestAnimationFrame(() => {
          if (!document.activeElement || !wrapper.contains(document.activeElement)) {
            wrapper.focus();
          }
        });
      }
    };

    // Use capture phase to intercept before child elements
    wrapper.addEventListener('keydown', handleKeyDown, true);
    wrapper.addEventListener('focusout', handleFocusOut);
    return () => {
      wrapper.removeEventListener('keydown', handleKeyDown, true);
      wrapper.removeEventListener('focusout', handleFocusOut);
    };
  }, [handleEnterPress]);

  // Stable handlers for buttons (these don't change on re-render)
  const handleSubmitClick = useCallback(() => {
    onSubmitRef.current();
  }, []);

  const handleCancelClick = useCallback(() => {
    onCancelRef.current();
  }, []);

  return (
    <Modal
      data-testid={dataTestId}
      isOpen
      variant={variant}
      onClose={onClose}
      title={typeof title === 'string' ? title : 'Modal'}
      disableFocusTrap={disableFocusTrap}
      aria-label={typeof title === 'string' ? title : undefined}
      aria-labelledby={typeof title !== 'string' ? headingId : undefined}
    >
      <div ref={wrapperRef} tabIndex={-1} style={{ outline: 'none' }}>
        <ModalHeader
          title={typeof title === 'string' ? title : undefined}
          description={typeof title === 'string' ? description : undefined}
          data-testid="form-modal-header"
        >
          {typeof title !== 'string' ? (
            <>
              <span id={headingId}>{title}</span>
              {description && <div style={{ marginTop: '8px' }}>{description}</div>}
            </>
          ) : null}
        </ModalHeader>
        <ModalBody className={bodyClassName} aria-label={bodyLabel}>
          {contents}
        </ModalBody>
        <ModalFooter>
          <FormModalFooter
            submitLabel={submitLabel}
            submitButtonVariant={submitButtonVariant}
            onSubmitClick={handleSubmitClick}
            onCancelClick={handleCancelClick}
            submitButtonRef={submitButtonRef}
            cancelButtonRef={cancelButtonRef}
            isSubmitDisabled={!canSubmit}
            isSubmitting={isSubmitting}
            error={error}
            alertTitle={alertTitle}
            alertLinks={alertLinks}
          />
        </ModalFooter>
      </div>
    </Modal>
  );
};

export default FormModal;

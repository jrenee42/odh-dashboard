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
  onCancel: () => void;
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

type FocusableDivProps = {
  children: React.ReactNode;
  onEnterPress: () => void;
  clickEnterButtonLabel: string;
};

const FocusableDiv: React.FC<FocusableDivProps> = ({
  children,
  onEnterPress,
  clickEnterButtonLabel,
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // As soon as this mounts, move focus here instead of the close button
    divRef.current?.focus();
  }, []);

  const clickEnterButtonLabelText = `Press Enter to activate the ${clickEnterButtonLabel} button.`;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      onEnterPress();
    }
  };

  return (
    <div
      ref={divRef}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="group"
      aria-label={clickEnterButtonLabelText}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
        flex: 1,
      }}
    >
      {children}
    </div>
  );
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
  disableFocusTrap,
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
  const enterPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingId = useId();

  // Use refs for callbacks so that the FocusableDiv doesn't need to re-render
  // when canSubmit changes
  const canSubmitRef = useRef(canSubmit);
  const onSubmitRef = useRef(onSubmit);
  const onCancelRef = useRef(onCancel);

  // Update refs when values change
  useEffect(() => {
    canSubmitRef.current = canSubmit;
  }, [canSubmit]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  // Clear the enter press timeout on unmount to prevent stale callbacks
  useEffect(
    () => () => {
      if (enterPressTimeoutRef.current !== null) {
        clearTimeout(enterPressTimeoutRef.current);
      }
    },
    [],
  );

  // Stable callback that reads from refs
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

  // Get the current button label for accessibility
  const clickEnterButtonLabel = canSubmit ? submitLabel : 'Cancel';

  const modalContents = (
    <FocusableDiv onEnterPress={handleEnterPress} clickEnterButtonLabel={clickEnterButtonLabel}>
      {contents}
    </FocusableDiv>
  );

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
        {modalContents}
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
    </Modal>
  );
};

export default FormModal;

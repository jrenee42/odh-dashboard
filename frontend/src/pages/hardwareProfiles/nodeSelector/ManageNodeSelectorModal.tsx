import React from 'react';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import FormModal from '#~/components/modals/FormModal';
import useGenericObjectState from '#~/utilities/useGenericObjectState';
import { useValidation } from '#~/utilities/useValidation';
import { nodeSelectorSchema } from '#~/pages/hardwareProfiles/manage/validationUtils';
import { EMPTY_NODE_SELECTOR, NodeSelectorRow } from './const';

type ManageNodeSelectorModalProps = {
  onClose: () => void;
  existingNodeSelector?: NodeSelectorRow;
  onSave: (nodeSelector: NodeSelectorRow) => void;
};

const ManageNodeSelectorModal: React.FC<ManageNodeSelectorModalProps> = ({
  onClose,
  existingNodeSelector,
  onSave,
}) => {
  const [nodeSelector, setNodeSelector] = useGenericObjectState<NodeSelectorRow>(
    existingNodeSelector || EMPTY_NODE_SELECTOR,
  );

  const handleSubmit = () => {
    onSave(nodeSelector);
    onClose();
  };

  const isValidated = useValidation(nodeSelector, nodeSelectorSchema);
  const canSubmit = isValidated.validationResult.success;

  const contents = (
    <Form>
      <FormGroup label="Key" fieldId="key" isRequired>
        <TextInput
          aria-label="Node selector key input"
          value={nodeSelector.key}
          onChange={(_, value) => setNodeSelector('key', value)}
          data-testid="node-selector-key-input"
          placeholder="Example, node.kubernetes.io/instance-type"
        />
      </FormGroup>
      <FormGroup label="Value" fieldId="value" isRequired>
        <TextInput
          aria-label="Node selector value input"
          value={nodeSelector.value}
          onChange={(_, value) => setNodeSelector('value', value)}
          data-testid="node-selector-value-input"
          placeholder="Example, m4.xlarge"
        />
      </FormGroup>
    </Form>
  );

  return (
    <FormModal
      title={existingNodeSelector ? 'Edit node selector' : 'Add node selector'}
      variant="medium"
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={canSubmit}
      submitLabel={existingNodeSelector ? 'Update' : 'Add'}
      contents={contents}
      dataTestId="manage-node-selector-modal"
    />
  );
};

export default ManageNodeSelectorModal;

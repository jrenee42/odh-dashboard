import React from 'react';
import FormModal from '#~/components/modals/FormModal';
import { Identifier, IdentifierResourceType } from '#~/types';
import useGenericObjectState from '#~/utilities/useGenericObjectState';
import { CPU_UNITS, MEMORY_UNITS_FOR_SELECTION, UnitOption } from '#~/utilities/valueUnits';
import { useValidation } from '#~/utilities/useValidation';
import { identifierSchema } from '#~/pages/hardwareProfiles/manage/validationUtils';
import { EMPTY_IDENTIFIER } from './const';
import NodeResourceForm from './NodeResourceForm';

type ManageNodeResourceModalProps = {
  onClose: () => void;
  existingIdentifier?: Identifier;
  onSave: (identifier: Identifier) => void;
  nodeResources: Identifier[];
};

const ManageNodeResourceModal: React.FC<ManageNodeResourceModalProps> = ({
  onClose,
  existingIdentifier,
  onSave,
  nodeResources,
}) => {
  const [identifier, setIdentifier] = useGenericObjectState<Identifier>(
    existingIdentifier || EMPTY_IDENTIFIER,
  );

  const [unitOptions, setUnitOptions] = React.useState<UnitOption[]>();

  const isUniqueIdentifier =
    identifier.identifier === existingIdentifier?.identifier ||
    !nodeResources.some((i) => i.identifier === identifier.identifier);

  React.useEffect(() => {
    switch (identifier.resourceType) {
      case IdentifierResourceType.CPU:
        setUnitOptions(CPU_UNITS);
        break;
      case IdentifierResourceType.MEMORY:
        setUnitOptions(MEMORY_UNITS_FOR_SELECTION);
        break;
      default:
        setUnitOptions(undefined);
    }
  }, [identifier]);

  const isModalValidated = useValidation(identifier, identifierSchema);
  const canSubmit = isUniqueIdentifier && isModalValidated.validationResult.success;

  const handleSubmit = () => {
    onSave(identifier);
    onClose();
  };

  const contents = (
    <NodeResourceForm
      identifier={identifier}
      setIdentifier={setIdentifier}
      unitOptions={unitOptions}
      isUniqueIdentifier={isUniqueIdentifier}
    />
  );

  return (
    <FormModal
      title={existingIdentifier ? 'Edit node resource' : 'Add node resource'}
      variant="medium"
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={canSubmit}
      submitLabel={existingIdentifier ? 'Update' : 'Add'}
      contents={contents}
      dataTestId="manage-node-resource-modal"
    />
  );
};

export default ManageNodeResourceModal;

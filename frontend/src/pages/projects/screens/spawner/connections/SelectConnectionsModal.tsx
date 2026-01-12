import React from 'react';
import { Flex, FlexItem, Form, FormGroup, Truncate } from '@patternfly/react-core';
import { MultiSelection, SelectionOptions } from '#~/components/MultiSelection';
import { Connection, ConnectionTypeConfigMapObj } from '#~/concepts/connectionTypes/types';
import {
  getDescriptionFromK8sResource,
  getDisplayNameFromK8sResource,
} from '#~/concepts/k8s/utils';
import { getConnectionTypeRef } from '#~/concepts/connectionTypes/utils';
import FormModal from '#~/components/modals/FormModal';
import { connectionEnvVarConflicts, DuplicateEnvVarWarning } from './DuplicateEnvVarsWarning';

type Props = {
  connectionTypes: ConnectionTypeConfigMapObj[];
  connectionsToList: Connection[];
  onSave: (connections: Connection[]) => void;
  onClose: () => void;
};

export const SelectConnectionsModal: React.FC<Props> = ({
  connectionTypes,
  connectionsToList,
  onSave,
  onClose,
}) => {
  const [selectionOptions, setSelectionOptions] = React.useState<SelectionOptions[]>(() =>
    connectionsToList.map((c) => {
      const category = connectionTypes
        .find((type) => getConnectionTypeRef(c) === type.metadata.name)
        ?.data?.category?.join(', ');
      console.log('category????', category);
      return {
        id: c.metadata.name,
        name: getDisplayNameFromK8sResource(c),
        selected: connectionsToList.length === 1,
        description: (
          <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapNone' }}>
            {getDescriptionFromK8sResource(c) && (
              <FlexItem>
                <Truncate content={getDescriptionFromK8sResource(c)} />
              </FlexItem>
            )}
            {category && (
              <FlexItem>
                <Truncate content={`Category: ${category}`} />
              </FlexItem>
            )}
          </Flex>
        ),
        data: getDescriptionFromK8sResource(c),
      };
    }),
  );

  const selectedConnections = React.useMemo(() => {
    const connectionsFromSelections: Connection[] = [];
    for (const s of selectionOptions) {
      const selected = connectionsToList.find(
        (c) => c.metadata.name === s.id && s.selected === true,
      );
      if (selected) {
        connectionsFromSelections.push(selected);
      }
    }
    return connectionsFromSelections;
  }, [connectionsToList, selectionOptions]);

  const envVarConflicts = React.useMemo(
    () => connectionEnvVarConflicts(selectedConnections),
    [selectedConnections],
  );

  const canSubmit = selectionOptions.some((selection) => selection.selected);

  return (
    <FormModal
      title="Attach existing connections"
      onClose={onClose}
      onSubmit={() => onSave(selectedConnections)}
      canSubmit={canSubmit}
      submitLabel="Attach"
      variant="medium"
      dataTestId="select-connections-modal"
      submitButtonTestId="attach-button"
      contents={
        <Form onSubmit={(e) => e.preventDefault()}>
          {envVarConflicts.length > 0 && (
            <DuplicateEnvVarWarning envVarConflicts={envVarConflicts} />
          )}
          <FormGroup label="Connections" isRequired>
            <MultiSelection
              id="select-connection"
              ariaLabel="Connections"
              placeholder="Select a connection, or search by keyword or type"
              isDisabled={connectionsToList.length === 1}
              value={selectionOptions}
              setValue={setSelectionOptions}
              filterFunction={(filterText, options) =>
                options.filter(
                  (o) =>
                    !filterText ||
                    o.name.toLowerCase().includes(filterText.toLowerCase()) ||
                    o.data?.toLowerCase().includes(filterText.toLowerCase()),
                )
              }
            />
          </FormGroup>
        </Form>
      }
    />
  );
};

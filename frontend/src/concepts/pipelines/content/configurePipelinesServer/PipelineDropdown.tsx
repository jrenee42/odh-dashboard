import { Divider, Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import React from 'react';
import { EyeIcon, EyeSlashIcon, OptimizeIcon } from '@patternfly/react-icons';
import { AWSDataEntry } from '#~/pages/projects/types';
import { PIPELINE_AWS_KEY } from '#~/pages/projects/dataConnections/const';
import { Connection } from '#~/concepts/connectionTypes/types';
import { convertObjectStorageSecretData } from '#~/concepts/connectionTypes/utils';
import { getDisplayNameFromK8sResource } from '#~/concepts/k8s/utils';
import { PipelineServerConfigType } from './types';
import { getLabelName } from './utils';

type PipelineDropdownProps = {
  setConfig: (config: PipelineServerConfigType) => void;
  config: PipelineServerConfigType;
  connections: Connection[];
};
export const PipelineDropdown = ({
  config,
  setConfig,
  connections,
}: PipelineDropdownProps): React.JSX.Element => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState<{ [key: string]: boolean }>({});

  const existingConnection = (connection: Connection): AWSDataEntry | null =>
    convertObjectStorageSecretData(connection).filter((dataItem) =>
      PIPELINE_AWS_KEY.some((filterItem) => filterItem === dataItem.key),
    );

  const onToggle = () => {
    setShowPassword({});
    setIsOpen(!isOpen);
  };

  const onSelect = (connectionName: string) => {
    setIsOpen(false);
    const value = connections.find((d) => d.metadata.name === connectionName);
    if (!value) {
      return;
    }
    const optionValue = existingConnection(value);
    const updatedObjectStorageValue = config.objectStorage.newValue.map((item) => {
      const matchingOption = optionValue?.find((optItem) => optItem.key === item.key);

      return {
        ...item,
        value: matchingOption ? matchingOption.value : item.value,
      };
    });

    setConfig({
      ...config,
      objectStorage: {
        newValue: updatedObjectStorageValue,
      },
    });
  };

  const toggleShowPassword = (connectionName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((prev) => ({
      ...prev,
      [connectionName]: !prev[connectionName],
    }));
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
      onSelect={(_event, value) => {
        if (typeof value === 'string') {
          onSelect(value);
        }
      }}
      shouldFocusFirstItemOnOpen
      focusTimeoutDelay={100}
      toggle={(toggleRef) => (
        <MenuToggle
          data-testid="select-connection"
          ref={toggleRef}
          onClick={onToggle}
          isExpanded={isOpen}
          icon={<OptimizeIcon />}
        >
          Autofill from connection 981
        </MenuToggle>
      )}
      popperProps={{ position: 'right', maxWidth: '600px' }}
    >
      <DropdownList>
        {connections.map((dataItem, index) => {
          const connectionName = dataItem.metadata.name;
          const isPasswordVisible = showPassword[connectionName];
          return (
            <React.Fragment key={connectionName}>
              {index > 0 && <Divider component="li" />}
              <DropdownItem
                value={connectionName}
                onClick={() => {
                  console.log('argh', connectionName);
                  onSelect(connectionName);
                }}
                description={
                  isPasswordVisible ? (
                    <>
                      {existingConnection(dataItem)?.map(
                        (field) =>
                          field.value && (
                            <p key={field.key}>
                              <b>{getLabelName(field.key)}</b> : {field.value}
                            </p>
                          ),
                      )}
                    </>
                  ) : (
                    '•••••••••••••••••'
                  )
                }
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{getDisplayNameFromK8sResource(dataItem)}</span>
                  <span
                    onClick={(e) => toggleShowPassword(connectionName, e)}
                    aria-label={
                      isPasswordVisible ? 'Hide connection details' : 'Show connection details'
                    }
                    style={{ cursor: 'pointer', marginLeft: '8px' }}
                  >
                    {isPasswordVisible ? <EyeSlashIcon /> : <EyeIcon />}
                  </span>
                </span>
              </DropdownItem>
            </React.Fragment>
          );
        })}
      </DropdownList>
    </Dropdown>
  );
};

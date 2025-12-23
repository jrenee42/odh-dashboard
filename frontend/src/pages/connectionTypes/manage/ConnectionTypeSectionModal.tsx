import * as React from 'react';
import { Form, FormGroup, TextInput, TextArea, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { SectionField } from '#~/concepts/connectionTypes/types';
import DashboardPopupIconButton from '#~/concepts/dashboard/DashboardPopupIconButton';
import useGenericObjectState from '#~/utilities/useGenericObjectState';
import FormModal from '#~/components/modals/FormModal';

type Props = {
  field?: SectionField;
  onClose: () => void;
  onSubmit: (field: SectionField) => void;
  isEdit?: boolean;
};

const ConnectionTypeSectionModal: React.FC<Props> = ({ field, onClose, onSubmit, isEdit }) => {
  const [data, setData] = useGenericObjectState({
    name: field?.name || '',
    description: field?.description || '',
  });
  const canSubmit = React.useRef(data).current !== data || !isEdit;
  const { name, description } = data;
  const isValid = name.length > 0;

  const handleSubmit = React.useCallback(() => {
    if (isValid) {
      onSubmit({ type: 'section', name, description });
      onClose();
    }
  }, [isValid, onSubmit, name, description, onClose]);

  return (
    <FormModal
      title={isEdit ? 'Edit section heading' : 'Add section heading'}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={canSubmit && isValid}
      submitLabel={isEdit ? 'Save' : 'Add'}
      variant="medium"
      contents={
        <Form>
          <FormGroup
            label="Section heading"
            isRequired
            fieldId="section-name"
            labelHelp={
              <Popover
                headerContent="Section heading"
                bodyContent="Use section headings to indicate groups of related fields. Use descriptive headings, for example, Details, Configuration, Preferences."
              >
                <DashboardPopupIconButton
                  icon={<OutlinedQuestionCircleIcon />}
                  aria-label="More info for section heading"
                />
              </Popover>
            }
          >
            <TextInput
              isRequired
              id="section-name"
              data-testid="section-name"
              value={name}
              onChange={(_e, value) => setData('name', value)}
            />
          </FormGroup>
          <FormGroup
            label="Section description"
            fieldId="section-description"
            labelHelp={
              <Popover
                headerContent="Section description"
                bodyContent="Use section descriptions to summarize the required input."
              >
                <DashboardPopupIconButton
                  icon={<OutlinedQuestionCircleIcon />}
                  aria-label="More info for section description"
                />
              </Popover>
            }
          >
            <TextArea
              id="section-description"
              data-testid="section-description"
              value={description}
              onChange={(_e, value) => setData('description', value)}
            />
          </FormGroup>
        </Form>
      }
    />
  );
};

export default ConnectionTypeSectionModal;

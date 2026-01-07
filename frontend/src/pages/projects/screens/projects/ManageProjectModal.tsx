import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { createProject, updateProject } from '#~/api';
import { useUser } from '#~/redux/selectors';
import { ProjectKind } from '#~/k8sTypes';
import { ProjectsContext } from '#~/concepts/projects/ProjectsContext';
import { fireFormTrackingEvent } from '#~/concepts/analyticsTracking/segmentIOUtils';
import { TrackingOutcome } from '#~/concepts/analyticsTracking/trackingProperties';
import K8sNameDescriptionField, {
  useK8sNameDescriptionFieldData,
} from '#~/concepts/k8s/K8sNameDescriptionField/K8sNameDescriptionField';
import {
  isK8sNameDescriptionDataValid,
  LimitNameResourceType,
} from '#~/concepts/k8s/K8sNameDescriptionField/utils';
import FormModal from '#~/components/modals/FormModal';

type ManageProjectModalProps = {
  editProjectData?: ProjectKind;
  onClose: (newProjectName?: string) => void;
};

const ManageProjectModal: React.FC<ManageProjectModalProps> = ({ editProjectData, onClose }) => {
  const { waitForProject } = React.useContext(ProjectsContext);
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();
  const k8sNameDescriptionData = useK8sNameDescriptionFieldData({
    initialData: editProjectData,
    limitNameResourceType: LimitNameResourceType.PROJECT,
  });
  const { username } = useUser();

  const canSubmit = !fetching && isK8sNameDescriptionDataValid(k8sNameDescriptionData.data);

  const onBeforeClose = (newProjectName?: string) => {
    onClose(newProjectName);
    if (newProjectName) {
      fireFormTrackingEvent(editProjectData ? 'Project Edited' : 'NewProject Created', {
        outcome: TrackingOutcome.submit,
        success: true,
        projectName: newProjectName,
      });
    }
  };
  const handleError = (e: Error) => {
    fireFormTrackingEvent(editProjectData ? 'Project Edited' : 'NewProject Created', {
      outcome: TrackingOutcome.submit,
      success: false,
      projectName: '',
      error: e.message,
    });
    setError(e);
    setFetching(false);
  };

  const submit = () => {
    setFetching(true);
    const {
      name,
      description,
      k8sName: { value: k8sName },
    } = k8sNameDescriptionData.data;
    if (editProjectData) {
      updateProject(editProjectData, name, description)
        .then(() => onBeforeClose())
        .catch(handleError);
    } else {
      createProject(username, name, description, k8sName)
        .then((projectName) => waitForProject(projectName).then(() => onBeforeClose(projectName)))
        .catch(handleError);
    }
  };

  const handleCancel = () => {
    onBeforeClose();
    fireFormTrackingEvent(editProjectData ? 'Project Edited' : 'NewProject Created', {
      outcome: TrackingOutcome.cancel,
    });
  };

  const contents = (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <K8sNameDescriptionField
        autoFocusName
        dataTestId="manage-project-modal"
        maxLength={250}
        maxLengthDesc={5500}
        {...k8sNameDescriptionData}
      />
    </Form>
  );

  return (
    <FormModal
      title={editProjectData ? 'Edit project' : 'Create project'}
      onClose={() => onBeforeClose()}
      onSubmit={submit}
      onCancel={handleCancel}
      canSubmit={canSubmit}
      isSubmitting={fetching}
      submitLabel={editProjectData ? 'Update' : 'Create'}
      contents={contents}
      error={error}
      alertTitle={editProjectData ? 'Error updating project' : 'Error creating project'}
      dataTestId="manage-project-modal"
    />
  );
};

export default ManageProjectModal;

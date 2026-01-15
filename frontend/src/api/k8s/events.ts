import { k8sListResourceItems } from '@openshift/dynamic-plugin-sdk-utils';
import { EventKind } from '#~/k8sTypes';
import { EventModel } from '#~/api/models';
import useK8sWatchResourceList from '#~/utilities/useK8sWatchResourceList';
import { CustomWatchK8sResult } from '#~/types';
import { groupVersionKind } from '..';

export const getNotebookEvents = async (
  namespace: string,
  notebookName: string,
  podUid: string | undefined,
): Promise<EventKind[]> =>
  k8sListResourceItems<EventKind>({
    model: EventModel,
    queryOptions: {
      ns: namespace,
      queryParams: {
        fieldSelector: podUid
          ? `involvedObject.kind=Pod,involvedObject.uid=${podUid}`
          : `involvedObject.kind=StatefulSet,involvedObject.name=${notebookName}`,
      },
    },
  });

export const useWatchNotebookEvents = (
  namespace: string,
  name: string,
  podUid?: string,
): CustomWatchK8sResult<EventKind[]> => {
  const fieldSelector = podUid
    ? `involvedObject.kind=Pod,involvedObject.uid=${podUid}`
    : `involvedObject.kind=StatefulSet,involvedObject.name=${name}`;

  console.log('[DEBUG-EVENTS] useWatchNotebookEvents called:', {
    namespace,
    name,
    podUid: podUid || '(empty)',
    fieldSelector,
  });

  const result = useK8sWatchResourceList<EventKind[]>(
    {
      isList: true,
      groupVersionKind: groupVersionKind(EventModel),
      namespace,
      fieldSelector,
    },
    EventModel,
  );

  // Log raw events from the hook
  const events = result[0];
  console.log('[DEBUG-EVENTS] Raw events for', name, ':', {
    eventCount: events.length,
    loaded: result[1],
    error: result[2]?.message,
    events: events.map((e) => ({
      reason: e.reason,
      message: e.message.substring(0, 50),
      involvedObject: e.involvedObject,
      timestamp: e.lastTimestamp || e.eventTime,
    })),
  });

  return result;
};

// get all the events for all the pods in the namespace
export const useWatchPodEvents = (namespace: string): CustomWatchK8sResult<EventKind[]> =>
  useK8sWatchResourceList(
    {
      isList: true,
      groupVersionKind: groupVersionKind(EventModel),
      namespace,
      fieldSelector: 'involvedObject.kind=Pod',
    },
    EventModel,
  );

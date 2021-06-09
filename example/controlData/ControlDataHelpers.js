
export const networkingControlData = [
  ///////////////////////  networking  /////////////////////////////////////
  {
    id: 'networking',
    type: 'section',
    title: 'creation.ocp.networking',
    overline: true,
    collapsable: true,
    collapsed: true,
  },
  {
    id: 'networkType',
    name: 'creation.ocp.cluster.network.type',
    tooltip: 'tooltip.creation.ocp.cluster.network.type',
    type: 'singleselect',
    active: 'OpenShiftSDN',
    available: ['OpenShiftSDN', 'OVNKubernetes'],
    validation: {
      notification: 'creation.ocp.cluster.valid.key',
      required: true,
    },
  },
]

export const labelControlData = [
  ///////////////////////  purpose  /////////////////////////////////////
  {
    name: 'creation.ocp.addition.labels',
    tooltip: 'tooltip.creation.ocp.addition.labels',
    id: 'additional',
    type: 'labels',
    active: [],
  },
]

export const automationControlData = [
  ///////////////////////  automation  /////////////////////////////////////
  {
    id: 'integrationStep',
    type: 'step',
    title: 'template.clusterCreate.title',
  },
  {
    id: 'chooseTemplate',
    type: 'title',
    info: 'template.clusterCreate.info',
  },
  {
    name: 'template.clusterCreate.name',
    id: 'templateName',
    type: 'singleselect',
    placeholder: 'template.clusterCreate.select.placeholder',
    available: [],
    validation: {
      required: false,
    },
  },
]

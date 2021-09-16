import {
  networkingControlData,
  automationControlData,
  labelControlData,
} from './ControlDataHelpers'
import {
  ControlMode,
} from '../../src/utils/source-utils'
import {
  VALIDATE_ALPHANUMERIC,
  VALIDATE_MAC_ADDRESS,
} from '../../src/utils/validation-types'
import _ from 'lodash'

const sortTable = (items, selectedKey, sortDirection, active) => {
  if (selectedKey === 'role' && active.length > 0) {
    const sorting = ['master', 'worker', 'unactive']
    const activeMap = _.keyBy(active, 'id')
    items.sort(({ id: a }, { id: b }) => {
      if (activeMap[a] && !activeMap[b]) {
        return -1
      } else if (!activeMap[a] && activeMap[b]) {
        return 1
      } else {
        return (
          (sorting.indexOf(_.get(activeMap[a], 'role', 'unactive')) -
                        sorting.indexOf(_.get(activeMap[b], 'role', 'unactive'))) *
                    (sortDirection === 'asc' ? 1 : -1)
        )
      }
    })
    return items
  }
  return _.orderBy(items, [selectedKey], [sortDirection])
}

const validateTable = (active = []) => {
  let master = 0
  active.forEach(({ role }) => {
    if (role === 'master') {
      master++
    }
  })
  if (master < 3) {
    return 'creation.ocp.validation.errors.hosts'
  }
  return null
}

const getActiveRole = (active = []) => {
  let master = 0
  active.forEach(({ role }) => {
    if (role === 'master') {
      master++
    }
  })
  return master < 3 ? 'master' : 'worker'
}

const WorkerInstanceTypes = [
  {
    label: 'General Purpose',
    children: [
      {
        label: 'E2 machine types',
        children: [
          {
            label: 'E2 standard machine types',
            children: [
              { value: 'e2-standard-2', description: '2 vCPU, 8 GB RAM - General Purpose' },
              { value: 'e2-standard-4', description: '4 vCPU, 16 GB RAM - General Purpose' },
              { value: 'e2-standard-8', description: '8 vCPU, 32 GB RAM - General Purpose' },
              { value: 'e2-standard-16', description: '16 vCPU, 64 GB RAM - General Purpose' },
            ],
          },
          {
            label: 'E2 high-memory machine types',
            children: [
              { value: 'e2-highmem-2', description: '2 vCPU, 16 GB RAM - General Purpose' },
              { value: 'e2-highmem-4', description: '4 vCPU, 32 GB RAM - General Purpose' },
              { value: 'e2-highmem-8', description: '8 vCPU, 64 GB RAM - General Purpose' },
              { value: 'e2-highmem-16', description: '16 vCPU, 128 GB RAM - General Purpose' },
            ],
          },
          {
            label: 'E2 high-CPU machine types',
            children: [
              { value: 'e2-highcpu-2', description: '2 vCPU, 2 GB RAM - General Purpose' },
              { value: 'e2-highcpu-4', description: '4 vCPU, 4 GB RAM - General Purpose' },
              { value: 'e2-highcpu-8', description: '8 vCPU, 8 GB RAM - General Purpose' },
              { value: 'e2-highcpu-16', description: '16 vCPU, 16 GB RAM - General Purpose' },
            ],
          },
        ],
      },
    ]
  }]

const controlDataBMC = [
  ////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////  imageset  /////////////////////////////////////
  {
    name: 'cluster.create.ocp.image',
    tooltip: 'tooltip.cluster.create.ocp.image',
    id: 'imageSet',
    type: 'combobox',
    placeholder: 'creation.ocp.cloud.select.ocp.image',
    available: [
      'quay.io/openshift-release-dev/ocp-release:4.3.40-x86_64',
      'quay.io/openshift-release-dev/ocp-release:4.4.33-x86_64',
      'quay.io/openshift-release-dev/ocp-release:4.5.31-x86_64',
      'quay.io/openshift-release-dev/ocp-release:4.6.16-x86_64'
    ],
    availableMap: {
      'quay.io/openshift-release-dev/ocp-release:4.3.40-x86_64': {
        replacements: {
          clusterImageSetComment: 'quay.io/openshift-release-dev/ocp-release:4.3.40-x86_64',
          releaseImageReference: 'img4.3.40-x86-64-appsub',
          releaseImageVersion: '4.3.40'
        }
      },
      'quay.io/openshift-release-dev/ocp-release:4.4.33-x86_64': {
        replacements: {
          clusterImageSetComment: 'quay.io/openshift-release-dev/ocp-release:4.4.33-x86_64',
          releaseImageReference: 'img4.4.33-x86-64-appsub',
          releaseImageVersion: '4.4.33'
        }
      },
      'quay.io/openshift-release-dev/ocp-release:4.5.31-x86_64': {
        replacements: {
          clusterImageSetComment: 'quay.io/openshift-release-dev/ocp-release:4.5.31-x86_64',
          releaseImageReference: 'img4.5.31-x86-64-appsub',
          releaseImageVersion: '4.5.31'
        }
      },
    },
    validation: {
      notification: 'creation.ocp.cluster.must.select.ocp.image',
      required: true,
    },
  },

  ////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////  connection  /////////////////////////////////////
  ...labelControlData,
  {
    name: 'creation.ocp.instance.type',
    tooltip: 'tooltip.creation.ocp.gcp.instance.type',
    learnMore: 'https://cloud.google.com/compute/docs/machine-types',
    id: 'workerType',
    type: 'treeselect',
    available: WorkerInstanceTypes,
    active: 'n1-standard-4',
    validation: {
      constraint: '[A-Za-z0-9-]+',
      notification: 'creation.ocp.cluster.valid.alphanumeric.period',
      required: false,
    },
    cacheUserValueKey: 'create.cluster.worker.type',
  },

  ///////////////////////  hosts  /////////////////////////////////////
  {
    id: 'hostsSections',
    type: 'section',
    title: 'creation.ocp.cluster.hosts',
    tooltip: 'tooltip.creation.ocp.cluster.hosts',
    overline: true,
    collapsable: true,
    shadowed: true,
  },
  {
    id: 'chooseHosts',
    type: 'title',
    info: 'creation.ocp.choose.hosts',
  },
  {
    id: 'hosts',
    type: 'table',
    validation: {
      tester: validateTable.bind(null),
    },
    sortTable,
    summaryKey: 'hostName', // when table is collapsed, collapsed summary is composed of a list of this table value
    controlData: [
      ///////////////////////  host name  /////////////////////////////////////
      {
        name: 'creation.ocp.host.name',
        id: 'hostName',
        type: 'text',
        validation: VALIDATE_ALPHANUMERIC,
      },
      {
        name: 'creation.ocp.host.namespace',
        id: 'hostNamespace',
        type: 'text',
        validation: VALIDATE_ALPHANUMERIC,
      },
      {
        name: 'creation.ocp.host.role',
        id: 'role',
        type: 'toggle',
        active: getActiveRole,
        available: ['master', 'worker'],
        validation: {
          notification: 'creation.ocp.cluster.valid.key',
          required: true,
        },
      },
      {
        name: 'creation.ocp.host.bmc.address',
        id: 'bmcAddress',
        type: 'text',
      },
      {
        name: 'creation.ocp.host.mac.address',
        id: 'macAddress',
        type: 'text',
        validation: VALIDATE_MAC_ADDRESS,
        mode: ControlMode.PROMPT_ONLY,
      },
      {
        name: 'creation.ocp.host.user',
        id: 'username',
        type: 'text',
        active: '# injected by server',
        validation: VALIDATE_ALPHANUMERIC,
        mode: ControlMode.PROMPT_ONLY,
      },
      {
        name: 'creation.ocp.host.password',
        id: 'password',
        type: 'password',
        active: '# injected by server',
        mode: ControlMode.PROMPT_ONLY,
      },
    ],
    available: [
      {
        bmcAddress: 'idrac-virtualmedia://machine.net',
        credName: 'bma1-bmc-secret-aiqw6'       ,
        credNamespace: 'default'            ,
        hostName: 'bma1'                ,
        hostNamespace: 'default'            ,
        id: '9049a48d-c77a-48f9-974e-6ff59f5ab715'    ,
        macAddress: '00:44:22:22:44:88'
      },{
        bmcAddress: 'idrac-virtualmedia://machine.net',
        credName: 'bma2-bmc-secret-ze0es'       ,
        credNamespace: 'default'            ,
        hostName: 'bma2'                ,
        hostNamespace: 'default'            ,
        id: '0c28e8de-6620-4a48-b448-22361ada9398'    ,
        macAddress: '00:44:22:22:44:88'
      },{

        bmcAddress: 'idrac-virtualmedia://machine.net',
        credName: 'bma3-bmc-secret-vf9al'       ,
        credNamespace: 'default'            ,
        hostName: 'bma3'                ,
        hostNamespace: 'default'            ,
        id: '706c60f4-7553-4fd4-b127-a2416a1992cd',
        macAddress: '00:44:22:22:44:88'
      },{

        bmcAddress: 'ipmi://[fd2e:6f44:5dd8::1]:6230' ,
        credName: 'bma4-bmc-secret'           ,
        credNamespace: 'cassandra-app-ns'       ,
        hostName: 'bma4'                ,
        hostNamespace: 'cassandra-app-ns'       ,
        id: 'b941ea15-dc10-43c7-92cc-cae8701db484'    ,
        macAddress: '52:54:00:cc:73:cb'
      },{
        bmcAddress: 'idrac-virtualmedia://machine.net',
        credName: 'bma4-bmc-secret-fc5er'       ,
        credNamespace: 'default'            ,
        hostName: 'bma4'                ,
        hostNamespace: 'default'            ,
        id: '1d4c020c-71ce-48a6-b5aa-46861b629b12'    ,
        macAddress: '00:44:22:22:44:88'
      }
    ],
    active: [],
  },
  {
    id: 'disableCertificateVerification',
    type: 'checkbox',
    name: 'creation.ocp.host.disable.certificate.verification',
    tooltip: 'tooltip.creation.ocp.host.disable.certificate.verification',
    active: 'true',
    available: ['false', 'true'],
  },
  ...networkingControlData,
  ...automationControlData
]

export default controlDataBMC

import {
  networkingControlData,
  labelControlData,
} from './ControlDataHelpers'
import {
  ControlMode,
} from '../../src/utils/source-utils'
import {
  VALIDATE_CIDR,
  VALIDATE_IP_AGAINST_MACHINE_CIDR,
  VALIDATE_IP_AGAINST_MACHINE_CIDR_OPTIONAL,
  VALIDATE_ALPHANUMERIC,
  VALIDATE_ALPHANUMERIC_PERIOD,
  VALIDATE_MAC_ADDRESS,
} from '../../src/utils/validation-types'
//import { listBareMetalAssets } from '../../../../../resources/bare-metal-asset'
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
              { value: 'e2-standard-2', description: '2 vCPU, 8 GiB RAM - General Purpose' },
              { value: 'e2-standard-4', description: '4 vCPU, 16 GiB RAM - General Purpose' },
              { value: 'e2-standard-8', description: '8 vCPU, 32 GiB RAM - General Purpose' },
              { value: 'e2-standard-16', description: '16 vCPU, 64 GiB RAM - General Purpose' },
            ],
          },
          {
            label: 'E2 high-memory machine types',
            children: [
              { value: 'e2-highmem-2', description: '2 vCPU, 16 GiB RAM - General Purpose' },
              { value: 'e2-highmem-4', description: '4 vCPU, 32 GiB RAM - General Purpose' },
              { value: 'e2-highmem-8', description: '8 vCPU, 64 GiB RAM - General Purpose' },
              { value: 'e2-highmem-16', description: '16 vCPU, 128 GiB RAM - General Purpose' },
            ],
          },
          {
            label: 'E2 high-CPU machine types',
            children: [
              { value: 'e2-highcpu-2', description: '2 vCPU, 2 GiB RAM - General Purpose' },
              { value: 'e2-highcpu-4', description: '4 vCPU, 4 GiB RAM - General Purpose' },
              { value: 'e2-highcpu-8', description: '8 vCPU, 8 GiB RAM - General Purpose' },
              { value: 'e2-highcpu-16', description: '16 vCPU, 16 GiB RAM - General Purpose' },
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
    //fetchAvailable: LOAD_OCP_IMAGES('bmc'),
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
    //    fetchAvailable: {
    //            query: () => {
    //              return listBareMetalAssets().promise
    //            },
    //      loadingDesc: 'table.bma.loading',
    //      setAvailable: setAvailableBMAs,
    //    },
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
  {
    id: 'provisioningNetworkCIDR',
    type: 'text',
    name: 'creation.ocp.network.cidr',
    tooltip: 'tooltip.creation.ocp.network.cidr',
    active: '',
    validation: VALIDATE_CIDR,
  },
  {
    id: 'provisioningNetworkInterface',
    type: 'text',
    name: 'creation.ocp.network.interface',
    tooltip: 'tooltip.creation.ocp.network.interface',
    active: 'enp1s0',
    validation: VALIDATE_ALPHANUMERIC,
  },
  {
    id: 'provisioningNetworkBridge',
    type: 'text',
    name: 'creation.ocp.network.bridge',
    tooltip: 'tooltip.creation.ocp.network.bridge',
    active: 'provisioning',
    validation: VALIDATE_ALPHANUMERIC_PERIOD,
  },
  {
    id: 'externalNetworkBridge',
    type: 'text',
    name: 'creation.ocp.external.bridge',
    tooltip: 'tooltip.creation.ocp.external.bridge',
    active: 'baremetal',
    validation: VALIDATE_ALPHANUMERIC_PERIOD,
  },
  {
    id: 'dnsVIP',
    type: 'text',
    name: 'creation.ocp.dns.vip',
    hidden: 'true',
    tooltip: 'tooltip.creation.ocp.dns.vip',
    active: '',
    validation: VALIDATE_IP_AGAINST_MACHINE_CIDR,
  },
  {
    id: 'apiVIP',
    type: 'text',
    name: 'creation.ocp.api.vip',
    tooltip: 'tooltip.creation.ocp.api.vip',
    active: '',
    validation: VALIDATE_IP_AGAINST_MACHINE_CIDR_OPTIONAL,
  },
]

export default controlDataBMC

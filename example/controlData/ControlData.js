'use strict'

import gitChannelData from './ControlDataGit'

import {
  discoverGroupsFromSource,
  shiftTemplateObject
} from '../transformers/transform-resources-to-controls'

import gitSvg from '../graphics/git-repo.svg'
const VALID_DNS_LABEL = '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'

const controlDataExample = [
  {
    id: 'main',
    type: 'section',
    note: 'creation.view.required.mark'
  },
  {
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    id: 'name',
    type: 'text',
    validation: {
      constraint: VALID_DNS_LABEL,
      notification: 'import.form.invalid.dns.label',
      required: true
    },
    reverse: 'Application[0].metadata.name'
  },
  {
    name: 'creation.app.namespace',
    tooltip: 'tooltip.creation.app.namespace',
    id: 'namespace',
    type: 'combobox',
    validation: {
      constraint: VALID_DNS_LABEL,
      notification: 'import.form.invalid.dns.label',
      required: true
    },
    reverse: 'Application[0].metadata.namespace'
  },
  {
    id: 'userDefinedNamespace',
    type: 'hidden',
    active: ''
  },
  ////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////  channels  /////////////////////////////////////
  {
    id: 'channelSection',
    type: 'section',
    title: 'creation.app.channels',
    overline: true,
    collapsable: true,
    collapsed: false
  },
  ///////////////////////  channels  /////////////////////////////////////
  {
    id: 'channels',
    type: 'group',
    prompts: {
      nameId: 'channelPrompt',
      baseName: 'resource',
      addPrompt: 'creation.app.add.channel',
      deletePrompt: 'creation.app.delete.channel'
    },
    discover: discoverGroupsFromSource,
    shift: shiftTemplateObject,
    controlData: [
      {
        id: 'channel',
        type: 'section',
        title: 'creation.app.channel.title',
        collapsable: true,
        collapsed: false,
      },
      ///////////////////////  channel name  /////////////////////////////////////
      {
        id: 'channelPrompt',
        type: 'hidden',
        active: ''
      },
      {
        id: 'selfLinks',
        type: 'hidden',
        active: ''
      },
      {
        id: 'channelType',
        type: 'cards',
        sort: false,
        collapseCardsControlOnSelect: true,
        scrollViewToTopOnSelect: true,
        title: 'creation.app.channel.type',
        collapsable: true,
        collapsed: false,
        available: [
          {
            id: 'github',
            logo: gitSvg,
            title: 'channel.type.git',
            tooltip: 'tooltip.creation.app.channel.git',
            change: {
              insertControlData: gitChannelData
            }
          },
        ],
        active: '',
        validation: {}
      }
    ]
  }
]

export default controlDataExample

'use strict'

import {
  VALIDATE_ALPHANUMERIC,
  VALID_REPOPATH,
  VALIDATE_URL
} from 'temptifly'


const githubChannelData = [
  ///////////////////////  github  /////////////////////////////////////
  {
    id: 'channelNamespaceExists',
    type: 'hidden',
    active: true
  },
  {
    id: 'channelName',
    type: 'hidden',
    active: ''
  },
  {
    id: 'channelNamespace',
    type: 'hidden',
    active: ''
  },
  {
    name: 'creation.app.github.url',
    tooltip: 'tooltip.creation.app.github.url',
    id: 'githubURL',
    type: 'combobox',
    active: '',
    placeholder: 'app.enter.select.github.url',
    available: [],
    validation: VALIDATE_URL,
    reverse: 'Channel[0].spec.pathname',
  },
  {
    name: 'creation.app.github.user',
    tooltip: 'tooltip.creation.app.github.user',
    id: 'githubUser',
    type: 'text',
    editing: { hidden: true }, // if editing existing app, hide this field initially
    active: '',
    encode: true,
    placeholder: 'app.enter.select.username',
  },
  {
    name: 'creation.app.github.accessid',
    tooltip: 'tooltip.creation.app.github.accessid',
    id: 'githubAccessId',
    type: 'password',
    editing: { hidden: true }, // if editing existing app, hide this field initially
    encode: true,
    active: '',
    placeholder: 'app.enter.access.token',
  },
  {
    name: 'creation.app.github.branch',
    tooltip: 'tooltip.creation.app.github.branch',
    id: 'githubBranch',
    type: 'combobox',
    active: '',
    placeholder: 'app.enter.select.branch',
    available: [],
    validation: VALIDATE_ALPHANUMERIC,
    reverse: [
      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/github-branch"]',
      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/git-branch"]'
    ],
    cacheUserValueKey: 'create.app.github.branch'
  },
  {
    name: 'creation.app.github.path',
    tooltip: 'tooltip.creation.app.github.path',
    id: 'githubPath',
    type: 'combobox',
    active: '',
    placeholder: 'app.enter.select.path',
    available: [],
    validation: VALID_REPOPATH,
    reverse: [
      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/github-path"]',
      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/git-path"]'
    ],
    cacheUserValueKey: 'create.app.github.path'
  },
  {
    id: 'gitReconcileOption',
    type: 'checkbox',
    name: 'creation.app.github.reconcileOption',
    tooltip: 'tooltip.creation.app.github.reconcileOption',
    active: false,
    available: [],
    reverse:
      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/reconcile-option"]'
  },
  {
    id: 'gitInsecureSkipVerify',
    type: 'checkbox',
    name: 'creation.app.insecureSkipVerify.label',
    tooltip: 'creation.app.insecureSkipVerify.git.tooltip',
    active: false,
    available: [],
    editing: { hidden: true } // if editing existing app, hide this field initially
  },
]

export default githubChannelData

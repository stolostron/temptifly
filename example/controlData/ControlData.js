import React from 'react'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'
import configHbs from '../templates/config.hbs'

import controlDataBMC from './ControlDataBMC'
import { BaremetalLogo } from './Logos'
import { VALID_DNS_LABEL } from '../../src/utils/validation-types'

const installConfig =
    typeof configHbs !== 'string'
      ? configHbs
      : Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../templates/config.hbs'), 'utf8'))

const controlData = [
  {
    id: 'main',
    type: 'section',
    title: 'creation.ocp.cluster.details',
    collapsable: true,
  },
  {
    name: 'creation.ocp.name',
    tooltip: 'tooltip.creation.ocp.name',
    id: 'name',
    type: 'text',
    validation: {
      constraint: VALID_DNS_LABEL,
      notification: 'import.form.invalid.dns.label',
      required: true,
    },
    reverse: 'ClusterDeployment[0].metadata.name',
  },
  {
    id: 'showSecrets',
    type: 'hidden',
    active: false,
  },

  ///////////////////////  container platform  /////////////////////////////////////
  {
    id: 'chooseDist',
    type: 'section',
    title: 'creation.ocp.distribution',
    info: 'creation.ocp.choose.distribution',
    tooltip: 'tooltip.creation.ocp.choose.distribution',
    overline: true,
    collapsable: true,
  },
  ///////////////////////  cloud  /////////////////////////////////////
  {
    id: 'chooseInfra',
    type: 'title',
    tooltip: 'tooltip.creation.ocp.choose.aws.infrastructure',
    learnMore: 'https://docs.openshift.com/container-platform/4.3/installing/',
  },
  {
    id: 'infrastructure',
    type: 'cards',
    sort: false,
    pauseControlCreationHereUntilSelected: true,
    scrollViewAfterSelection: 300,
    available: [
      {
        id: 'BMC',
        logo: <BaremetalLogo />,
        title: 'cluster.create.baremetal.subtitle',
        change: {
          insertControlData: controlDataBMC,
          replacements: {
            'install-config': { template: installConfig, encode: true, newTab: true },
          },
        },
      },
    ],
    validation: {
      notification: 'creation.ocp.cluster.must.select.infrastructure',
      required: true,
    },
  },
]

export default controlData

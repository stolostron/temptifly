'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Checkbox } from 'carbon-components-react'
import {
  getSourcePath, removeVs
} from '../../src/utils/source-utils' //'temptifly'
import Tooltip from '../../src/components/Tooltip' //'temptifly'
import './style.scss'
import _ from 'lodash'

export class CustomControl extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const { controlId, control, i18n } = this.props
    const { name, active, validation = {} } = control
    const modeSelected = active && active.mode === true
    const isReadOnly = _.get(this.props, 'control.showData', []).length > 0

    return (
      <React.Fragment>
        <div className="creation-view-controls-labels">
          <div>
            {name}
            {validation.required ? (
              <div className="creation-view-controls-required">*</div>
            ) : null}
            <Tooltip control={control} i18n={i18n} />
          </div>

          <div className="clusterSelector-container">
            <Checkbox
              className="clusterSelector-checkbox"
              name="clusterSelector-checkbox"
              checked={modeSelected}
              disabled={isReadOnly}
              id={`clusterSelector-checkbox-${controlId}`}
              labelText={i18n('tooltip.creation.app.settings.clusterSelector')}
              onClick={this.handleChange.bind(this)}
            />

          </div>
        </div>
      </React.Fragment>
    )
  }

  validation(exceptions) {
    const { control, i18n, controlId } = this.props
    if (_.get(control, 'active.mode', false)) {
      if (Object.keys(control.active.clusterLabelsList).length === 0) {
        //no cluster labels set
        exceptions.push({
          row: 1,
          text: i18n('creation.missing.clusterSelector.value'),
          type: 'error',
          controlId: `clusterSelector-labels-section-${controlId}`
        })
      }
    }
  }

  handleChange(event) {
    const { control, handleChange } = this.props
    let targetName = ''
    try {
      targetName = event.target.name
    } catch (e) {
      targetName = ''
    }

    if (targetName) {
      const { active } = control
      if (targetName === 'clusterSelector-checkbox') {
        active.mode = event.target.checked ? true : false
      } else {
        const { clusterLabelsList } = active
        const labelID = parseInt(event.target.id.split('-')[1], 0)
        if (targetName === 'labelName') {
          clusterLabelsList[labelID].labelName = event.target.value
        } else if (targetName === 'labelValue') {
          clusterLabelsList[labelID].labelValue = event.target.value
        }
        clusterLabelsList[labelID].validValue = true
      }
    }

    handleChange(control)
  }
}

export default CustomControl

export const summarize = (control, controlData, summary) => {
  const { clusterLabelsList } = control.active || {}
  if (
    clusterLabelsList &&
    _.get(control, 'type', '') !== 'hidden' &&
    _.get(control, 'active.mode')
  ) {
    clusterLabelsList.forEach(({ labelName, labelValue }) => {
      if (labelName && labelValue) {
        summary.push(`${labelName}=${labelValue}`)
      }
    })
  }
}

export const reverse = (control, templateObject) => {
  if (!control.active) {
    let matchLabels
    const local = _.get(
      templateObject,
      getSourcePath(
        'PlacementRule[0].spec.clusterSelector.matchLabels.local-cluster'
      )
    )
    if (!local) {
      matchLabels = _.get(
        templateObject,
        getSourcePath('PlacementRule[0].spec.clusterSelector.matchLabels')
      )
      if (!matchLabels) {
        matchLabels = _.get(
          templateObject,
          getSourcePath('PlacementRule[0].spec.clusterLabels.matchLabels')
        )
      }
    }
    if (matchLabels) {
      matchLabels = removeVs(matchLabels)
      if (matchLabels) {
        const clusterLabelsList = Object.entries(matchLabels).map(
          ([labelName, labelValue], id) => {
            return {
              id,
              labelName,
              labelValue,
              validValue: true
            }
          }
        )
        control.active = {
          mode: true,
          clusterLabelsList,
          clusterLabelsListID: clusterLabelsList.length
        }
      }
    } else {
      const clusterLabelsList = [
        { id: 0, labelName: '', labelValue: '', validValue: false }
      ]
      control.active = {
        mode: false,
        clusterLabelsList,
        clusterLabelsListID: 1
      }
    }
  }
}

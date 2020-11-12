'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import {
  DropdownV2,
  DropdownSkeleton,
  InlineLoading
} from 'carbon-components-react'
import Tooltip from '../components/Tooltip'
import _ from 'lodash'

class ControlPanelSingleSelect extends React.Component {
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

  setControlRef = (control, ref) => {
    control.ref = ref
  };

  render() {
    const { controlId, i18n, control } = this.props
    const {
      name,
      placeholder = '',
      available = [],
      validation,
      isLoading,
      isFailed
    } = control
    let { active } = control
    if (!active) {
      if (isLoading) {
        active = i18n(
          _.get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        active = i18n('resource.error')
      } else if (available.length === 0) {
        active = i18n(
          _.get(control, 'fetchAvailable.emptyDesc', 'resource.none'))
      }
    }
    const key = `${controlId}-${name}-${available.join('-')}`
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-singleselect"
          ref={this.setControlRef.bind(this, control)}
        >
          <div className="creation-view-controls-multiselect-title">
            {name}
            {validation.required ? (
              <div className="creation-view-controls-required">*</div>
            ) : null}
            <Tooltip control={control} i18n={i18n} />
          </div>
          {isLoading ? (
            <div className="creation-view-controls-singleselect-loading">
              <DropdownSkeleton />
              <InlineLoading description={active} />
            </div>
          ) : (
            <div id={controlId}>
              <DropdownV2
                key={key}
                items={available}
                label={active || placeholder}
                onChange={this.handleChange.bind(this, control)}
              />
            </div>
          )}
        </div>
      </React.Fragment>
    )
  }

  handleChange(id, evt) {
    const { control, handleChange } = this.props
    control.active = evt.selectedItem
    handleChange(evt)
  }
}

export default ControlPanelSingleSelect

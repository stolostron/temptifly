'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import {
  DropdownV2,
  DropdownSkeleton,
  InlineLoading
} from 'carbon-components-react'
import Tooltip from '../components/Tooltip'
import msgs from '../../nls/platform.properties'
import _ from 'lodash'

class ControlPanelSingleSelect extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    locale: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {}
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  };

  render() {
    const { controlId, locale, control } = this.props
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
        active = msgs.get(
          _.get(control, 'fetchAvailable.loadingDesc', 'resource.loading'),
          locale
        )
      } else if (isFailed) {
        active = msgs.get('resource.error', locale)
      } else if (available.length === 0) {
        active = msgs.get(
          _.get(control, 'fetchAvailable.emptyDesc', 'resource.none'),
          locale
        )
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
            <Tooltip control={control} locale={locale} />
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

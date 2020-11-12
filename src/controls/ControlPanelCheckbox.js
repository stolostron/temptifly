'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Checkbox } from 'carbon-components-react'
import Tooltip from '../components/Tooltip'

class ControlPanelCheckbox extends React.Component {
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
    const { name, active, disabled = false } = control
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-checkbox"
          ref={this.setControlRef.bind(this, control)}
        >
          <Checkbox
            id={controlId}
            className="checkbox"
            hideLabel
            labelText=""
            checked={active}
            disabled={disabled}
            onChange={this.handleChange.bind(this, control)}
          />
          <div style={{ height: '20px' }}>{name}</div>
          <Tooltip control={control} i18n={i18n} />
        </div>
      </React.Fragment>
    )
  }

  handleChange(id, evt) {
    const { control, handleChange } = this.props
    control.active = evt
    handleChange(evt)
  }
}

export default ControlPanelCheckbox

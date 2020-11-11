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
          <Tooltip control={control} locale={locale} />
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

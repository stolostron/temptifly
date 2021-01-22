'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Checkbox } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'

class ControlPanelCheckbox extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
  };

  constructor(props) {
    super(props)
    this.state = {}
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  };

  render() {
    const { controlId, control, handleChange } = this.props
    const { name, active, disabled = false } = control

    const onChange = () => {
      control.active = !active
      handleChange()
    }

    return (
      <React.Fragment>
        <div
          className="creation-view-controls-checkbox"
          ref={this.setControlRef.bind(this, control)}
        >
          <Checkbox
            aria-label={name}
            id={controlId}
            isChecked={typeof active==='boolean'? active : active==='true'}
            isDisabled={disabled}
            onChange={onChange}
          />
          <ControlPanelFormGroup
            controlId={controlId}
            control={control} />
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelCheckbox

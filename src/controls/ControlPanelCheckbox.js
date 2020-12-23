'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { FormGroup, Popover, Checkbox } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'

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
    const { name, active, tooltip, disabled = false } = control

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
            isChecked={active}
            isDisabled={disabled}
            onChange={onChange}
          />
          <FormGroup
            id={`${controlId}-label`}
            label={name}
            fieldId={controlId}
            labelIcon={
              /* istanbul ignore next */
              tooltip ? (
                <Popover
                  id={`${controlId}-label-help-popover`}
                  bodyContent={tooltip}
                >
                  <button
                    id={`${controlId}-label-help-button`}
                    aria-label="More info"
                    onClick={(e) => e.preventDefault()}
                    className="pf-c-form__group-label-help"
                  >
                    <HelpIcon noVerticalAlign />
                  </button>
                </Popover>
              ) : (
                <React.Fragment />
              )
            }
          >
          </FormGroup>
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelCheckbox

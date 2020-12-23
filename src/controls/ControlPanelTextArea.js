'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { FormGroup, TextArea, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'

class ControlPanelTextArea extends React.Component {
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
      type,
      active: value,
      exception,
      tooltip,
      validation = {},
      disabled
    } = control

    // if placeholder missing, create one
    let { placeholder } = control
    if (!placeholder) {
      placeholder = i18n(
        'creation.ocp.cluster.enter.value',
        [name ? name.toLowerCase() : '']
      )
    }

    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-textbox"
          style={{ display: '' }}
          ref={this.setControlRef.bind(this, control)}
        >
          <FormGroup
            id={`${controlId}-label`}
            label={name}
            isRequired={validation.required}
            fieldId={controlId}
            helperTextInvalid={exception}
            validated={validated}
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
            <TextArea
              id={controlId}
              disabled={disabled}
              type={type}
              placeholder={placeholder}
              validated={validated}
              value={value || ''}
              onChange={this.handleChange.bind(this, control)}
            />
          </FormGroup>
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

export default ControlPanelTextArea

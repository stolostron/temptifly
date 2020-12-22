'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { FormGroup, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'

class ControlPanelNumber extends React.Component {
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
    const { controlId, i18n, control, handleChange } = this.props
    const { name, initial, exception, validation={}, tooltip } = control
    let { active } = control
    active = active || initial
    const nActive = parseInt(active, 10)

    const onChange = (value) => {
      control.active = value.toString()
      handleChange()
    }

    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-number"
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
            <div className="pf-c-number-input">
              <div className="pf-c-input-group">
                <button className="pf-c-button pf-m-control" style={{lineHeight: '16px'}} type="button" aria-label="Minus"
                  onClick={()=>{
                    onChange(nActive-1)
                  }}>
                  <span className="pf-c-number-input__icon">
                    <svg height="16" width="16" role="img" viewBox="0 0 24 24">
                      <path d="M0 10h24v4h-24z" />
                    </svg>
                  </span>
                </button>
                <input
                  className="pf-c-form-control"
                  type="number"
                  value={active}
                  name="number-input-default-name"
                  onFocus={e => {
                    e.target.select()
                  }}
                  onChange={e => {
                    onChange(e.target.value)
                  }}
                  aria-label="Number input"
                />
                <button className="pf-c-button pf-m-control" style={{lineHeight: '16px'}} type="button" aria-label="Plus"
                  onClick={()=>{
                    onChange(nActive+1)
                  }}>
                  <svg height="16" width="16" role="img" viewBox="0 0 24 24">
                    <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
                  </svg>
                </button>
              </div>
            </div>
            {validated === 'error' ? (
              <div style={{ borderTop: '1.75px solid red', paddingBottom: '6px', maxWidth: '400px' }}></div>
            ) : (
              <React.Fragment />
            )}
          </FormGroup>
        </div>
      </React.Fragment>
    )
  }

}

export default ControlPanelNumber

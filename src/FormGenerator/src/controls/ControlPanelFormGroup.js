'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { FormGroup, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'

class ControlPanelFormGroup extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    control: PropTypes.object,
    controlId: PropTypes.string
  };

  render() {
    const { controlId, control, children } = this.props
    const {
      name,
      exception,
      tooltip,
      validation = {}
    } = control

    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
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
          {children}
        </FormGroup>
      </React.Fragment>
    )
  }
}

export default ControlPanelFormGroup

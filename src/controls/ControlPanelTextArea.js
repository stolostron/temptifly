'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { TextArea } from 'carbon-components-react'
import Tooltip from '../components/Tooltip'

class ControlPanelTextArea extends React.Component {
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
    const { name, active: value, exception, validation } = control
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-textarea"
          ref={this.setControlRef.bind(this, control)}
        >
          <div className="creation-view-controls-textarea-title">
            {name}
            {validation.required ? (
              <div className="creation-view-controls-required">*</div>
            ) : null}
            <Tooltip control={control} locale={locale} />
          </div>
          <TextArea
            id={controlId}
            invalid={!!exception}
            invalidText={exception}
            hideLabel
            spellCheck={false}
            autoComplete={'new-password'}
            labelText=""
            value={value}
            onChange={this.handleChange.bind(this, control)}
          />
        </div>
      </React.Fragment>
    )
  }

  handleChange(id, evt) {
    const { control, handleChange } = this.props
    control.active = evt.target.value
    handleChange(evt)
  }
}

export default ControlPanelTextArea

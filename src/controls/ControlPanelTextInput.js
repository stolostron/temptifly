'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { TextInput } from 'carbon-components-react'
import Tooltip from '../components/Tooltip'
import msgs from '../../nls/platform.properties'

class ControlPanelTextInput extends React.Component {
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
      type,
      active: value,
      exception,
      validation = {},
      disabled
    } = control

    // if placeholder missing, create one
    let { placeholder } = control
    if (!placeholder) {
      placeholder = msgs.get(
        'creation.ocp.cluster.enter.value',
        [name.toLowerCase()],
        locale
      )
    }
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-textbox"
          style={{ display: '' }}
          ref={this.setControlRef.bind(this, control)}
        >
          <label
            className="creation-view-controls-textbox-title"
            htmlFor={controlId}
          >
            {name}
            {validation.required ? (
              <div className="creation-view-controls-required">*</div>
            ) : null}
            <Tooltip control={control} locale={locale} />
          </label>
          <TextInput
            id={controlId}
            hideLabel
            spellCheck={false}
            disabled={disabled}
            type={type}
            autoComplete={'new-password'}
            labelText=""
            invalid={!!exception}
            invalidText={exception}
            placeholder={placeholder}
            value={value || ''}
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

export default ControlPanelTextInput

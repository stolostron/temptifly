'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Icon, Tag, TextInput } from 'carbon-components-react'
import Tooltip from '../components/Tooltip'
import _ from 'lodash'

export const DNS_LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?'
export const PREFIX = `${DNS_LABEL}(?:\\.${DNS_LABEL})*/`
export const NAME_OR_VALUE = '[a-z0-9A-Z](?:[a-z0-9A-Z_.-]{0,61}[a-z0-9A-Z])?'
export const regex = new RegExp(
  `^((?:${PREFIX})?${NAME_OR_VALUE})=(${NAME_OR_VALUE})?$`
)
export const KEY_CAPTURE_GROUP_INDEX = 1
export const VALUE_CAPTURE_GROUP_INDEX = 2

class ControlPanelLabels extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      value: '',
      invalid: false,
      invalidText: ''
    }
  }

  render() {
    const { controlId, i18n, control } = this.props
    const { name, active = [] } = control
    const formatted = active.map(({ key, value: v }) => `${key}=${v}`)
    const { value, invalid, invalidText } = this.state
    return (
      <React.Fragment>
        <div className="creation-view-controls-labels">
          <div className="creation-view-controls-labels-title">
            {name}
            <Tooltip control={control} i18n={i18n} />
          </div>
          <div className="creation-view-controls-labels-container">
            {formatted.map((label, inx) => {
              return (
                <Tag key={label} type="custom">
                  {label}
                  <Icon
                    className="closeIcon"
                    description={i18n('delete.label')}
                    name="icon--close"
                    onClick={this.handleDelete.bind(this, inx)}
                  />
                </Tag>
              )
            })}
            <div className="creation-view-controls-labels-edit-container">
              <TextInput
                id={controlId}
                hideLabel
                labelText=""
                invalid={invalid}
                invalidText={invalidText}
                placeholder={i18n('enter.add.label')}
                value={value}
                onBlur={this.handleBlur.bind(this)}
                onKeyDown={this.handleKeyDown.bind(this)}
                onChange={this.handleChange.bind(this)}
              />
              {value && (
                <Icon
                  className="closeIcon"
                  description={i18n('cancel.label.create')}
                  name="icon--close"
                  onClick={this.cancelLabel.bind(this)}
                />
              )}
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }

  handleDelete(inx) {
    const { control, handleChange } = this.props
    const { active = [] } = control
    active.splice(inx, 1)
    handleChange(control)
  }

  handleChange(event) {
    const { control, i18n } = this.props
    const { active = [] } = control
    let value = event.target.value
    if (value === ',') {
      value = ''
    }
    let invalid = !regex.test(value)
    let invalidText = ''
    if (invalid) {
      invalidText = i18n('enter.add.label')
    } else {
      const match = regex.exec(value)
      const map = _.keyBy(active, 'key')
      if (map[match[KEY_CAPTURE_GROUP_INDEX]]) {
        invalid = true
        invalidText = i18n(
          'enter.duplicate.key',
          [match[KEY_CAPTURE_GROUP_INDEX]])
      }
    }
    this.setState({ value, invalid, invalidText })
  }

  handleKeyDown(event) {
    switch (event.key) {
    case 'Enter':
    case ',':
      this.createLabel()
      break

    case 'Backspace':
      this.deleteLastLabel()
      break

    case 'Escape':
      this.cancelLabel()
      break
    }
  }

  handleBlur() {
    this.createLabel()
  }

  deleteLastLabel() {
    const { value } = this.state
    if (!value) {
      const { control, handleChange } = this.props
      const { active = [] } = control
      const inx = active.length - 1
      if (inx >= 0) {
        active.splice(inx, 1)
        handleChange(control)
      }
    }
  }

  createLabel() {
    const { control, handleChange } = this.props
    const { active = [] } = control
    const { value, invalid } = this.state
    if (value && !invalid) {
      const match = regex.exec(value)
      active.push({
        key: match[KEY_CAPTURE_GROUP_INDEX],
        value: match[VALUE_CAPTURE_GROUP_INDEX] || ''
      })
      handleChange(control)
    }
    this.cancelLabel()
  }

  cancelLabel() {
    this.setState({ value: '', invalid: false, invalidText: '' })
  }
}

export default ControlPanelLabels

'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import {
  FormGroup,
  Popover,
  Select,
  SelectOption,
  SelectVariant,
  Spinner } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import _ from 'lodash'

class ControlPanelSingleSelect extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      open: false
    }
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  };

  render() {
    const { open } = this.state
    const { controlId, i18n, control, handleChange } = this.props
    const {
      name,
      placeholder = '',
      available = [],
      validation = {},
      exception,
      tooltip,
      disabled,
      isLoading,
      isFailed
    } = control
    let { active } = control
    if (!active) {
      if (isLoading) {
        active = i18n(
          _.get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        active = i18n('resource.error')
      } else if (available.length === 0) {
        active = i18n(
          _.get(control, 'fetchAvailable.emptyDesc', 'resource.none'))
      }
    }
    const setOpen = (open) => {
      this.setState({open})
    }
    const onChange = (value) => {
      control.active = value
      handleChange()
    }
    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-singleselect"
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
            {isLoading ? (
              <div className="creation-view-controls-singleselect-loading">
                <Spinner size="md" />
                <div>{active}</div>
              </div>
            ) : (
              <Select
                aria-labelledby={`${controlId}-label`}
                spellCheck={false}
                isOpen={open}
                onToggle={() => {setOpen(!open)}}
                variant={SelectVariant.typeahead}
                onSelect={(_event, value) => {
                  onChange(value)
                  setOpen(false)
                }}
                selections={active}
                onClear={() => {onChange(undefined)}}
                placeholderText={placeholder}
                isDisabled={disabled}
              >
                {available.map((item, inx)=>{
                  /* eslint-disable-next-line react/no-array-index-key */
                  return <SelectOption key={inx} value={item} />
                })}
              </Select>
            )}
            {validated === 'error' ? (
              <div style={{ borderTop: '1.75px solid red', paddingBottom: '6px', maxWidth: '800px' }}></div>
            ) : (
              <React.Fragment />
            )}
          </FormGroup>
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelSingleSelect

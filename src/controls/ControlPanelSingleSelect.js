'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import {
  Select,
  SelectOption,
  SelectVariant,
  Spinner } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'
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
      active='',
      available = [],
      exception,
      disabled,
      isLoading,
      isFailed
    } = control
    let { placeholder='' } = control
    if (!placeholder) {
      if (isLoading) {
        placeholder = i18n(
          _.get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        placeholder = i18n('resource.error')
      } else if (available.length === 0) {
        placeholder = i18n(
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
    const key = `${controlId}-${name}-${available.join('-')}`
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-singleselect"
          ref={this.setControlRef.bind(this, control)}
        >
          <ControlPanelFormGroup
            controlId={controlId}
            control={control}>
            {isLoading ? (
              <div className="creation-view-controls-singleselect-loading">
                <Spinner size="md" />
                <div>{active}</div>
              </div>
            ) : (
              <Select
                id={controlId}
                key={key}
                aria-labelledby={`${controlId}-label`}
                spellCheck={false}
                autoComplete="new-password"
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
              <div style={{ borderTop: '1.75px solid red', paddingBottom: '6px', maxWidth: '600px' }}></div>
            ) : (
              <React.Fragment />
            )}
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelSingleSelect

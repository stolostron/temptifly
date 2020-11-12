'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import {
  ComboBox,
  DropdownSkeleton,
  InlineLoading
} from 'carbon-components-react'
import Tooltip from '../components/Tooltip'
import _ from 'lodash'

class ControlPanelComboBox extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlData: PropTypes.array,
    controlId: PropTypes.string,
    handleControlChange: PropTypes.func,
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
      userData = [],
      availableMap,
      exception,
      validation,
      hasReplacements,
      isFailed,
      disabled,
      fetchAvailable
    } = control
    let { isLoading } = control
    const { controlData } = this.props
    let { active, available, placeholder = '' } = control
    let loadingMsg
    if (fetchAvailable) {
      if (isLoading) {
        loadingMsg = i18n(
          _.get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        placeholder = i18n('resource.error')
      } else if (available.length === 0) {
        placeholder =
          placeholder ||
          i18n(
            _.get(control, 'fetchAvailable.emptyDesc', 'resource.empty'))
      }
    } else if (isLoading) {
      loadingMsg = i18n(
        'creation.loading.values',
        [name.toLowerCase()]
      )
    }
    if (!placeholder) {
      placeholder = i18n(
        'creation.enter.value',
        [name.toLowerCase()]
      )
    }
    available = _.uniq([...userData, ...available])

    // when available map has descriptions of choices
    // ex: instance types have # cpu's etc
    if (availableMap && !hasReplacements) {
      const map = _.invert(availableMap)
      active = map[active] || active
    }

    // if active was preset by loading an existing resource
    // initialize combobox to that value
    if (active && available.length === 0) {
      available.push(active)
      if (isLoading) {
        available.push(loadingMsg)
      } else if (isFailed) {
        available.push(placeholder)
      }
      isLoading = false
    }

    // comboboxes need an array of {label, id}
    const items = available.map((label, inx) => {
      return { label, id: inx }
    })
    const initialSelectedItem = items.find(item => item.label === active)

    const key = `${controlId}-${name}-${active}`
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-singleselect"
          ref={this.setControlRef.bind(this, control)}
        >
          <div className="creation-view-controls-multiselect-title">
            {name}
            {validation.required ? (
              <div className="creation-view-controls-required">*</div>
            ) : null}
            <Tooltip control={control} i18n={i18n} />
          </div>
          {isLoading && !active ? (
            <div className="creation-view-controls-singleselect-loading">
              <DropdownSkeleton />
              <InlineLoading description={loadingMsg} />
            </div>
          ) : (
            <ComboBox
              id={controlId}
              key={key}
              items={items}
              itemToString={item => (item ? item.label : '')}
              initialSelectedItem={initialSelectedItem}
              selecteditem={active}
              spellCheck={false}
              disabled={disabled}
              ref={ref => {
                if (ref) {
                  const input = _.get(ref, 'textInput.current')
                  if (input) {
                    input.autocomplete = 'off'
                    input.addEventListener('keyup', e => {
                      if (e.key === 'Enter' && control.typing) {
                        this.handleComboboxChange(
                          control,
                          userData,
                          controlData
                        )
                      }
                    })
                  }
                }
              }}
              invalid={!!exception}
              invalidText={exception}
              placeholder={placeholder}
              onChange={() => {}}
              onFocus={e => {
                e.target.select()
              }}
              onInputChange={this.handleComboboxTyping.bind(
                this,
                control,
                userData,
                available
              )}
            />
          )}
        </div>
      </React.Fragment>
    )
  }

  handleComboboxTyping(control, userData, available, evt) {
    const { controlData } = this.props

    // if menu is still open, user is typing
    const menu = control.ref.getElementsByClassName('bx--list-box__menu')
    if (menu && menu.length > 0) {
      // user clicked selection, kill any typing
      menu[0].addEventListener(
        'click',
        () => {
          delete control.typing
        },
        true
      )

      // user is typing something--filter the list
      Array.from(
        menu[0].getElementsByClassName('bx--list-box__menu-item')
      ).forEach((item, inx) => {
        if (available[inx].indexOf(evt) === -1) {
          item.innerHTML = available[inx]
          item.style.display = 'none'
        } else {
          item.innerHTML = available[inx].replace(
            new RegExp(evt, 'gi'),
            found => {
              return '<b>' + found + '</b>'
            }
          )
          item.style.display = ''
        }
      })
      control.typing = evt.trim()
    } else {
      control.active = evt.trim()
      this.handleComboboxChange(control, userData, controlData)
    }
  }

  handleComboboxChange(control, userData, controlData) {
    // if user typed something
    if (control.typing) {
      userData.push(control.typing)
      control.userData = userData
      control.active = control.typing

      // if this combobox is fetched from server, make sure whatever user types in has an availableMap entry
      const setAvailableMap = _.get(control, 'fetchAvailable.setAvailableMap')
      if (setAvailableMap) {
        setAvailableMap(control)
      }
    }

    this.props.handleControlChange(control, controlData)
    delete control.typing
  }
}

export default ControlPanelComboBox

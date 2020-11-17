'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { MultiSelect } from 'carbon-components-react'
import Tooltip from '../components/Tooltip'

class ControlPanelMultiSelect extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {}
  }

  setControlRef = (control, ref) => {
    this.multiSelect = control.ref = ref
  };

  render() {
    const { controlId, i18n, control } = this.props
    const { name, placeholder: ph = '' } = control

    // see if we need to add user additions to available (from editing the yaml file)
    const { userData, userMap, hasCapturedUserSource } = control
    let { active = [], available, availableMap } = control
    if (userData) {
      if (!hasCapturedUserSource) {
        available = [...userData, ...available]
        availableMap = { ...userMap, ...availableMap }
      } else {
        // if user edited the source, we can't automatically update it
        active = available = [i18n('creation.view.policy.custom')]
        availableMap = undefined
      }
    }
    if (!Array.isArray(active)) {
      active=[]
    }

    // place holder
    let placeholder = ph
    if (active.length > 0) {
      const activeKeys = []
      active.forEach(k => {
        if (typeof availableMap === 'object' && availableMap[k]) {
          const { name: n } = availableMap[k]
          activeKeys.push(n || k)
        } else {
          activeKeys.push(k)
        }
      })
      placeholder = activeKeys.join(', ')
    }

    // change key if active changes so that carbon component is re-created with new initial values
    const key = `${controlId}-${active.join('-')}`
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-multiselect"
          ref={this.setControlRef.bind(this, control)}
        >
          <label
            className="creation-view-controls-multiselect-title"
            htmlFor={controlId}
          >
            {name}
            <Tooltip control={control} i18n={i18n} />
          </label>
          <MultiSelect.Filterable
            key={key}
            id={controlId}
            items={available}
            initialSelectedItems={active}
            placeholder={placeholder}
            itemToString={item => item}
            sortItems={items => items}
            onChange={this.handleSelectionChange.bind(this)}
          />
        </div>
      </React.Fragment>
    )
  }

  handleSelectionChange(evt) {
    const { control } = this.props
    const { isOneSelection } = control
    if (isOneSelection) {
      // close on one selection
      this.handleChange(evt)
    } else {
      // close when user clicks outside of menu
      // unfortunately MultiSelect.Filterable doesn't have an onClose
      this.multiSelect.selectedItems = evt.selectedItems
      const menu = this.multiSelect.getElementsByClassName(
        'bx--list-box__menu'
      )
      if (menu && menu.length > 0) {
        if (!this.multiSelect.observer) {
          this.multiSelect.observer = new MutationObserver(() => {
            this.handleChange({
              selectedItems: this.multiSelect.selectedItems
            })
            this.multiSelect.observer.disconnect()
            delete this.multiSelect.observer
          })
          this.multiSelect.observer.observe(menu[0].parentNode, {
            childList: true
          })
        }
      } else if (!this.multiSelect.observer) {
        this.handleChange({ selectedItems: this.multiSelect.selectedItems })
      }
    }
  }

  handleChange(evt) {
    const { control, handleChange } = this.props
    control.active = evt.selectedItems
    handleChange(evt)
  }
}

export default ControlPanelMultiSelect

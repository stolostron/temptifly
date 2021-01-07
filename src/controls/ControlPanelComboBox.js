'use strict'


import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { FormGroup, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import _ from 'lodash'

class ControlPanelComboBox extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleControlChange: PropTypes.func,
    i18n: PropTypes.func,
  };

  static getDerivedStateFromProps(props, state) {
    const { control, handleControlChange } = props
    const handleComboChange = selectedItem => {
      control.active = selectedItem
      handleControlChange()
    }
    const { active } = control
    const { currentSelection } = state
    let {
      isOpen,
      searchText
    } = state

    /////////////////////////////////////////////////////////////
    // search mode
    if (searchText && searchText.length) {
      // nothing selected, filter list
      if (currentSelection === undefined) {
        if (active !== searchText) {
          handleComboChange(searchText)
        }
      } else {
        // handle change
        handleComboChange(currentSelection)
        isOpen = false
        searchText = null
      }
    } else if (currentSelection !== undefined) {
      // handle change
      handleComboChange(currentSelection)
      searchText = null
      isOpen = false
    }
    return {
      active,
      currentSelection: undefined,
      isOpen,
      searchText
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      isOpen: false,
      searchText: null
    }
    this.onDocClick = (event) => {
      const clickedOnToggle = this.inputRef && this.inputRef.contains(event.target)
      const clickedWithinMenu = this.menuRef && this.menuRef.contains && this.menuRef.contains(event.target)
      const clickedWithinClear = this.clearRef && this.clearRef.contains && this.clearRef.contains(event.target)
      const clickedWithinToggle = this.toggleRef && this.toggleRef.contains && this.toggleRef.contains(event.target)
      if (this.state.isOpen && !(clickedOnToggle || clickedWithinMenu || clickedWithinClear || clickedWithinToggle)) {
        this.setState({isOpen: false})
      }
    }
    this.onDocClick = this.onDocClick.bind(this)
  }
  componentDidMount() {
    document.addEventListener('mousedown', this.onDocClick)
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.onDocClick)
  }

  setInputRef = (ref) => {
    this.inputRef = ref
  };

  setMenuRef = (ref) => {
    this.menuRef = ref
  };

  setClearRef = (ref) => {
    this.clearRef = ref
  };

  setToggleRef = (ref) => {
    this.toggleRef = ref
  };

  render() {
    const {
      isOpen,
      searchText,
    } = this.state
    const { controlId, i18n, control } = this.props
    const {
      name,
      userData = [],
      availableMap,
      exception,
      validation={},
      hasReplacements,
      isFailed,
      fetchAvailable,
      disabled,
      tooltip
    } = control
    let { isLoading } = control
    let { active, available=[], placeholder = '' } = control
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

    let currentAvailable = available
    if (!isLoading && searchText && searchText.length) {
      const findText = searchText.toLowerCase()
      currentAvailable = available.filter(item => {
        return item.toLowerCase().includes(findText)
      })
      if (currentAvailable.length===0) {
        currentAvailable = available
      }
    }
    const items = currentAvailable.map((label, inx) => {
      return { label, id: inx }
    })
    //const initialSelectedItem = items.find(item => item.label === active)
    const key = `${controlId}-${name}-${active}`
    const toggleClasses = classNames({
      'tf--list-box__menu-icon': true,
      'tf--list-box__menu-icon--open': isOpen
    })
    const inputClasses = classNames({
      'pf-c-form-control': true,
      'input': true,
      'disabled': disabled
    })
    const aria = isOpen ? 'Close menu' : 'Open menu'
    const validated = exception ? 'error' : undefined
    const value = searchText || active || ''
    return (
      <React.Fragment>
        <div className="creation-view-controls-combobox">
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
            <div id={controlId}>
              <div
                role="listbox"
                aria-label="Choose an item"
                tabIndex="0"
                className="tf--list-box"
              >
                <div
                  role="button"
                  className=""
                  tabIndex="0"
                  type="button"
                  aria-label={aria}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  data-toggle="true"
                  onClick={this.clickToggle.bind(this)}
                  onKeyPress={this.pressToggle.bind(this)}
                >
                  <div className={inputClasses}>
                    <input
                      className="pf-c-combo-control"
                      aria-label="ListBox input field"
                      spellCheck="false"
                      role="combobox"
                      disabled={disabled}
                      aria-controls={key}
                      aria-expanded="true"
                      autoComplete="new-password"
                      id={`${controlId}-${Math.random()}-input`}
                      placeholder={placeholder}
                      ref={this.setInputRef}
                      style={validated === 'error' ? {borderBottomColor: 'red'} : undefined}
                      value={value}
                      onKeyUp={this.pressUp.bind(this)}
                      onKeyDown={this.pressDown.bind(this)}
                      onChange={evt =>
                        this.setState({ searchText: evt.currentTarget.value })
                      }
                    />
                  </div>
                  {!disabled && (searchText || active) && <div
                    role="button"
                    className="tf--list-box__selection"
                    tabIndex="0"
                    title="Clear selected item"
                    ref={this.setClearRef}
                    onClick={this.clickClear.bind(this)}
                    onKeyPress={this.pressClear.bind(this)}
                  >
                    <TimesCircleIcon aria-hidden />
                  </div>}
                  {!disabled && <div
                    role="button"
                    tabIndex="0"
                    className={toggleClasses}
                    ref={this.setToggleRef}
                    onClick={this.clickToggle.bind(this)}
                    onKeyPress={this.pressToggle.bind(this)}
                  >
                    <svg
                      fillRule="evenodd"
                      height="5"
                      role="img"
                      viewBox="0 0 10 5"
                      width="10"
                      alt={aria}
                      aria-label={aria}
                    >
                      <title>Close menu</title>
                      <path d="M0 0l5 4.998L10 0z" />
                    </svg>
                  </div>}
                </div>
                {!disabled && isOpen && (
                  <div className="tf--list-box__menu" key={key} id={key} ref={this.setMenuRef} >
                    {items.map(
                      ({ label, id }) => {
                        const itemClasses = classNames({
                          'tf--list-box__menu-item': true,
                          searching: searchText,
                        })
                        return (
                          <div
                            role="button"
                            key={label}
                            className={itemClasses}
                            id={`${controlId}-item-${id}`}
                            tabIndex="0"
                            onClick={this.clickSelect.bind(this, label)}
                            onKeyPress={this.pressSelect.bind(this, label)}
                          >
                            {this.renderLabel(label, searchText)}
                          </div>
                        )
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          </FormGroup>
        </div>
      </React.Fragment>
    )
  }

  renderLabel(label, searchText) {
    const inx =
      searchText &&
      searchText.length &&
      label.toLowerCase().indexOf(searchText.toLowerCase())
    if (inx !== null && inx >= 0) {
      label = [
        label.substr(0, inx),
        label.substr(inx, searchText.length),
        label.substr(inx + searchText.length)
      ]
      return (
        <React.Fragment>
          {label[0]}
          <b>{label[1]}</b>
          {label[2]}
        </React.Fragment>
      )
    } else {
      return <React.Fragment>{label}</React.Fragment>
    }
  }

  pressUp(e) {
    if (e.key === 'Enter' && this.state.searchText) {
      const { searchText } = this.state
      const { control, handleControlChange } = this.props
      control.userData = control.userData || []
      control.userData.push(searchText)
      control.active = searchText
      handleControlChange()
      this.setState({
        currentSelection: undefined,
        isOpen:false,
        searchText: null
      })
    }
  }

  pressDown(e) {
    if (e.key === 'Escape') {
      this.clickClear()
    }
  }

  pressToggle(e) {
    if (e.key === 'Enter') {
      this.clickToggle()
    } else if (e.key === 'Escape') {
      this.clickClear()
    }
  }

  clickToggle(e) {
    if (e) {
      e.stopPropagation()
    }
    const clickedWithinClear = e && this.clearRef && this.clearRef.contains && this.clearRef.contains(e.target)
    const clickedWithinToggle = e && this.toggleRef && this.toggleRef.contains && this.toggleRef.contains(event.target)
    if (!(this.state.searchText || clickedWithinClear) || clickedWithinToggle) {
      this.setState(preState => {
        let {
          currentAvailable,
          currentSelection,
          searchText,
          isOpen
        } = preState
        isOpen = !isOpen
        if (!isOpen) {
          currentAvailable = []
          currentSelection = undefined
          searchText = null
        }
        return {
          currentAvailable,
          currentSelection,
          searchText,
          isOpen
        }
      })
    }
  }

  pressSelect(label, e) {
    if (e.key === 'Enter') {
      this.clickSelect(label)
    }
  }

  clickSelect(label) {
    this.setState({ currentSelection: label })
  }

  pressClear(inx, e) {
    if (e && e.key === 'Enter') {
      this.clickClear()
    }
  }

  clickClear() {
    this.setState({ searchText: '' })
    const { control, handleControlChange } = this.props
    control.active = ''
    handleControlChange()
  }
}

export default ControlPanelComboBox

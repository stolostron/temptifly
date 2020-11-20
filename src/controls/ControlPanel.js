'use strict'

import React from 'react'
import { Query } from 'react-apollo'
import PropTypes from 'prop-types'
import { Notification } from 'carbon-components-react'
import classNames from 'classnames'
import ControlPanelAccordion from './ControlPanelAccordion'
import ControlPanelTextInput from './ControlPanelTextInput'
import ControlPanelComboBox from './ControlPanelComboBox'
import ControlPanelTextArea from './ControlPanelTextArea'
import ControlPanelNumber from './ControlPanelNumber'
import ControlPanelCheckbox from './ControlPanelCheckbox'
import ControlPanelSingleSelect from './ControlPanelSingleSelect'
import ControlPanelTreeSelect from './ControlPanelTreeSelect'
import ControlPanelMultiSelect from './ControlPanelMultiSelect'
import ControlPanelCards from './ControlPanelCards'
import ControlPanelTable from './ControlPanelTable'
import ControlPanelLabels from './ControlPanelLabels'
import ControlPanelPrompt from './ControlPanelPrompt'
import ControlPanelSkeleton from './ControlPanelSkeleton'
import '../scss/control-panel.scss'
import '../../graphics/icons.svg'

class ControlPanel extends React.Component {
  static propTypes = {
    controlData: PropTypes.array,
    fetchData: PropTypes.object,
    handleControlChange: PropTypes.func,
    handleGroupChange: PropTypes.func,
    handleNewEditorMode: PropTypes.func,
    i18n: PropTypes.func,
    isCustomName: PropTypes.bool,
    isLoaded: PropTypes.bool,
    notifications: PropTypes.array,
    originalControlData: PropTypes.array,
    showEditor: PropTypes.bool
  };

  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.refreshFading()
  }

  setCreationViewRef = ref => {
    this.creationView = ref
  };
  setCreationViewBottomBlurrRef = ref => {
    this.creationViewBottomBlurrRef = ref
  };

  refreshFading = () => {
    if (this.creationViewBottomBlurrRef) {
      const hasScrollbar =
        this.creationView.scrollHeight > this.creationView.clientHeight
      const towardsBottom =
        this.creationView.scrollTop + this.creationView.clientHeight >
        this.creationView.scrollHeight - 20
      this.creationViewBottomBlurrRef.style.display =
        hasScrollbar && !towardsBottom ? 'block' : 'none'
    }
  };

  setControlSectionRef = (title, ref) => {
    title.sectionRef = ref
  };

  render() {
    const { controlData, showEditor } = this.props
    const controlClasses = classNames({
      'creation-view-controls': true,
      showEditor
    })

    // render notifications and collapsable control sections
    return (
      <div className="creation-view-controls-container">
        <div
          className={controlClasses}
          ref={this.setCreationViewRef}
          onScroll={this.refreshFading.bind(this)}
        >
          {this.renderNotifications()}
          <div className="content">
            {this.renderControlSections(controlData)}
          </div>
        </div>
        <div
          className="creation-view-controls-container-blurr bottom"
          ref={this.setCreationViewBottomBlurrRef}
        />
      </div>
    )
  }

  renderControlSections(controlData, grpId = '') {
    // create collapsable control sections
    let section
    let content = []
    let stopRendering = false
    let stopRenderingOnNextControl = false
    const controlSections = []
    controlData.forEach(control => {
      const { type, pauseControlCreationHereUntilSelected } = control
      stopRendering = stopRenderingOnNextControl
      if (pauseControlCreationHereUntilSelected) {
        stopRenderingOnNextControl = !control.active
      }
      if (!stopRendering) {
        if (type === 'section') {
          content = []
          section = { title: control, content }
          controlSections.push(section)
        } else {
          content.push(control)
        }
      }
    })

    return controlSections.map(({ title, content: _content }) => {
      const { id, collapsed = false, shadowed } = title
      const sectionClasses = classNames({
        'creation-view-controls-section': true,
        shadowed,
        collapsed
      })
      title.content = _content
      return (
        <React.Fragment key={id}>
          {this.renderControl(id, 'section', title, grpId)}
          <div
            className={sectionClasses}
            ref={this.setControlSectionRef.bind(this, title)}
          >
            {this.renderControls(_content, grpId)}
          </div>
        </React.Fragment>
      )
    })
  }

  renderControls(controlData, grpId) {
    return (
      <React.Fragment>
        {controlData.map((control, i) => {
          const { id = `${control.type}-${i}`, type } = control
          switch (type) {
          case 'group':
            return this.renderGroup(control, grpId)
          default:
            return this.renderControlWithFetch(id, type, control, grpId)
          }
        })}
      </React.Fragment>
    )
  }

  renderGroup(control, grpId = '') {
    const { id, active = [], prompts } = control
    return (
      <React.Fragment key={id}>
        {active.map((controlData, inx) => {
          const groupId = inx > 0 ? `${grpId}grp${inx}` : ''
          return (
            /* eslint-disable-next-line react/no-array-index-key */
            <React.Fragment key={`${controlData[0].id}Group${inx}`}>
              <div className="creation-view-group-container">
                {prompts &&
                  active.length > 1 &&
                  this.renderDeleteGroupButton(control, inx)}
                {this.renderControlSections(controlData, groupId)}
              </div>
              {prompts &&
                active.length - 1 === inx &&
                this.renderAddGroupButton(control)}
            </React.Fragment>
          )
        })}
      </React.Fragment>
    )
  }

  // if data for 'available' is fetched from server, use apollo component
  renderControlWithFetch(id, type, control, grpId) {
    const { fetchAvailable } = control
    if (fetchAvailable) {
      const { query, setAvailable } = fetchAvailable
      let { variables } = fetchAvailable
      if (typeof variables === 'function') {
        variables = variables(control, this.props.controlData)
      }
      if (!control.exception) {
        return (
          <Query query={query} key={id} variables={variables}>
            {result => {
              setAvailable(control, result)
              return this.renderControlWithPrompt(id, type, control, grpId)
            }}
          </Query>
        )
      }
    }
    return this.renderControlWithPrompt(id, type, control, grpId)
  }

  // if data for 'available' is fetched from server, use apollo component
  renderControlWithPrompt(id, type, control, grpId) {
    const { prompts } = control
    if (prompts) {
      const { positionAboveControl } = prompts
      if (positionAboveControl) {
        return (
          <React.Fragment key={id}>
            {this.renderControlPrompt(control)}
            {this.renderControl(id, type, control, grpId)}
          </React.Fragment>
        )
      } else {
        return (
          <React.Fragment key={id}>
            {this.renderControl(id, type, control, grpId)}
            {this.renderControlPrompt(control)}
          </React.Fragment>
        )
      }
    }
    return this.renderControl(id, type, control, grpId)
  }

  renderControlPrompt(control) {
    const { i18n, fetchData } = this.props
    return (
      <ControlPanelPrompt
        control={control}
        handleAddActive={items => this.handleAddActive(control, items)}
        i18n={i18n}
        fetchData={fetchData}
      />
    )
  }

  handleAddActive = (control, items) => {
    control.active = items
    this.props.handleControlChange(
      control,
      this.props.controlData,
      this.creationView,
      this.props.isCustomName
    )
  };

  renderControl(id, type, control, grpId) {
    const { controlData, showEditor, isLoaded, i18n } = this.props
    const { isHidden } = control
    if (
      isHidden === true ||
      isHidden === 'true' ||
      (typeof isHidden === 'function' && isHidden(showEditor))
    ) {
      return null
    }
    const controlId = `${id}${grpId}`
    control.controlId = controlId
    if (!isLoaded && !['title', 'section', 'hidden'].includes(type)) {
      return (
        <ControlPanelSkeleton
          key={controlId}
          controlId={controlId}
          control={control}
          i18n={i18n}
        />
      )
    }
    switch (type) {
    case 'title':
    case 'section':
      return (
        <ControlPanelAccordion
          key={controlId}
          controlId={controlId}
          control={control}
          controlData={controlData}
          handleChange={this.handleChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'text':
    case 'password':
      return (
        <ControlPanelTextInput
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'textarea':
      return (
        <ControlPanelTextArea
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'singleselect':
      return (
        <ControlPanelSingleSelect
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'number':
      return (
        <ControlPanelNumber
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'combobox':
      return (
        <ControlPanelComboBox
          key={controlId}
          controlId={controlId}
          control={control}
          controlData={controlData}
          handleControlChange={this.handleControlChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'multiselect':
      return (
        <ControlPanelMultiSelect
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'treeselect':
      return (
        <ControlPanelTreeSelect
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'cards':
      return (
        <ControlPanelCards
          key={controlId}
          controlId={controlId}
          control={control}
          showEditor={showEditor}
          handleChange={this.handleCardChange.bind(this, control)}
          i18n={i18n}
          fetchData={this.props.fetchData}
        />
      )
    case 'table':
      return (
        <ControlPanelTable
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleControlChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'labels':
      return (
        <ControlPanelLabels
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleControlChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'checkbox':
      return (
        <ControlPanelCheckbox
          key={controlId}
          controlId={controlId}
          control={control}
          handleChange={this.handleChange.bind(this, control)}
          i18n={i18n}
        />
      )
    case 'custom':
      return (
        <React.Fragment key={controlId}>
          {this.renderCustom(control, controlId)}
        </React.Fragment>
      )
    }
    return null
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  };

  renderCustom(control, controlId) {
    const { i18n } = this.props
    const { component } = control
    const custom = React.cloneElement(component, {
      control,
      i18n,
      controlId,
      handleChange: this.handleChange.bind(this, control)
    })
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-custom"
          ref={this.setControlRef.bind(this, control)}
        >
          {custom}
        </div>
      </React.Fragment>
    )
  }

  handleChange(control) {
    let updateName = false
    let { isCustomName } = this.props
    const { controlData, originalControlData } = this.props
    const { id: field, type, syncWith, syncedWith } = control
    switch (type) {
    case 'text':
      isCustomName = field === 'name'
      break
    case 'multiselect':
      // if user was able to select something that automatically
      // generates the name, blow away the user name
      updateName = !isCustomName && control.updateNamePrefix
      break
    }

    // update name if spec changed
    if (updateName) {
      let cname
      const nname = controlData.find(({ id }) => id === 'name')
      if (nname) {
        if (control.active.length > 0) {
          cname =
            control.updateNamePrefix +
            control.availableMap[control.active[0]].name.replace(/\W/g, '-')
        } else {
          cname = originalControlData.find(({ id }) => id === 'name').active
        }
        nname.active = cname.toLowerCase()
      }
    }

    // syncing values
    if (syncWith) {
      // whatever is typed into this control, also put in other control
      const syncControl = controlData.find(({ id }) => id === syncWith)
      syncControl.active = `${control.active}${syncControl.syncedSuffix || ''}`
    }
    if (syncedWith) {
      // if another control is synced with this control and
      // user is typing a value here directly, remove sync
      const syncedControl = controlData.find(({ id }) => id === syncedWith)
      delete control.syncedWith
      delete syncedControl.syncWith
    }

    this.props.handleControlChange(control, controlData, isCustomName)
    return field
  }

  handleCardChange(control, selection) {
    const { controlData, isCustomName } = this.props
    const { multiselect, newEditorMode } = control
    if (!newEditorMode) {
      if (!multiselect) {
        control.active = selection
      } else {
        if (!control.active) {
          control.active = [selection]
        } else {
          const inx = control.active.indexOf(selection)
          if (inx === -1) {
            control.active.push(selection)
          } else {
            control.active.splice(inx, 1)
          }
        }
      }
      this.props.handleControlChange(
        control,
        controlData,
        this.creationView,
        isCustomName
      )
    } else {
      control.active = []
      if (selection) {
        control.active.push(selection)
      }
      this.props.handleNewEditorMode(control, controlData, this.creationView)
    }
  }

  handleControlChange(control) {
    const { controlData } = this.props
    this.props.handleControlChange(control, controlData)
  }

  renderNotifications() {
    const { notifications = [] } = this.props
    if (notifications.length > 0) {
      return notifications.map(
        ({
          id,
          controlId,
          exception,
          kind = 'error',
          ref,
          tabInx = 0,
          editor,
          row
        }) => {
          const handleClick = () => {
            if (ref || controlId) {
              ref = document.getElementById(controlId) || ref
              if (ref) {
                ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            } else if (editor && row) {
              const tabContainer = document.querySelector(
                '.creation-view-yaml-header-tabs'
              )
              if (tabContainer) {
                const tabs = tabContainer.getElementsByClassName(
                  '.bx--tabs__nav-link'
                )
                if (tabs.length > 0) {
                  tabs[tabInx].click()
                }
              }
              setTimeout(() => {
                editor.revealLineInCenter(row)
              }, 0)
            }
          }
          const handleKeyPress = e => {
            if (e.key === 'Enter') {
              handleClick()
            }
          }
          return (
            <div
              id="notifications"
              key={exception}
              role="button"
              onClick={handleClick}
              tabIndex="0"
              aria-label={exception}
              onKeyDown={handleKeyPress}
            >
              <Notification
                key={id}
                title=""
                className="persistent notification"
                subtitle={exception}
                kind={kind}
              />
            </div>
          )
        }
      )
    }
    return <div id="notifications" />
  }

  renderDeleteGroupButton(control, inx) {
    const { i18n, controlData } = this.props
    const { prompts: { deletePrompt } } = control
    const handleGroupChange = () => {
      this.props.handleGroupChange(
        control,
        controlData,
        this.creationView,
        inx
      )
    }
    const handleGroupChangeKey = e => {
      if (e.type === 'click' || e.key === 'Enter') {
        handleGroupChange()
      }
    }
    const text = i18n(deletePrompt)
    return (
      <div
        className="creation-view-controls-delete-button"
        tabIndex="0"
        role={'button'}
        title={text}
        aria-label={text}
        onClick={handleGroupChange}
        onKeyPress={handleGroupChangeKey}
      >
        <svg className="icon">
          <use href={'#icons_trash'} />
        </svg>
      </div>
    )
  }

  renderAddGroupButton(control) {
    const { i18n, controlData } = this.props
    const { prompts: { addPrompt } } = control
    const handleGroupChange = () => {
      this.props.handleGroupChange(control, controlData, this.creationView)
    }
    const handleGroupChangeKey = e => {
      if (e.type === 'click' || e.key === 'Enter') {
        handleGroupChange()
      }
    }
    const text = i18n(addPrompt)
    return (
      <div className="creation-view-controls-add-value-container">
        <div
          id={`add-${control.id}`}
          className="creation-view-controls-add-button"
          tabIndex="0"
          role={'button'}
          title={text}
          aria-label={text}
          onClick={handleGroupChange}
          onKeyPress={handleGroupChangeKey}
        >
          {text}
          <svg className="icon">
            <use href={'#icons_add'} />
          </svg>
        </div>
      </div>
    )
  }
}

export default ControlPanel

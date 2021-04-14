'use strict'

import React  from 'react'
import ReactDOM from 'react-dom'
import { Prompt } from 'react-router-dom'
import classNames from 'classnames'
import EventEmitter from 'events'
import PropTypes from 'prop-types'
import {
  Button,
  Switch,
  Alert
} from '@patternfly/react-core'
import {
  initializeControls,
  generateSource,
  getUniqueName,
  cacheUserData
} from './utils/source-utils'
import { createTemplateInput } from './utils/create-template-input'
import {
  logCreateErrors,
  logSourceErrors,
} from './utils/logger'
import ResourceEditor from './ResourceEditor/src'
import { validateControls } from './utils/validate-controls'
import { updateEditStack } from './utils/refresh-source-from-stack'
import {
  highlightChanges,
  highlightAllChanges
} from './utils/refresh-source-highlighting'
import ControlPanel from './controls/ControlPanel'
import './scss/template-editor.scss'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import keyBy from 'lodash/keyBy'
const TEMPLATE_EDITOR_OPEN_COOKIE = 'template-editor-open-cookie'

const Portals = Object.freeze({
  editBtn: 'edit-button-portal-id',
  cancelBtn: 'cancel-button-portal-id',
  createBtn: 'create-button-portal-id'
})

export default class TemplateEditor extends React.Component {
  static propTypes = {
    controlData: PropTypes.array.isRequired,
    createControl: PropTypes.shape({
      hasPermissions: PropTypes.bool,
      createResource: PropTypes.func,
      pauseCreate: PropTypes.func,
      cancelCreate: PropTypes.func,
      creationStatus: PropTypes.string,
      creationMsg: PropTypes.array
    }).isRequired,
    fetchControl: PropTypes.shape({
      resources: PropTypes.array,
      isLoaded: PropTypes.bool,
      isFailed: PropTypes.bool,
      fetchData: PropTypes.object
    }),
    i18n: PropTypes.func,
    initialOpen: PropTypes.bool,
    logging: PropTypes.bool,
    monacoEditor: PropTypes.element,
    portals: PropTypes.object,
    template: PropTypes.func.isRequired,
    title: PropTypes.string,
    type: PropTypes.string,
  };

  static getDerivedStateFromProps(props, state) {
    const { monacoEditor, createControl = {}, type, initialOpen } = props
    const { i18n, resourceJSON } = state

    // update notifications
    let { notifications } = state
    const { hasFormExceptions, isEditing } = state
    const { creationStatus, creationMsg } = createControl
    if (creationStatus && !hasFormExceptions) {
      switch (creationStatus) {
      case 'IN_PROGRESS':
        notifications = [
          {
            id: 'creating',
            kind: 'info',
            exception: Array.isArray(creationMsg) && creationMsg.length
              ? creationMsg[0]
              : i18n(
                isEditing
                  ? 'success.create.updating'
                  : 'success.create.creating',
                [type]
              )
          }
        ]
        break

      case 'DONE':
        notifications = [
          {
            id: 'success',
            kind: 'success',
            exception: Array.isArray(creationMsg)
              ? creationMsg[0]
              : i18n(
                isEditing
                  ? 'success.create.updated'
                  : 'success.create.created',
                [type]
              )
          }
        ]
        break

      case 'ERROR':
        logCreateErrors(this.props.logging, creationMsg, resourceJSON)
        notifications = creationMsg.map(message => {
          return {
            id: 'create',
            kind: 'error',
            exception: message.message || message
          }
        })
        break
      }
      return { notifications }
    }

    // is a resource loaded in editor?
    const { fetchControl } = props
    const { isLoaded, isFailed } = fetchControl || { isLoaded: true }
    const showEditor =
      (monacoEditor||initialOpen) && isLoaded && !!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE)
    let newState = { isLoaded, isFailed, showEditor }

    // has control data been initialized?
    const { controlData: initialControlData } = props
    let { controlData } = state
    const { editor, showSecrets } = state
    if (!controlData) {
      // initialize control data
      const cd = cloneDeep(initialControlData)
      controlData = initializeControls(cd, editor, i18n)
      newState = { ...newState, controlData }

      const showControl = controlData.find(
        ({ id: idCtrl }) => idCtrl === 'showSecrets'
      )
      if (showControl) {
        showControl.active = showSecrets
      }
    }

    // create new template input which is property of ResourceEditor which creates the source
    if (isLoaded) {
      newState = {
        ...newState,
        templateInput: createTemplateInput(controlData)
      }
    }

    return newState
  }

  constructor(props) {
    super(props)
    this.state = {
      isCustomName: false,
      showEditor: !!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE),
      template: props.template,
      i18n: props.i18n || ((msg) => msg),
      activeYAMLEditor: 0,
      exceptions: [],
      previouslySelectedCards: [],
      notifications: [],
      otherYAMLTabs: [],
      /* eslint-disable-next-line react/no-unused-state */
      hasFormExceptions: false,
      isFinalValidate: false,
      hasUndo: false,
      hasRedo: false,
      resetInx: 0,
      hasPauseCreate: !!get(props, 'createControl.pauseCreate'),
      editor: {
        forceUpdate: (() => {
          this.forceUpdate()
        }).bind(this),
        currentData: (() => {
          return this.state.controlData
        }).bind(this)
      }
    }

    this.isDirty = false
    this.handleNewEditorMode = this.handleNewEditorMode.bind(this)
    this.handleControlChange = this.handleControlChange.bind(this)
    this.handleGroupChange = this.handleGroupChange.bind(this)

    // on editor change
    this.editorEvents = new EventEmitter()
    this.editorEvents.on('change', this.handleEditorChange.bind(this))
  }

  componentDidMount() {
    if (!this.renderedPortals) {
      setTimeout(() => {
        this.forceUpdate()
      }, 0)
    }
  }

  setContainerRef = container => {
    this.containerRef = container
  };

  render() {
    const { isLoaded, isFailed, showEditor, hasPauseCreate, i18n } = this.state

    if (isLoaded && isFailed) {
      return (
        <Alert
          variant={'danger'}
          title={i18n('overview.error.default')}
        />
      )
    }
    const viewClasses = classNames({
      'temptifly': true,
      showEditor
    })
    return (
      <div
        className={viewClasses}
        ref={this.setContainerRef}
      >
        {!hasPauseCreate && <Prompt
          when={this.isDirty}
          message={i18n('changes.maybe.lost')}
        />}
        {this.renderResourceEditor(isLoaded)}
        {this.renderEditButton(isLoaded)}
        {this.renderCreateButton(isLoaded)}
        {this.renderCancelButton()}
      </div>
    )
  }

  renderResourceEditor(isLoaded) {
    const { template, monacoEditor, logging, title, type } = this.props
    const { showEditor, templateInput } = this.state
    return (
      <ResourceEditor
        type={type}
        title={title}
        template={template}
        templateInput={templateInput}
        renderForm={this.renderControls.bind(this)}
        monacoEditor={monacoEditor}
        showEditor={showEditor}
        showLogging={logging}
        editorEvents={this.editorEvents}
        isLoaded={isLoaded}
      />
    )
  }

  renderControls() {
    const { isLoaded, controlData, showEditor, isCustomName, notifications, i18n } = this.state
    const {
      controlData: originalControlData,
      fetchControl
    } = this.props
    const { fetchData } = fetchControl || {}
    return (
      <ControlPanel
        handleControlChange={this.handleControlChange}
        handleNewEditorMode={this.handleNewEditorMode}
        handleGroupChange={this.handleGroupChange}
        controlData={controlData || originalControlData}
        fetchData={fetchData}
        originalControlData={originalControlData}
        notifications={notifications}
        showEditor={showEditor}
        showPortals={this.props.portals ? null : Portals}
        isCustomName={isCustomName}
        isLoaded={isLoaded}
        i18n={i18n}
      />
    )
  }

  // 
  handleEditorChange({editors, templateYAML, templateObject, templateResources, syntaxErrors, isDirty, otherYAMLTabs}) {
    const { controlData, isFinalValidate, i18n } = this.state
    validateControls(
      editors,
      templateYAML,
      otherYAMLTabs,
      controlData,
      isFinalValidate,
      i18n
    )
    const notifications = controlData.filter(c => {
      return !!c.exception && isFinalValidate
    })
    this.setState({
      exceptions: [],
      notifications
    })
  }

  handleControlChange(control, controlData, creationView, isCustomName) {
    const {
      template,
      templateYAML,
      otherYAMLTabs,
      firstTemplateYAML,
      editStack,
      isFinalValidate,
      i18n
    } = this.state

    // // if custom editing on a tab, clear it now that user is using controls
    // otherYAMLTabs.forEach(tab => {
    //   delete tab.control.customYAML
    // })

    // custom action when control is selected
    const { onSelect } = control
    if (typeof onSelect === 'function') {
      onSelect()
    }

    // const {
    //   templateYAML: newYAML,
    //   templateObject,
    //   templateResources
    // } = generateSource(template, editStack, controlData, otherYAMLTabs)
    // validateControls(
    //   this.editors,
    //   newYAML,
    //   otherYAMLTabs,
    //   controlData,
    //   isFinalValidate,
    //   i18n
    // )
    // highlightAllChanges(
    //   this.editors,
    //   templateYAML,
    //   newYAML,
    //   otherYAMLTabs,
    //   this.selectedTab
    // )
    // const notifications = controlData.filter(c => {
    //   return !!c.exception && isFinalValidate
    // })
    this.setState({
      controlData,
//      isCustomName,
//      templateYAML: newYAML,
      // templateObject,
      // templateResources,
      // exceptions: [],
      // notifications
    })
//    this.isDirty = firstTemplateYAML !== newYAML
    this.handleScrollAndCollapse(control, controlData, creationView)
  }

  handleGroupChange(control, controlData, creationView, inx) {
    const {
      showEditor,
      editor,
      template,
      templateYAML,
      otherYAMLTabs,
      firstTemplateYAML,
      editStack,
      isFinalValidate,
      i18n
    } = this.state
    const { active, controlData: cd } = control
    if (inx === undefined) {
      // add new group
      const { prompts: { nameId, baseName } } = control
      const newGroup = initializeControls(
        cd,
        editor,
        i18n,
        control.nextUniqueGroupID,
        true
      )
      control.nextUniqueGroupID++
      active.push(newGroup)
      const nameControl = keyBy(newGroup, 'id')[nameId]
      if (nameControl) {
        nameControl.active = `${baseName}-${active.length - 1}`
      }

      // scroll down
      setTimeout(() => {
        (showEditor ? creationView : window).scrollBy({
          top: 260,
          left: 0,
          behavior: 'smooth'
        })
      }, 100)
    } else {
      active.splice(inx, 1)
    }
    const {
      templateYAML: newYAML,
      templateObject,
      templateResources
    } = generateSource(template, editStack, controlData, otherYAMLTabs)
    validateControls(
      this.editors,
      newYAML,
      otherYAMLTabs,
      controlData,
      isFinalValidate,
      i18n
    )
    highlightAllChanges(
      this.editors,
      templateYAML,
      newYAML,
      otherYAMLTabs,
      this.selectedTab
    )
    this.setState({
      controlData,
      templateYAML: newYAML,
      templateObject,
      templateResources
    })
    this.isDirty = firstTemplateYAML !== newYAML
  }

  handleNewEditorMode(control, controlData, creationView) {
    let { notifications } = this.state
    const {
      controlData: newControlData,
      template,
      templateYAML,
      templateObject,
      templateResources,
      otherYAMLTabs
    } = this.changeEditorMode(control, controlData)
    controlData = newControlData

    delete control.exception
    if (notifications.length > 0) {
      notifications = controlData.filter(c => {
        return !!c.exception
      })
    }

    this.setState({
      controlData,
      template: template,
      templateYAML,
      templateObject,
      templateResources,
      notifications,
      exceptions: [],
      otherYAMLTabs
    })

    this.handleScrollAndCollapse(control, controlData, creationView)
  }

  // change editor mode based on what card is selected
  changeEditorMode(control, controlData) {
    let { template } = this.props
    const { editStack, otherYAMLTabs, editor, i18n } = this.state
    let { templateYAML, templateObject, templateResources } = this.state
    let newYAML = templateYAML
    let newYAMLTabs = otherYAMLTabs

    // delete all controls below this card control
    const { availableMap, groupControlData } = control
    const parentControlData = groupControlData || controlData
    const insertInx = parentControlData.findIndex(
      ({ id }) => id === control.id
    )
    const deleteLen = parentControlData.length - insertInx - 1
    if (deleteLen) {
      parentControlData.splice(insertInx + 1, deleteLen)
    }

    // add new controls and template
    const { change } = availableMap[control.active[0]] || {}
    if (change) {
      const { replaceTemplate = template, insertControlData } = change

      // insert control data into main control data
      if (insertControlData) {
        // splice control data with data from this card
        parentControlData.splice(
          insertInx + 1,
          0,
          ...cloneDeep(insertControlData)
        )

        // if this card control is in a group, tell each control
        // what group control it belongs to
        if (groupControlData) {
          parentControlData.forEach(cd => {
            cd.groupControlData = groupControlData
          })
        }
        controlData = initializeControls(controlData, editor, i18n)
      }

      // replace template and regenerate templateYAML and highlight diffs
      if (replaceTemplate) {
        template = replaceTemplate
        newYAMLTabs = newYAMLTabs || [];
        ({
          templateYAML: newYAML,
          templateObject,
          templateResources
        } = generateSource(template, editStack, controlData, newYAMLTabs))
        highlightAllChanges(
          this.editors,
          templateYAML,
          newYAML,
          otherYAMLTabs,
          this.selectedTab
        )
        templateYAML = newYAML
      }
    }
    return {
      controlData,
      template,
      templateYAML,
      templateObject,
      templateResources,
      otherYAMLTabs
    }
  }

  handleScrollAndCollapse(control, controlData, creationView) {
    const { showEditor, previouslySelectedCards } = this.state
    // user chose a card with new controls in it---scroll the view down to the new fields
    const {
      id,
      ref,
      uniqueGroupID = 0,
      scrollViewAfterSelection,
      collapseAboveAfterSelection,
      scrollViewToTopOnSelect
    } = control
    if (
      scrollViewAfterSelection ||
      collapseAboveAfterSelection ||
      scrollViewToTopOnSelect
    ) {
      const wasPreviouslySelected = previouslySelectedCards.includes(
        id + uniqueGroupID
      )
      if (!wasPreviouslySelected) {
        if (!creationView) {
          creationView = document.getElementsByClassName('content')[0]
        }
        const scrollView = showEditor && creationView.scrollBy ? creationView : window
        const controlTop = ref.getBoundingClientRect().top
        const panelTop = showEditor
          ? creationView.getBoundingClientRect().top
          : 200
        setTimeout(() => {
          switch (true) {
          // collapse section above when this control is selected
          case collapseAboveAfterSelection === true:
            controlData.some(({ id: tid, sectionRef, sectionTitleRef }) => {
              if (sectionRef && sectionTitleRef) {
                sectionRef.classList.toggle('collapsed', true)
                sectionTitleRef.classList.toggle('collapsed', true)
              }
              return id === tid
            })
            setTimeout(() => {
              scrollView.scrollTo({
                top: 0,
                left: 0
              })
            }, 100)
            break

            // scroll view down after control is selected by 'scrollViewAfterSelection' pixels
          case scrollViewAfterSelection !== undefined:
            scrollView.scrollBy({
              top: scrollViewAfterSelection,
              left: 0,
              behavior: 'smooth'
            })
            break

            // scroll control to top when cards have been collapsed (only one card shown)
          case scrollViewToTopOnSelect !== undefined:
            scrollView.scrollBy({
              top: controlTop - panelTop,
              left: 0,
              behavior: 'smooth'
            })
            break
          }
        }, 100)
        previouslySelectedCards.push(id + uniqueGroupID)
      }
    }
    this.setState({ previouslySelectedCards })
  }

  scrollControlPaneToTop = () => {
    setTimeout(() => {
      if (this.containerRef) {
        const notifications = this.containerRef.getElementsByClassName(
          'pf-c-alert'
        )
        if (notifications && notifications.length && notifications[0].scrollIntoView) {
          notifications[0].scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }
    }, 0)
  };

  renderEditButton(isLoaded) {
    const { monacoEditor, portals, i18n } = this.props
    const { editBtn } = portals || Portals
    if (monacoEditor && editBtn && isLoaded) {
      const portal = document.getElementById(editBtn)
      if (portal) {
        const { showEditor } = this.state
        const handleToggle = () => {
          if (showEditor) {
            localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
          } else {
            localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
          }
          this.setState({ showEditor: !showEditor })
        }
        this.renderedPortals = true
        return ReactDOM.createPortal(
          <div className="edit-template-switch">
            <Switch
              id="edit-yaml"
              key={`is${showEditor}`}
              isChecked={showEditor}
              label={i18n ? i18n('edit.yaml.on') : 'Show Yaml'}
              labelOff={i18n ? i18n('edit.yaml.off') : 'Hide Yaml'}
              onChange={handleToggle}
            />
          </div>,
          portal
        )
      }
    }
    return null
  }

  renderCancelButton() {
    const { portals, createControl={}, i18n } = this.props
    const { cancelBtn } = portals || Portals
    if (cancelBtn) {
      const portal = document.getElementById(cancelBtn)
      if (portal) {
        const { cancelCreate } = createControl
        return ReactDOM.createPortal(
          <Button id={cancelBtn} onClick={cancelCreate} variant={'secondary'}>
            {i18n ? i18n('button.cancel') : 'Cancel'}
          </Button>,
          portal
        )
      }
    }
    return null
  }

  renderCreateButton(isLoaded) {
    const { isEditing } = this.state
    const { portals, createControl={}, i18n } = this.props
    const { createBtn } = portals || Portals
    if (createBtn && isLoaded) {
      const { hasPermissions = true } = createControl
      const titleText = !hasPermissions
        ? (i18n ? i18n('button.save.access.denied') : 'Denied')
        : undefined
      let disableButton = true
      if (this.isDirty && hasPermissions) {
        disableButton = false
      }
      const portal = document.getElementById(createBtn)
      const label = isEditing
        ? (i18n ? i18n('button.update') : 'Update')
        : (i18n ? i18n('button.create') : 'Create')
      const button = (
        <Button
          id={`${createBtn}-btn`}
          onClick={this.handleCreateResource.bind(this)}
          variant={'primary'}
          isDisabled={disableButton}
          data-testid={createBtn}
        >
          {label}
        </Button>
      )
      if (portal) {
        return !hasPermissions
          ? ReactDOM.createPortal(
            <div
              title={titleText}
              isDisabled={!hasPermissions}
            >
              {button}
            </div>,
            portal
          )
          : ReactDOM.createPortal(button, portal)
      }
    }
    return null
  }

  handleCreateResource() {
    const { createControl } = this.props
    const { createResource } = createControl
    const resourceJSON = this.getResourceJSON()
    if (resourceJSON) {
      this.setState({resourceJSON})
      createResource(resourceJSON)
    }
  }

}

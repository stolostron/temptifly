'use strict'

import React  from 'react'
import loadable from '@loadable/component'
import { Prompt } from 'react-router-dom'
import SplitPane from 'react-split-pane'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import {
  generateSource,
  getUniqueName,
  cacheUserData
} from './utils/source-utils'
import {
  logCreateErrors,
  logSourceErrors,
} from './utils/logger'
/////////////////import { validateControls } from './src/utils/validate-controls'
import { updateEditStack } from './utils/refresh-source-from-stack'
import {
  highlightChanges,
  highlightAllChanges
} from './utils/refresh-source-highlighting'
import EditorHeader from './components/EditorHeader'
import EditorBar from './components/EditorBar'
import './css/template-editor.scss'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import keyBy from 'lodash/keyBy'
import merge from 'lodash/merge'

export const YamlEditor = loadable(() => import(/* webpackChunkName: "YamlEditor" */ './components/YamlEditor'))

const TEMPLATE_EDITOR_OPEN_COOKIE = 'template-editor-open-cookie'
const TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE =
  'template-editor-show-secrets-cookie'

export default class ResourceEditor extends React.Component {

  static propTypes = {
    editorEvents: PropTypes.object,
    renderForm: PropTypes.func.isRequired,
    isLoaded: PropTypes.bool,
    showEditor: PropTypes.bool,
    showLogging: PropTypes.bool,
    monacoEditor: PropTypes.element,
    template: PropTypes.func.isRequired,
    templateInput: PropTypes.object.isRequired,
    editResources: PropTypes.array,
    title: PropTypes.string,
    type: PropTypes.string,
  };

  static getDerivedStateFromProps(props, state) {
    const { isLoaded, template, templateInput, editResources, editorEvents } = props
    const { editor, editors, otherYAMLTabs, selectedTab } = state
    let { editStack, isEditing, templateYAML, firstTemplateYAML, isDirty } = state
    if (isLoaded) {

      // if editing an existing set of resources start an editStack
      if (editResources && !editStack) {
        editStack = { editResources, editor, i18n }
        isEditing = true
      }

      // if custom editing on a tab, clear it now that user is using controls
      otherYAMLTabs.forEach(tab => {
        delete tab.control.customYAML
      })

      // generate source from template or stack of resources
      const { templateYAML:newYAML, templateObject, templateResources, syntaxErrors } = generateSource(
        template,
        templateInput,
        editStack,
        otherYAMLTabs
      )

      // keep track of dirty state
      if (!firstTemplateYAML) {
          firstTemplateYAML = newYAML
      }
      isDirty = firstTemplateYAML !== newYAML

      if (templateYAML !== newYAML) {
        if (templateYAML) {
          // highlight changes in editor
          highlightAllChanges(
            editors,
            templateYAML,
            newYAML,
            otherYAMLTabs,
            selectedTab
          )
        }

      // send event to controls if yaml changed
        editorEvents.emit('change', {editors, templateYAML:newYAML, templateObject, templateResources, syntaxErrors, isDirty, otherYAMLTabs})
      }

      return {
        templateYAML:newYAML,
        firstTemplateYAML,
        templateObject,
        templateResources,
        syntaxErrors,
        editStack,
        isEditing,
        isDirty
      }
    }
    return {}
  }

  constructor(props) {
    super(props)
    this.editors = []
    this.selectedTab = 0
    this.state = {
      isDirty: false,
      isCustomName: false,
      showEditor: !!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE),
      showSecrets: !!localStorage.getItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE),
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
      selectedTab: this.selectedTab,
      editors: this.editors,
      editor: {
        forceUpdate: (() => {
          this.forceUpdate()
        }).bind(this),
        currentData: (() => {
          return this.state.controlData
        }).bind(this)
      }
    }

    this.firstGoToLinePerformed = false
    this.parseDebounced = debounce(yaml => {
      this.handleParse(yaml)
    }, 500)
    this.handleEditorCommand = this.handleEditorCommand.bind(this)
    this.handleSearchChange = this.handleSearchChange.bind(this)
    this.gotoEditorLine = this.gotoEditorLine.bind(this)
    if (props.initialOpen) {
      localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
    }
    const { type = 'main' } = this.props
    this.splitterSizeCookie = `TEMPLATE-EDITOR-SPLITTER-SIZE-${type.toUpperCase()}`
    if (!this.state.hasPauseCreate) {
      this.beforeUnloadFunc = (event => {
        if (this.isDirty) {
          event.preventDefault()
          event.returnValue = this.isDirty
        }
      }).bind(this)
      window.addEventListener('beforeunload', this.beforeUnloadFunc)
    }
  }

  componentDidMount() {
    if (!this.renderedPortals) {
      setTimeout(() => {
        this.forceUpdate()
      }, 0)
    }
    this.innerWidth = window.innerWidth
    window.addEventListener('resize', (()=>{
      if (this.innerWidth !== window.innerWidth) {
        this.innerWidth = window.innerWidth
        localStorage.removeItem(this.splitterSizeCookie)
        const pane1 = document.getElementsByClassName('Pane1')
        if (pane1 && pane1[0]) {
          pane1[0].style.width = `${this.innerWidth/2}px`
        }
      }
      this.layoutEditors()
    }).bind(this))
  }

  componentWillUnmount() {
    const { createControl={} } = this.props
    if (createControl.pauseCreate) {
      const { controlData } = this.state
      createControl.pauseCreate(controlData)
    }
    window.removeEventListener('beforeunload', this.beforeUnloadFunc)
  }

  setSplitPaneRef = splitPane => (this.splitPane = splitPane);

  handleSplitterDefault = () => {
    const width = window.innerWidth
    const cookie = localStorage.getItem(this.splitterSizeCookie)
    let size = cookie ? parseInt(cookie, 10) : width
    if (!cookie) {
      size = width / 2
      localStorage.setItem(this.splitterSizeCookie, size)
    } else if (size > width * 7 / 10) {
      size = width * 7 / 10
    }
    return size
  };

  handleSplitterChange = size => {
    localStorage.setItem(this.splitterSizeCookie, size)
    this.layoutEditors()
  };

  setContainerRef = container => {
    this.containerRef = container
    this.layoutEditors()
  };

  // render() {
  //   const { isLoaded, showEditor, resetInx, hasPauseCreate, i18n } = this.state
  //   if (!showEditor) {
  //     this.editors = []
  //   }

  //   const viewClasses = classNames({
  //     'temptifly': true,
  //     showEditor
  //   })
  //   return (
  //     <div
  //       key={`key${resetInx}`}
  //       className={viewClasses}
  //       ref={this.setContainerRef}
  //     >
  //       {!hasPauseCreate && <Prompt
  //         when={this.isDirty}
  //         message={i18n('changes.maybe.lost')}
  //       />}
  //       {this.renderSplitEditor(isLoaded)}
  //     </div>
  //   )
  // }

  render() {
    const { showEditor, renderForm } = this.props
    const editorClasses = classNames({
      'creation-view-split-container': true,
      showEditor
    })
    let maxSize
    const page = document.getElementById('page')
    if (page) {
      maxSize = page.getBoundingClientRect().width * 8 / 10
    }
    return (
      <div className={editorClasses}>
        {showEditor ? (
          <SplitPane
            split="vertical"
            minSize={50}
            maxSize={maxSize}
            ref={this.setSplitPaneRef}
            defaultSize={this.handleSplitterDefault()}
            onChange={this.handleSplitterChange}
          >
            {renderForm()}
            {this.renderEditor()}
          </SplitPane>
        ) : (
          renderForm()
        )}
      </div>
    )
  }

  renderEditor() {
    const { type = 'main', title='YAML' } = this.props
    const {
      hasUndo,
      hasRedo,
      exceptions,
      otherYAMLTabs,
      showSecrets,
      i18n
    } = this.state
    return (
      <div className="creation-view-yaml">
        <EditorHeader
          otherYAMLTabs={otherYAMLTabs}
          handleTabChange={this.handleTabChange}
          handleShowSecretChange={this.handleShowSecrets.bind(this)}
          showSecrets={showSecrets}
          type={type}
          i18n={i18n}
        >
          <EditorBar
            title={title}
            type={type}
            hasUndo={hasUndo}
            hasRedo={hasRedo}
            exceptions={exceptions}
            gotoEditorLine={this.gotoEditorLine}
            handleEditorCommand={this.handleEditorCommand}
            handleSearchChange={this.handleSearchChange}
            i18n={this.props.i18n}
          />
        </EditorHeader>
        {this.renderEditors()}
      </div>
    )
  }

  renderEditors = () => {
    const { monacoEditor } = this.props
    const { activeYAMLEditor, otherYAMLTabs, templateYAML } = this.state
    return (
      <React.Fragment>
        <YamlEditor
          editor={monacoEditor}
          key={'main'}
          hide={activeYAMLEditor !== 0}
          width={'100%'}
          height={'100%'}
          wrapEnabled={true}
          setEditor={this.addEditor}
          onYamlChange={this.handleEditorChange}
          yaml={templateYAML}
        />
        {otherYAMLTabs.map(({ id, templateYAML: yaml }, inx) => {
          return (
            <YamlEditor
              editor={monacoEditor}
              id={id}
              key={id}
              hide={activeYAMLEditor !== inx + 1}
              width={'100%'}
              height={'100%'}
              wrapEnabled={true}
              setEditor={this.addEditor}
              onYamlChange={this.handleEditorChange}
              yaml={yaml}
            />
          )
        })}
      </React.Fragment>
    )
  };

  handleTabChange = tabInx => {
    this.selectedTab = tabInx
    this.setState({ activeYAMLEditor: tabInx })
    this.layoutEditors()
  };

  addEditor = editor => {
    const { otherYAMLTabs } = this.state
    this.editors.push(editor)
    if (this.editors.length > 1) {
      otherYAMLTabs[this.editors.length - 2].editor = editor
    }
    this.layoutEditors()

    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      const hasUndo = model.canUndo()
      const hasRedo = model.canRedo()
      this.setState({ hasUndo, hasRedo })
    })
  };

  layoutEditors() {
    if (this.containerRef && this.editors.length > 0) {
      const { otherYAMLTabs } = this.state
      const hasTabs = otherYAMLTabs.length > 0
      const controlsSize = this.handleSplitterDefault()
      const rect = this.containerRef.getBoundingClientRect()
      const width = rect.width - controlsSize - 16
      const height = rect.height - (hasTabs ? 80 : 40)
      this.editors.forEach(editor => {
        editor.layout({ width, height })
      })
    }
  }

  gotoEditorLine(line) {
    const { activeYAMLEditor } = this.state
    const editor = this.editors[activeYAMLEditor]
    editor.revealLineInCenter(line)
  }

  // text editor commands
  handleEditorCommand(command) {
    const { activeYAMLEditor } = this.state
    const editor = this.editors[activeYAMLEditor]
    switch (command) {
    case 'next':
    case 'previous':
      if (this.selectionIndex !== -1) {
        if (this.selections && this.selections.length > 1) {
          switch (command) {
          case 'next':
            this.selectionIndex++
            if (this.selectionIndex >= this.selections.length) {
              this.selectionIndex = 0
            }
            break
          case 'previous':
            this.selectionIndex--
            if (this.selectionIndex < 0) {
              this.selectionIndex = this.selections.length - 1
            }
            break
          }
          editor.revealLineInCenter(
            this.selections[this.selectionIndex].selectionStartLineNumber,
            0
          )
        }
      }
      break
    case 'undo':
      if (editor) {
        editor.trigger('api', 'undo')
      }
      break
    case 'redo':
      if (editor) {
        editor.trigger('api', 'redo')
      }
      break
    case 'restore':
      this.resetEditor()
      break
    case 'close':
      this.closeEdit()
      break
    }
    return command
  }

  closeEdit() {
    localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
    this.setState({ showEditor: false })
  }

  handleShowSecrets() {
    const { showSecrets, controlData } = this.state
    if (showSecrets) {
      localStorage.removeItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE)
    } else {
      localStorage.setItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE, 'true')
    }
    const showControl = controlData.find(
      ({ id: idCtrl }) => idCtrl === 'showSecrets'
    )
    if (showControl) {
      showControl.active = !showSecrets
      this.setState({ showSecrets: !showSecrets })
      this.handleControlChange(showControl, controlData)
    }
  }

  handleSearchChange(searchName) {
    const { activeYAMLEditor } = this.state
    const editor = this.editors[activeYAMLEditor]
    if (searchName.length > 1 || this.nameSearchMode) {
      if (searchName) {
        const found = editor.getModel().findMatches(searchName)
        if (found.length > 0) {
          this.selections = found.map(({ range }) => {
            const {
              endColumn,
              endLineNumber,
              startColumn,
              startLineNumber
            } = range
            return {
              positionColumn: endColumn,
              positionLineNumber: endLineNumber,
              selectionStartColumn: startColumn,
              selectionStartLineNumber: startLineNumber
            }
          })
          editor.setSelections(this.selections)
          editor.revealLineInCenter(
            this.selections[0].selectionStartLineNumber,
            0
          )
          this.selectionIndex = 1
        } else {
          this.selections = null
          this.selectionIndex = -1
        }
      } else {
        this.selections = null
        this.selectionIndex = -1
        editor.setSelections([{
          positionColumn: 0,
          positionLineNumber: 0,
          selectionStartColumn: 0,
          selectionStartLineNumber: 0
        }])
      }
      this.nameSearch = searchName
      this.nameSearchMode = searchName.length > 0
    }
  }

  handleEditorChange = yaml => {
    this.parseDebounced(yaml)
  };

  handleParse = yaml => {
    const {
      otherYAMLTabs,
      activeYAMLEditor,
      controlData,
      templateResources,
      firstTemplateYAML,
      isFinalValidate,
      i18n
    } = this.state
    let { editStack, templateYAML, notifications } = this.state

    if (activeYAMLEditor === 0) {
      templateYAML = yaml
    } else {
      const tab = otherYAMLTabs[activeYAMLEditor - 1]
      // protect user edits from being clobbered by form updates
      tab.control.customYAML = yaml
      // update the yaml shown in this tab
      tab.templateYAML = yaml
    }

    // update controls with values typed into yaml
//    const {
//      parsedResources,
///      templateExceptionMap,
//      hasSyntaxExceptions
//    } = validateControls(
//      this.editors,
//      templateYAML,
//      otherYAMLTabs,
//      controlData,
//      isFinalValidate,
//      i18n
//    )
    if (notifications.length > 0) {
      notifications = []
      if (hasSyntaxExceptions) {
        Object.values(templateExceptionMap).forEach(({ exceptions }) => {
          exceptions.forEach(({ row, text, editor, tabInx }) => {
            notifications.push({
              id: 'error',
              kind: 'error',
              exception: i18n('error.create.syntax', [text]),
              text,
              row,
              editor,
              tabInx
            })
          })
        })
      } else {
        notifications = controlData.filter(control => {
          return !!control.exception
        })
      }
    }

    this.isDirty = firstTemplateYAML !== yaml

    // update edit stack so that when the user changes something in the form
    // it doesn't wipe out what they just typed
    editStack = updateEditStack(editStack, templateResources, parsedResources)

    // if typing on another tab that represents encoded yaml in the main tab,
    // update the main yaml--for now
    if (activeYAMLEditor !== 0) {
      const { template, templateYAML: oldYAML } = this.state
      const {
        templateYAML: newYAML,
        templateObject,
        templateResources: tr
      } = generateSource(template, editStack, controlData, otherYAMLTabs)
      highlightChanges(this.editors[0], oldYAML, newYAML)
      this.setState({
        controlData,
        notifications,
        templateYAML: newYAML,
        templateObject,
        templateResources: tr,
        editStack
      })
    } else {
      this.setState({ controlData, notifications, templateYAML, editStack })
    }

    return templateYAML // for jest test
  };

  getResourceJSON() {
    const { templateYAML, controlData, otherYAMLTabs, editStack, i18n } = this.state
    let canCreate = false
//    const {
 //     templateObjectMap,
//      templateExceptionMap,
//      hasSyntaxExceptions,
//      hasValidationExceptions
//    } = validateControls(
//      this.editors,
//      templateYAML,
//      otherYAMLTabs,
//      controlData,
//      true,
//      i18n
//    )
    let notifications = []
    if (hasSyntaxExceptions || hasValidationExceptions) {
      logSourceErrors(this.props.logging, templateYAML, controlData, otherYAMLTabs, templateExceptionMap)
      Object.values(templateExceptionMap).forEach(({ exceptions }) => {
        exceptions.forEach(({ row, text, editor, tabInx, controlId, ref }) => {
          notifications.push({
            id: 'error',
            kind: 'error',
            exception: i18n('error.create.syntax', [text]),
            text,
            row,
            editor,
            tabInx,
            controlId,
            ref
          })
        })
      })
    } else {
      notifications = controlData.filter(control => {
        return !!control.exception
      })
    }
    canCreate = notifications.length === 0

    this.setState({
      notifications,
      /* eslint-disable-next-line react/no-unused-state */
      hasFormExceptions: !canCreate,
      isFinalValidate: true
    })
    this.isDirty = false
    this.scrollControlPaneToTop()

    if (canCreate) {
      // cache user data
      cacheUserData(controlData)

      // create payload
      const payload = []
      Object.entries(templateObjectMap['<<main>>']).forEach(([, values]) => {
        values.forEach(({ $raw }) => {
          if ($raw) {
            payload.push($raw)
          }
        })
      })
      this.replaceSecrets(payload)

      return {createResources: payload, deleteResources: editStack ? [...editStack.deletedLinks] : undefined}
    }
    return null
  }

  replaceSecrets = payload => {
    const { templateObject } = this.state
    if (templateObject.Secret) {
      const secretsMap = keyBy(templateObject.Secret
        .filter(({$raw: {metadata}})=>metadata), ({ $raw }) => {
        const { metadata: { name, namespace } } = $raw
        return `${namespace}/${name}`
      })
      payload.filter(({metadata})=>metadata).forEach(resource => {
        const { kind, metadata: { name, namespace } } = resource
        if (kind === 'Secret') {
          const secret = secretsMap[`${namespace}/${name}`]
          if (secret) {
            merge(resource, secret.$raw)
          }
        }
      })
    }
  };

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

  handleCreateResource() {
    const { createControl } = this.props
    const { createResource } = createControl
    const resourceJSON = this.getResourceJSON()
    if (resourceJSON) {
      this.setState({resourceJSON})
      createResource(resourceJSON)
    }
  }

  resetEditor() {
    const { controlData: initialControlData } = this.props
    const { template, editStack = {}, resetInx, editor, i18n } = this.state
    const cd = cloneDeep(initialControlData)
    const controlData = {}
    const otherYAMLTabs = []
    if (editStack.initialized) {
      delete editStack.initialized
    }
    const { templateYAML, templateObject, templateResources } = generateSource(
      template,
      editStack,
      controlData,
      otherYAMLTabs
    )
    this.setState({
      isCustomName: false,
      template,
      controlData,
      activeYAMLEditor: 0,
      exceptions: [],
      previouslySelectedCards: [],
      notifications: [],
      otherYAMLTabs,
      hasUndo: false,
      hasRedo: false,
      isFinalValidate: false,
      templateYAML,
      templateObject,
      templateResources,
      editStack,
      resetInx: resetInx + 1
    })
    this.isDirty = false
    this.selectedTab = 0
    this.firstGoToLinePerformed = false
    this.editors = []
  }
}

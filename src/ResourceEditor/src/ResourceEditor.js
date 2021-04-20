'use strict'

import React  from 'react'
import { Prompt } from 'react-router-dom'
import SplitPane from 'react-split-pane'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { generateSource } from './utils/source-utils'
import { logSourceErrors } from './utils/logger'
import { updateEditStack } from './utils/refresh-source-from-stack'
import { refreshSourceValidation } from './utils/refresh-source-validation'
import {
  highlightChanges,
  highlightAllChanges
} from './utils/refresh-source-highlighting'
import EditorHeader from './components/EditorHeader'
import EditorBar from './components/EditorBar'
import YamlEditor from './components/YamlEditor'
import './css/resource-editor.scss'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import keyBy from 'lodash/keyBy'
import merge from 'lodash/merge'
import isEqual from 'lodash/isEqual'


const RESOURCE_EDITOR_OPEN_COOKIE = 'resource-editor-open-cookie'
const RESOURCE_EDITOR_SHOW_SECRETS_COOKIE =
  'resource-editor-show-secrets-cookie'

export default class ResourceEditor extends React.Component {

  static propTypes = {
    editorEvents: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    renderForm: PropTypes.func.isRequired,
    validateForm: PropTypes.func.isRequired,
    isLoaded: PropTypes.bool,
    showEditor: PropTypes.bool,
    showLogging: PropTypes.bool,
    monacoEditor: PropTypes.element,
    template: PropTypes.func.isRequired,
    templateInput: PropTypes.object.isRequired,
    title: PropTypes.string,
    type: PropTypes.string,
  };

  constructor(props) {
    super(props)
    this.state = {
      isDirty: false,
      isCustomName: false,
      showEditor: !!localStorage.getItem(RESOURCE_EDITOR_OPEN_COOKIE),
      showSecrets: !!localStorage.getItem(RESOURCE_EDITOR_SHOW_SECRETS_COOKIE),
      template: props.template,
      i18n: props.i18n || ((msg) => msg),
      activeYAMLEditor: 0,
      exceptions: [],
      previouslySelectedCards: [],
      notifications: [],
      otherYAMLTabs: [],
      customYAMLTabs: [],
      /* eslint-disable-next-line react/no-unused-state */
      hasFormExceptions: false,
      isFinalValidate: false,
      hasUndo: false,
      hasRedo: false,
      resetInx: 0,
      hasPauseCreate: !!get(props, 'createControl.pauseCreate'),
      editors: [],
      editor: {
        forceUpdate: (() => {
          this.forceUpdate()
        }).bind(this),
        currentData: (() => {
          return this.state.controlData
        }).bind(this)
      }
    }

    // if editing an existing set of resources start an editStack
    if (props.editResources) {
      this.state.editStack = { editResources:props.editResources, editor:this.state.editor, i18n:this.state.i18n }
      this.state.isEditing = true
    }

    this.parseDebounced = debounce(yaml => {
      this.handleParse(yaml)
    }, 500)
    this.handleEditorCommand = this.handleEditorCommand.bind(this)
    this.handleSearchChange = this.handleSearchChange.bind(this)
    this.gotoEditorLine = this.gotoEditorLine.bind(this)
    if (props.initialOpen) {
      localStorage.setItem(RESOURCE_EDITOR_OPEN_COOKIE, 'true')
    }
    const { type = 'main' } = this.props
    this.splitterSizeCookie = `RESOURCE-EDITOR-SPLITTER-SIZE-${type.toUpperCase()}`
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

    if (!this.state.hasPauseCreate) {
      this.beforeUnloadFunc = (event => {
        if (this.state.isDirty) {
          event.preventDefault()
          event.returnValue = this.state.isDirty
        }
      }).bind(this)
      window.addEventListener('beforeunload', this.beforeUnloadFunc)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { showEditor, validateForm, onChange } = this.props
    let { editors } = this.state

    // control changed or user typed in 2nd tab
    if (!isEqual(this.props.templateInput, this.state.templateInput) ||
        !isEqual(prevState.customYAMLTabs, this.state.customYAMLTabs)) {
        const { template, templateInput } = this.props
        let { firstTemplateYAML } = this.state
        const {customYAMLTabs, editStack, otherYAMLTabs} = this.state
  
        const {templateYAML, sourcePathMap, secretsMap} =
          generateSource(template, {...templateInput, customYAMLTabs}, editStack, otherYAMLTabs)

        // keep track of dirty state
        if (!firstTemplateYAML) {
          firstTemplateYAML = templateYAML
        }
        let isDirty = firstTemplateYAML !== templateYAML

        if (!showEditor && editors.length>0) {
          editors = []
        }

        // highlight changes in editor
        if (this.state.templateYAML) {
          if (!isEqual(prevState.customYAMLTabs, this.state.customYAMLTabs)) {
            highlightChanges(editors[0], this.state.templateYAML, templateYAML)
          } else {
            highlightAllChanges(
              editors,
              this.state.templateYAML,
              templateYAML,
              otherYAMLTabs,
              this.state.activeYAMLEditor
            )
          }
        }
  
        // parse/syntax check the yaml
        const {parsed, templateObjectMap} = refreshSourceValidation(editors, templateYAML, otherYAMLTabs, validateForm, sourcePathMap)

        // send event to controls to fill and validate
        onChange({editors, parsed: parsed.parsed, templateObjectMap, sourcePathMap, secretsMap, isDirty})
      
        this.setState({
          templateInput: cloneDeep(templateInput),
          templateYAML,
          firstTemplateYAML,
          otherYAMLTabs,
          sourcePathMap,
          editors,
          secretsMap,
          isDirty
        })
    // user typed in the main tab
    } else if (prevState.customYAML !== this.state.customYAML) {
      let { firstTemplateYAML } = this.state
      const { templateYAML, otherYAMLTabs, sourcePathMap, secretsMap } = this.state
      let isDirty = firstTemplateYAML !== templateYAML
  
      // parse/syntax check the yaml
      const parsed = refreshSourceValidation(editors, templateYAML, otherYAMLTabs, validateForm, sourcePathMap)

      // send event to controls to fill and validate
      onChange({editors, parsed, sourcePathMap, secretsMap, isDirty})
      
      this.setState({
        isDirty
      })
    } else if (!showEditor && editors.length>0) {
      this.setState({
        editors: []
      })  
    }
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

  render() {
    const { showEditor, renderForm } = this.props
    const { hasPauseCreate, resetInx, isDirty } = this.state
    const viewClasses = classNames({
      'resource-editor': true,
      showEditor
    })
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
      <div key={`key${resetInx}`} className={viewClasses} ref={this.setContainerRef} >
        {!hasPauseCreate && <Prompt
          when={isDirty}
          message={'changes.maybe.lost'}
        />}
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
      </div>
    )
  }

  renderEditor() {
    const { template, templateInput, type = 'main', title='YAML' } = this.props
    const {
      hasUndo,
      hasRedo,
      exceptions,
      showSecrets,
      customYAMLTabs,
      editStack,
      otherYAMLTabs,
      i18n
    } = this.state
    const { templateYAML } =
      generateSource(template, {...templateInput, customYAMLTabs}, editStack, otherYAMLTabs)

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
        {this.renderEditors(templateYAML, otherYAMLTabs)}
      </div>
    )
  }

  renderEditors = (templateYAML, otherYAMLTabs) => {
    const { monacoEditor } = this.props
    const { activeYAMLEditor } = this.state
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
    this.setState({ activeYAMLEditor: tabInx})
    this.layoutEditors()
  };

  addEditor = editor => {
    const { editors, otherYAMLTabs } = this.state
    editors.push(editor)
    if (editors.length > 1) {
      otherYAMLTabs[editors.length - 2].editor = editor
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
    const { editors } = this.state
    if (this.containerRef && editors.length > 0) {
      const { otherYAMLTabs } = this.state
      const hasTabs = otherYAMLTabs.length > 0
      const controlsSize = this.handleSplitterDefault()
      const rect = this.containerRef.getBoundingClientRect()
      const width = rect.width - controlsSize - 16
      const height = rect.height - (hasTabs ? 80 : 40)
      editors.forEach(editor => {
        editor.layout({ width, height })
      })
    }
  }

  gotoEditorLine(line) {
    const { editors, activeYAMLEditor } = this.state
    const editor = editors[activeYAMLEditor]
    editor.revealLineInCenter(line)
  }

  // text editor commands
  handleEditorCommand(command) {
    const { editors, activeYAMLEditor } = this.state
    const editor = editors[activeYAMLEditor]
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
    localStorage.removeItem(RESOURCE_EDITOR_OPEN_COOKIE)
    this.setState({ showEditor: false })
  }

  handleShowSecrets() {
    const { showSecrets, controlData } = this.state
    if (showSecrets) {
      localStorage.removeItem(RESOURCE_EDITOR_SHOW_SECRETS_COOKIE)
    } else {
      localStorage.setItem(RESOURCE_EDITOR_SHOW_SECRETS_COOKIE, 'true')
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
    const { editors, activeYAMLEditor } = this.state
    const editor = editors[activeYAMLEditor]
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
      activeYAMLEditor,
      templateResources,
      firstTemplateYAML,
      editors,
      isFinalValidate,
    } = this.state
    let { editStack, templateYAML, customYAML, customYAMLTabs } = this.state
    const {template, templateInput, editorEvents} = this.props

    if (activeYAMLEditor === 0) {
      customYAML = templateYAML = yaml
    } else {
      customYAMLTabs = cloneDeep(customYAMLTabs)
      customYAMLTabs[activeYAMLEditor - 1] = yaml
    }

    // update edit stack so that when the user changes something in the form
    // it doesn't wipe out what they just typed
 ///   editStack = updateEditStack(editStack, templateResources, parsedResources, customYAMLTabs)

    this.setState({
      templateYAML,
      customYAML,
      customYAMLTabs,
      editStack
    })
  }

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
    ////////////////////////////////////////this.isDirty = false
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
      resetInx: resetInx + 1,
      isDirty: false,
      editors: []
    })
  }
}

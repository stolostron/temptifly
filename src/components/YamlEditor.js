'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import MonacoEditor from 'react-monaco-editor'
import {
  global_BackgroundColor_100 as lineNumberActiveForeground,
  global_BackgroundColor_300 as lineNumberForeground,
  global_BackgroundColor_dark_100 as editorBackground
} from '@patternfly/react-tokens'

import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'

if (window.monaco) {
  window.monaco.editor.defineTheme('console', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // avoid pf tokens for `rules` since tokens are opaque strings that might not be hex values
      { token: 'number', foreground: 'ace12e' },
      { token: 'type', foreground: '73bcf7' },
      { token: 'string', foreground: 'f0ab00' },
      { token: 'keyword', foreground: 'cbc0ff' }
    ],
    colors: {
      'editor.background': editorBackground.value,
      'editorGutter.background': '#292e34', // no pf token defined
      'editorLineNumber.activeForeground': lineNumberActiveForeground.value,
      'editorLineNumber.foreground': lineNumberForeground.value
    }
  })
}

class MonacoEditorEx extends MonacoEditor {
  constructor(props) {
    super(props)

    // make sure comparison ignores \n\r
    this.componentDidUpdate = () => {
      const { value } = this.props
      const editor = this.editor
      const model = editor.getModel()
      const v1 = value
        .split('\r\n')
        .join('\n')
        .split('\r')
        .join('\n')
      const v2 = model
        .getValue()
        .split('\r\n')
        .join('\n')
        .split('\r')
        .join('\n')
      if (v1 !== v2) {
        this.__prevent_trigger_change_event = true
        this.editor.pushUndoStop()
        model.pushEditOperations(
          [],
          [
            {
              range: model.getFullModelRange(),
              text: value
            }
          ]
        )
        this.editor.pushUndoStop()
        this.__prevent_trigger_change_event = false
      }
    }
  }
}

class YamlEditor extends React.Component {
  editorWillMount() {
    // Monaco uses <span> to measure character sizes
    // therefore make sure <span> has the right font
    let stylesheet = document.querySelector('link[href*=main]')
    if (stylesheet) {
      stylesheet = stylesheet.sheet
      stylesheet.insertRule(
        'span { font-family: monospace }',
        stylesheet.cssRules.length
      )
    }
  }

  editorDidMount(editor, monaco) {
    const { setEditor } = this.props
    editor.layout()
    editor.focus()
    editor.monaco = monaco
    editor.decorations = []
    if (setEditor) {
      setEditor(editor)
    }
    this.editor = editor

    // remove the rule setting <span> font
    let stylesheet = document.querySelector('link[href*=main]')
    if (stylesheet) {
      stylesheet = stylesheet.sheet
      stylesheet.deleteRule(stylesheet.cssRules.length - 1)
    }

    monaco.editor.setModelLanguage(editor.getModel(), 'yaml')

    editor.changeViewZones(changeAccessor => {
      const domNode = document.createElement('div')
      changeAccessor.addZone({
        afterLineNumber: 0,
        heightInPx: 10,
        domNode: domNode
      })
    })
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.yaml !== nextProps.yaml || this.props.hide !== nextProps.hide
    )
  }

  componentDidUpdate() {
    // stop flickering
    const model = this.editor.getModel()
    model.forceTokenization(model.getLineCount())
  }

  render() {
    const { yaml, onYamlChange, hide = false } = this.props
    return (
      <div
        className="yamlEditorContainer"
        style={{ display: hide ? 'none' : 'block', minHeight: '100px' }}
      >
        <MonacoEditorEx
          language="yaml"
          theme="console"
          height={'100%'}
          width={'100%'}
          value={yaml}
          options={{
            readOnly: false,
            wordWrap: 'wordWrapColumn',
            wordWrapColumn: 132,
            wordWrapMinified: false,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            glyphMargin: true,
            tabSize: 2,
            scrollbar: {
              verticalScrollbarSize: 17,
              horizontalScrollbarSize: 17
            }
          }}
          editorDidMount={this.editorDidMount.bind(this)}
          editorWillMount={this.editorWillMount.bind(this)}
          onChange={onYamlChange}
        />
      </div>
    )
  }
}

YamlEditor.propTypes = {
  hide: PropTypes.bool,
  onYamlChange: PropTypes.func,
  setEditor: PropTypes.func,
  yaml: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
}

export default YamlEditor

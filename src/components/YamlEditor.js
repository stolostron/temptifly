'use strict'

import React from 'react'
import PropTypes from 'prop-types'

class YamlEditor extends React.Component {

  constructor(props) {
    super(props)

    const { editor, onYamlChange } = this.props
    this.state = {
      editor: editor && React.cloneElement(editor, {
        language: 'yaml',
        theme: 'console',
        height: '100%',
        width: '100%',
        options: {
          readOnly: false,
          wordWrap: 'wordWrapColumn',
          wordWrapColumn: 132,
          wordWrapMinified: false,
          scrollBeyondLastLine: true,
          smoothScrolling: true,
          glyphMargin: true,
          tabSize: 2,
          scrollbar: {
            verticalScrollbarSize: 17,
            horizontalScrollbarSize: 17
          }
        },
        editorDidMount: this.editorDidMount.bind(this),
        editorWillMount: this.editorWillMount.bind(this),
        onChange: onYamlChange
      })
    }


  }

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
    const { yaml, hide = false } = this.props
    const { editor } = this.state
    return (
      <div
        className="yamlEditorContainer"
        style={{ display: hide ? 'none' : 'block', minHeight: '100px' }}
      >
        {editor && React.cloneElement(editor, {value: yaml})}
      </div>
    )
  }
}

YamlEditor.propTypes = {
  editor: PropTypes.element,
  hide: PropTypes.bool,
  onYamlChange: PropTypes.func,
  setEditor: PropTypes.func,
  yaml: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
}

export default YamlEditor

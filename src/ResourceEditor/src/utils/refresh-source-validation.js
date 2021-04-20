'use strict'

import { parseYAML } from './source-utils'

export function refreshSourceValidation(
  editors,
  templateYAML,
  otherYAMLTabs = [],
  validateForm,
  sourcePathMap
) {

  // get parse syntax errors
  let parsed = parseYAML(templateYAML)
  const templateObjectMap = { '<<main>>': parsed.parsed }
  const templateExceptionMap = {
    '<<main>>': {
      editor: editors[0],
      exceptions: attachEditorToExceptions(parsed.exceptions, editors, 0)
    }
  }
  otherYAMLTabs.forEach(({ id, templateYAML: yaml }, inx) => {
    const tabParsed = parseYAML(yaml)
    templateObjectMap[id] = tabParsed.parsed
    templateExceptionMap[id] = {
      editor: editors[inx + 1],
      exceptions: attachEditorToExceptions(tabParsed.exceptions, editors, inx + 1)
    }
  })

  let hasSyntaxExceptions = false
  Object.values(templateExceptionMap).forEach(({ exceptions: _exceptions }) => {
    if (_exceptions.length > 0) {
      hasSyntaxExceptions = true
    }
  })

  if (!hasSyntaxExceptions) {
    // add form validation
    validateForm(templateObjectMap, templateExceptionMap, sourcePathMap)
  }

  // show errors in editors
  refreshEditorErrors(editors, templateExceptionMap)

  return {parsed, templateObjectMap}
}


export function refreshEditorErrors(editors, templateExceptionMap) {
  let hasExceptions = false
  Object.values(templateExceptionMap).forEach(
    ({ editor, exceptions }, inx) => {
      setTimeout(() => {
        if (editor) {
          const decorationList = []
          exceptions.forEach(({ row = 1, text }) => {
            decorationList.push({
              range: new editor.monaco.Range(row, 0, row, 132),
              options: {
                isWholeLine: true,
                glyphMarginClassName: 'errorDecoration',
                glyphMarginHoverMessage: { value: text },
                minimap: { color: 'red', position: 1 }
              }
            })
          })
          exceptions.forEach(({ row = 1, column = 0 }) => {
            decorationList.push({
              range: new editor.monaco.Range(row, column - 6, row, column + 6),
              options: {
                className: 'squiggly-error'
              }
            })
          })
          editor.errorList = decorationList
          editor.decorations = editor.deltaDecorations(editor.decorations, [
            ...editor.errorList,
            ...(editor.changeList || [])
          ])
        }
      }, 0)
      if (exceptions.length > 0) {
        hasExceptions = true
        attachEditorToExceptions(exceptions, editors, inx)
      }
    }
  )
  return hasExceptions
}

const attachEditorToExceptions = (exceptions, editors, inx) => {
  return exceptions.map(exception => {
    exception.editor = editors[inx]
    exception.tabInx = inx
    return exception
  })
}

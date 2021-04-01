'use strict'

import jsYaml from 'js-yaml'
import YamlParser from './YamlParser'

import get from 'lodash/get'
import set from 'lodash/set'

export const logSyntaxErrors = (templateYAML, controlData, otherYAMLTabs, templateExceptionMap) => {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  // map errors
  let errors
  const errorMap = {}
  Object.values(templateExceptionMap).forEach(({ exceptions }) => {
    exceptions.forEach(({ row, text, tabInx, controlId }) => {
      errors = get(errorMap, `${row}`, [])
      errors.push({ text, tabInx, controlId })
      set(errorMap, `${row}`, errors)
    })
  })

  // log YAML with errors
  const yaml = []
  get(errorMap, '0', []).forEach(({text})=>{
    yaml.push(`!!!!!!!!!!!! ${text} !!!!!!!!!!!!`)
  })
  const lines = templateYAML.split('\n')
  lines.forEach((line, row)=>{
    yaml.push(`${row+1} ${line}`)
    get(errorMap, `${row+1}`, []).forEach(({text})=>{
      yaml.push(`********* ${text}`)
    })
  })
  /* eslint-disable no-console */
  console.groupCollapsed("YAML")
  console.debug(yaml.join('\n'))
  console.groupEnd();
}


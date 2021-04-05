'use strict'

import jsYaml from 'js-yaml'
import { generateTemplateData } from './refresh-source-from-templates'

import get from 'lodash/get'
import set from 'lodash/set'

export const logSourceErrors = (templateYAML, controlData, otherYAMLTabs, templateExceptionMap) => {
  if (process.env.NODE_ENV !== 'production') {
    /* eslint-disable no-console */


  //////////////////////////////// INPUT //////////////////////////////////////
  console.groupCollapsed("TEMPLATE INPUT")
  const replacements = []
  const controlMap = {}
  const templateData = generateTemplateData(
    controlData,
    replacements,
    controlMap
  )
  const input = jsYaml.safeDump(templateData, {
    noRefs: true,
    lineWidth: 200
  })
  console.info(input)
  console.groupEnd();

  //////////////////////////////// YAML //////////////////////////////////////
  console.groupCollapsed("YAML OUTPUT")

    const errors = []
    const tabIds = ['<<main>>']
    Object.values(templateExceptionMap).forEach(({ exceptions }) => {
      exceptions.forEach(({ row, text, tabInx, controlId }) => {
        const tabErrors = get(errors, `${tabInx}`, [])
        const rowErrors = get(tabErrors, `${row}`, [])
        rowErrors.push({ text, controlId })
        set(tabErrors, `${row}`, rowErrors)
        set(errors, `${tabInx}`, tabErrors)
      })
    })
    const yamls=[templateYAML]
    otherYAMLTabs.forEach(({id, templateYAML:yaml})=>{
      tabIds.push(id)
      yamls.push(yaml)
    })

    // errors at top
    errors.forEach((tabErrors, tabInx)=>{
      tabErrors.forEach((rowErrors, rowInx)=>{
        rowErrors.forEach(({text})=>{
          console.info(`!!!!!!!!!!!! ${tabInx ? tabIds[tabInx] : ''} ${rowInx+1}: ${text} !!!!!!!!!!!!`)
        })
      })
    })
    // log YAML with errors
    yamls.forEach((yaml, tabInx) => {
      if (tabInx!==0) {
        console.info(`\n//////////////////////// ${tabIds[tabInx]} ///////////////`)
        const tabErrors = get(errors, `${tabInx}`, [])
        tabErrors.forEach((rowErrors, rowInx)=>{
          rowErrors.forEach(({text})=>{
            console.info(`!!!!!!!!!!!! ${rowInx+1}: ${text} !!!!!!!!!!!!`)
          })
        })
      }
      const output = []
      const tabErrors = errors[tabInx] || []
      const lines = yaml.split('\n')
      lines.forEach((line, row)=>{
        output.push(`${row+1} ${line}`)
        const rowErrors = tabErrors[row+1] || []
        rowErrors.forEach(({text})=>{
          output.push(`********* ${text}`)
        })
      })
      console.info(output.join('\n'))
    })
    console.groupEnd();
  }
}


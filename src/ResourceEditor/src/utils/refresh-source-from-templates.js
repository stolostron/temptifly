'use strict'

import { parseYAML } from './source-utils'
import { Base64 } from 'js-base64'
import { helpers } from '../helpers'

export const generateSourceFromTemplate = (
  template,
  {templateData, snippetMap, additionalTabInfo},
  otherYAMLTabs
) => {

  /////////////////////////////////////////////////////////
  // if there are multiple tabs, update the yaml that belongs on each
  /////////////////////////////////////////////////////////
  // if tab(s) were created to show encoded YAML, update that tab's info
  if (otherYAMLTabs) {
    additionalTabInfo.forEach(({ id, control, templateYAML, encode, newTab, snippetKey }) => {
      templateYAML = replaceSnippetMap(templateYAML, snippetMap)
      if (encode) {
        snippetMap[snippetKey] = Base64.encode(
          templateYAML.replace(/\s*##.+$/gm, '')
        )
      }
      if (newTab) {
        const existingInx = otherYAMLTabs.findIndex(
          ({ id: existingId }) => existingId === id
        )
        if (existingInx !== -1) {
          const existingTab = otherYAMLTabs[existingInx]
          existingTab.oldTemplateYAML = existingTab.templateYAML
          existingTab.templateYAML = templateYAML
        } else {
          otherYAMLTabs.push({
            id,
            control,
            templateYAML
          })
        }
      }
    })
  }

  /////////////////////////////////////////////////////////
  // generate the yaml!!
  // make sure the code snippets align with the yaml around it
  /////////////////////////////////////////////////////////
  let yaml = template(templateData, helpers) || ''
  yaml = replaceSnippetMap(yaml, snippetMap)

  // need to connect changes in source with the active value in the control
  // 1. by adding a reverse path to the control definition --or--
  // 2. by adding a ## controlId to the end of the template line with the value
  //////////////////////yaml = setSourcePaths(yaml, otherYAMLTabs, controlData)

  // if show secrets is off, create the templateObject with secrets
  const parsed = parseYAML(yaml)
  let templateObject = parsed.parsed
  if (yaml) {
    let yamlWithSecrets = template({...templateData, ...{showSecrets:true}}, helpers) || ''
    yamlWithSecrets = replaceSnippetMap(yamlWithSecrets, snippetMap)
    templateObject = parseYAML(yamlWithSecrets).parsed
  }

  return {
    templateYAML: yaml,
    templateObject,
    templateResources: parsed.resources,
    syntaxErrors: parsed.exceptions,
    otherYAMLTabs
  }

}

const replaceSnippetMap = (yaml, snippetMap) => {
  // find indent of key and indent the whole snippet
  Object.entries(snippetMap).forEach(([key, replace]) => {
    let replaced = false
    const regex = new RegExp(`^\\s*${key}`, 'gm')
    yaml = yaml.replace(regex, str => {
      replaced = true
      const inx = str.indexOf(key)
      const indent = inx !== -1 ? str.substring(0, inx) : '    '
      return indent + replace.replace(/\n/g, '\n' + indent)
    })
    // if not replaced, may be an in-line replacement--no need to worry about indent
    if (!replaced) {
      yaml = yaml.replace(key, replace)
    }
  })
  yaml = yaml.replace(/^\s*$(?:\r\n?|\n)/gm, '')
  if (!yaml.endsWith('\n')) {
    yaml += '\n'
  }
  return yaml
}

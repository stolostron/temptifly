'use strict'

import { parseYAML } from './source-utils'
import { Base64 } from 'js-base64'
import _ from 'lodash'

export const generateSourceFromTemplate = (
  template,
  controlData,
  otherYAMLTabs
) => {
  /////////////////////////////////////////////////////////
  // generate a map of id:values that can be passed to the handlerbars template
  /////////////////////////////////////////////////////////
  const replacements = []
  const controlMap = {}
  const templateData = generateTemplateData(
    controlData,
    replacements,
    controlMap
  )

  /////////////////////////////////////////////////////////
  // add replacements to templateData
  /////////////////////////////////////////////////////////
  // replacements are snippets of code instead of single values
  // ex: when you select a card, it inserts a snippet of code into
  //     the template instead of a text value
  const { snippetMap, tabInfo } = addCodeSnippetsTemplateData(
    templateData,
    replacements,
    controlMap
  )

  /////////////////////////////////////////////////////////
  // if there are multiple tabs, update the yaml that belongs on each
  /////////////////////////////////////////////////////////
  // if tab(s) were created to show encoded YAML, update that tab's info
  if (otherYAMLTabs) {
    tabInfo.forEach(({ id, control, templateYAML, encode, snippetKey }) => {
      templateYAML = replaceSnippetMap(templateYAML, snippetMap)
      if (encode) {
        snippetMap[snippetKey] = Base64.encode(
          templateYAML.replace(/\s*##.+$/gm, '')
        )
      }
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
    })
  }

  /////////////////////////////////////////////////////////
  // generate the yaml!!
  // make sure the code snippets align with the yaml around it
  /////////////////////////////////////////////////////////
  let yaml = template(templateData) || ''
  yaml = replaceSnippetMap(yaml, snippetMap)

  const parsed = parseYAML(yaml)
  return {
    templateYAML: yaml,
    templateObject: parsed.parsed,
    templateResources: parsed.resources
  }
}

const generateTemplateData = (
  controlData,
  replacements,
  controlMap
) => {
  //convert controlData active into templateData
  //do replacements second in case it depends on previous templateData
  let templateData = {}
  const getTemplateData = control => {
    const {
      getActive,
      userMap,
      id,
      type,
      multiselect,
      singleline,
      multiline,
      hasKeyLabels,
      hasValueDescription,
      hasReplacements,
      encode,
      template: _template
    } = control
    let { availableMap } = control
    availableMap = { ...userMap, ...availableMap }
    controlMap[id] = control
    let ret = undefined

    // if there's a get active function that gets active from other control data, get active value
    let { active } = control
    if (typeof getActive === 'function') {
      active = getActive(control, controlData)
    }

    if (active !== undefined) {
      if (hasKeyLabels) {
        const map = {}
        active.forEach(pair => {
          const { key, value } = availableMap[pair]
          let arr = map[key]
          if (!arr) {
            arr = map[key] = []
          }
          arr.push(value)
        })
        ret = map
      } else if (hasValueDescription) {
        ret = availableMap[active] || active
      } else if (type === 'group') {
        ret = active.map(group => {
          const map = {}
          group.forEach(gcontrol => {
            const gvalue = getTemplateData(gcontrol)
            if (gvalue) {
              map[gcontrol.id] = gvalue
            }
          })
          return map
        })
      } else if (encode) {
        ret = Base64.encode(active)
      } else if (singleline) {
        ret = active.replace(/\n/g, '')
      } else if (multiline) {
        let lines = active.trim().split(/[\r\n]+/g)
        const max = 64
        if (lines.length === 1 && lines[0].length > max) {
          const lline = lines[0]
          const numChunks = Math.ceil(lline.length / max)
          lines = Array.from({ length: numChunks })
          for (let i = 0, o = 0; i < numChunks; ++i, o += max) {
            lines[i] = lline.substr(o, max)
          }
        }
        ret = lines
      } else if (
        !multiselect &&
        type !== 'table' &&
        type !== 'labels' &&
        Array.isArray(active)
      ) {
        ret = active[0]
      } else if (_template) {
        // ex: when a text input is part of a url
        ret = _template.replace(`{{{${id}}}}`, active)
      } else {
        ret = active
      }
      if (hasReplacements) {
        replacements.push(control)
      }
    }
    return ret
  }
  controlData.forEach(control => {
    const value = getTemplateData(control)
    if (value !== undefined) {
      templateData[control.id] = value
      const { type, onlyOne } = control
      if (type === 'group' && onlyOne) {
        templateData = { ...templateData, ...value[0] }
      }
    }
  })
  return templateData
}

const addCodeSnippetsTemplateData = (
  templateData,
  replacements,
  controlMap
) => {
  // if replacement updates a hidden control that user can't change
  // reset that control's active state and let replacement fill from scratch
  replacements.forEach(control => {
    const { availableMap } = control
    const controlReplacements = _.get(
      Object.values(availableMap),
      '[0].replacements'
    )
    if (controlReplacements) {
      Object.keys(controlReplacements).forEach(id => {
        const ctrl = controlMap[id]
        if (ctrl && ctrl.type === 'hidden') {
          delete controlMap[id].wasSet
          delete templateData[id]
        }
      })
    }
  })

  // sort the controls with handlerbars to bottom in case they need values
  // from other replacements to do the replacements
  // iow: a snippet might itself be a handlerbars template that needs
  //      templateData to resolve it
  replacements.sort((a, b) => {
    if (a.noHandlebarReplacements && !b.noHandlebarReplacements) {
      return -1
    } else if (!a.noHandlebarReplacements && b.noHandlebarReplacements) {
      return 1
    }
    return 0
  })

  //add replacements
  const snippetMap = {}
  const tabInfo = []
  replacements.forEach(control => {
    const {
      id,
      active,
      availableMap,
      hasCapturedUserSource,
      customYAML,
      userData
    } = control
    templateData[`has${_.capitalize(id)}`] = active.length > 0
    if (typeof active !== 'function' && active.length > 0) {
      if (hasCapturedUserSource) {
        // restore snippet that user edited
        templateData[`${id}Capture`] = userData
      } else {
        // add predefined snippets
        const choices = Array.isArray(active) ? active : [active]
        choices.forEach((key, idx) => {
          const { replacements: _replacements } = availableMap[key]
          Object.entries(_replacements).forEach(([_id, partial]) => {
            const { template: _template, encode } = partial
            partial = _template || partial
            const typeOf = typeof partial
            if (typeOf === 'string' || typeOf === 'function') {
              let snippet =
                typeOf === 'string' ? partial : partial(templateData)
              snippet = snippet.trim().replace(/^\s*$(?:\r\n?|\n)/gm, '')
              let arr = templateData[_id]
              if (!arr) {
                arr = templateData[_id] = []
              }

              // need to make sure yaml indents line up
              // see below for more
              if (new RegExp(/[\r\n]/).test(snippet)) {
                const snippetKey = `____${_id}-${idx}____`
                if (encode) {
                  snippet = customYAML || snippet
                  tabInfo.push({
                    control,
                    templateYAML: snippet,
                    snippetKey,
                    encode,
                    id: _id
                  })
                }
                snippetMap[snippetKey] = snippet
                if (Array.isArray(arr)) {
                  arr.push(snippetKey)
                }
              } else if (
                Array.isArray(arr) &&
                !arr.includes(snippet) &&
                controlMap[_id]
              ) {
                let wasSet = controlMap[_id].wasSet
                if (!wasSet) {
                  wasSet = controlMap[_id].wasSet = new Set()
                }
                // if this control has already been set by this selection
                // don't do it again in case user unselected it
                if (arr && !wasSet.has(key)) {
                  arr.push(snippet)
                  controlMap[_id].active = arr
                  wasSet.add(key)
                }
              } else {
                if (!Array.isArray(arr)) {
                  arr = []
                }
                arr.push(snippet)
              }
            } else if (Array.isArray(partial)) {
              templateData[_id] = partial
            }
          })
        })
      }
    } else {
      // user reset selection, remove its keys from wasSet
      Object.values(controlMap).forEach(({ wasSet }) => {
        if (wasSet) {
          Object.keys(availableMap).forEach(key => {
            wasSet.delete(key)
          })
        }
      })
      delete control.hasCapturedUserSource
      delete control.userData
    }
  })

  return { snippetMap, tabInfo }
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

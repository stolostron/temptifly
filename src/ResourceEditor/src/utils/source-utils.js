'use strict'

import jsYaml from 'js-yaml'
import YamlParser from './YamlParser'
import { generateSourceFromStack } from './refresh-source-from-stack'
import { generateSourceFromTemplate } from './refresh-source-from-templates'
import capitalize from 'lodash/capitalize'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'
import set from 'lodash/set'
import memoize from "memoize-one"

export const generateSource = memoize((template, templateInput, editStack, otherYAMLTabs) => {
  if (!isEmpty(editStack)) {
    return generateSourceFromStack(
      template,
      templateInput,
      editStack,
      otherYAMLTabs
    )
  } else {
    return generateSourceFromTemplate(template, templateInput, otherYAMLTabs)
  }
}, (newArgs, lastArgs)=>{
  return isEqual(newArgs[1], lastArgs[1])
})

export const parseYAML = yaml => {
  let absLine = 0
  const parsed = {}
  const resources = []
  const exceptions = []
  const yamls = yaml.split(/^---$/gm)
  // check for syntax errors
  try {
    yamls.forEach(snip => {
      const obj = jsYaml.safeLoad(snip)
      const key = get(obj, 'kind', 'unknown')
      let values = parsed[key]
      if (!values) {
        values = parsed[key] = []
      }
      const post = new RegExp(/[\r\n]+$/).test(snip)
      snip = snip.trim()
      const $synced = new YamlParser().parse(snip, absLine)
      $synced.$r = absLine
      $synced.$l = snip.split(/[\r\n]+/g).length
      values.push({ $raw: obj, $yml: snip, $synced })
      resources.push(obj)
      absLine += $synced.$l
      if (post) {
        absLine++
      }
    })
  } catch (e) {
    const { mark = {}, reason, message } = e
    const { line = 0, column = 0 } = mark
    exceptions.push({
      row: line + absLine,
      column,
      text: capitalize(reason || message),
      type: 'error'
    })
  }
  return { parsed, resources, exceptions }
}

export const getInsideObject = (ikey, parsed) => {
  const ret = {}
  Object.keys(parsed).forEach(key => {
    ret[key] = []
    get(parsed, `${key}`, []).forEach(obj => {
      ret[key].push(get(obj, `${ikey}`))
    })
  })
  return ret
}

export const getResourceID = resource => {
  return (
    get(resource, 'metadata.selfLink') ||
    (
      `/namespaces/${get(resource, 'metadata.namespace', 'none') || ''}/` +
      `${resource.kind}s/${get(resource, 'metadata.name') || ''}`
    ).toLowerCase()
  )
}

export const getUniqueName = (name, nameSet) => {
  if (nameSet.has(name)) {
    let count = 1
    const baseName = name.replace(/-*\d+$/, '')
    do {
      name = `${baseName}-${count}`
      count++
    } while (nameSet.has(name))
  }
  return name
}

// convert this: PlacementRule[0].spec.clusterConditions[0].type
// to this:      PlacementRule[0].$synced.spec.$v.clusterConditions.$v[0].$v.type.$v
export const getSourcePath = path => {
  let sourcePath = path.split(/\.(?=(?:[^"]*"[^"]*")*[^"]*$)/)
  const pathBase = sourcePath.shift() + '.$synced'
  sourcePath = sourcePath.map(seg => {
    return seg.replace('[', '.$v[')
  })
  sourcePath =
    sourcePath.length > 0 ? pathBase + `.${sourcePath.join('.$v.')}` : pathBase
  return sourcePath
}

//looks for ## at end of a YAML line
export function getSourcePathMap(yaml, otherYAMLTabs = [], sourcePathMap) {
  const { parsed } = parseYAML(yaml)
  otherYAMLTabs.forEach(tab => {
    const { id: tabId, templateYAML } = tab
    const { parsed: tabParsed } = parseYAML(templateYAML)
    syncSourcePathMap(tabParsed, tabId, sourcePathMap)
    tab.templateYAML = templateYAML.replace(/\s*##.+$/gm, '') // remove source markers
  })
  syncSourcePathMap(parsed, '<<main>>', sourcePathMap)
  return yaml.replace(/\s*##.+$/gm, '') // remove source markers
}

//point control to what template value it changes
//looks for ##controlId in template
const syncSourcePathMap = (parsed, tabId, sourcePathMap) => {
  Object.entries(parsed).forEach(([key, value]) => {
    value.forEach(({ $synced }, inx) => {
      syncPathMap($synced, `${key}[${inx}].$synced`, tabId, sourcePathMap)
    })
  })
}

const syncPathMap = (object, path, tabId, sourcePathMap) => {
  if (object) {
    if (object.$cmt) {
      // comment links in groups/tables have the format ##groupId.inx.controlId
      // ties into controlMap created above
      const [sourceKey, inx, dataKey] = object.$cmt.split('.')
      let entry = get(sourcePathMap, sourceKey, {})
      if (inx) {
        const paths = get(entry, 'paths', [])
        let pathMap = paths[inx]
        if (!pathMap) {
          pathMap = paths[inx] = {}
        }
        pathMap[dataKey] = path
        entry = { tabId, paths }
      } else {
        entry = { tabId, path }
      }
      set(sourcePathMap, sourceKey, entry)
    }
    let o, p
    object = object.$v !== undefined ? object.$v : object
    if (Array.isArray(object)) {
      for (let i = 0; i < object.length; i++) {
        o = object[i]
        if (o.$v !== undefined) {
          p = `${path}[${i}].$v`
          syncPathMap(o, p, tabId, sourcePathMap)
        }
      }
    } else if (object && typeof object === 'object') {
      Object.keys(object).forEach(key => {
        o = object[key]
        if (o.$v !== undefined) {
          if (key.includes('.')) {
            p = `${path}['${key}'].$v`
          } else {
            p = `${path}.${key}.$v`
          }
          syncPathMap(o, p, tabId, sourcePathMap)
        }
      })
    }
  }
}

export const removeVs = object => {
  if (object) {
    let o
    object = object.$v !== undefined ? object.$v : object
    if (Array.isArray(object)) {
      for (let i = 0; i < object.length; i++) {
        o = object[i]
        object[i] = o.$v !== undefined ? removeVs(o) : o
      }
    } else if (!!object && typeof object === 'object') {
      Object.entries(object).forEach(([k, oo]) => {
        object[k] = oo.$v !== undefined ? removeVs(oo) : oo
      })
    }
  }
  return object
}

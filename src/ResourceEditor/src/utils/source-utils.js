'use strict'

import jsYaml from 'js-yaml'
import YamlParser from './YamlParser'
import { generateSourceFromStack } from './refresh-source-from-stack'
import { generateSourceFromTemplate } from './refresh-source-from-templates'
import cloneDeep from 'lodash/cloneDeep'
import capitalize from 'lodash/capitalize'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'
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

//don't save user data until they create
export const cacheUserData = controlData => {
  controlData.forEach(control => {
    if (
      control.cacheUserValueKey &&
      control.userData &&
      control.userData.length > 0
    ) {
      const storageKey = `${control.cacheUserValueKey}--${
        window.location.href
      }`
      sessionStorage.setItem(storageKey, JSON.stringify(control.userData))
    }
  })
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

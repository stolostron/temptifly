'use strict'

import { parseYAML, getSourcePath, removeVs } from './source-utils'
import _ from 'lodash'

///////////////////////////////////////////////////////////////////////////////
//intialize controls and groups
///////////////////////////////////////////////////////////////////////////////
export const initializeControlFunctions = (controlData, editor) => {
  controlData.forEach(control => {
    const { type, active = [] } = control
    switch (type) {
    case 'group': {
      active.forEach(cd => {
        initializeControlFunctions(cd, editor)
      })
      break
    }
    default:
      initialControl(control, editor)
    }
  })
}

///////////////////////////////////////////////////////////////////////////////
//initialze each control
///////////////////////////////////////////////////////////////////////////////
const initialControl = (control, editor) => {
  const { type, setActive, reverse } = control

  // use the latest controlData in editor
  const handler = {
    get: (obj, prop) => {
      const target = editor.currentData()
      let ret = Reflect.get(target, prop)
      if (typeof ret === 'function') {
        ret = ret.bind(target)
      }
      return ret
    }
  }
  const lastestData = new Proxy({}, handler)

  if (type !== 'title' && type !== 'section' && !setActive) {
    if (typeof control.onSelect === 'function') {
      control.onSelect = control.onSelect.bind(
        null,
        control,
        lastestData,
        (ctrl, isLoading) => {
          if (isLoading) {
            ctrl.isLoading = isLoading
            editor.forceUpdate()
          } else {
            setTimeout(() => {
              ctrl.isLoading = isLoading
              editor.forceUpdate()
            })
          }
        }
      )
    }

    if (typeof control.isHidden === 'function') {
      control.isHidden = control.isHidden.bind(null, control, lastestData)
    }

    if (typeof control.summarize === 'function') {
      control.summarize = control.summarize.bind(null, control, lastestData)
    }

    control.forceUpdate = () => {
      editor.forceUpdate()
    }

    control.setActive = value => {
      control.active = value
      if (typeof control.onSelect === 'function') {
        control.onSelect()
      }
      editor.forceUpdate()
    }

    const setActiveVal = (ctrl, path, templateObject) => {
      let sourcePath
      if (path) {
        sourcePath = getSourcePath(path)
      } else if (ctrl.sourcePaths) {
        sourcePath = ctrl.sourcePaths.path
        if (typeof sourcePath === 'string' && sourcePath.endsWith('.$v')) {
          sourcePath = sourcePath.substring(0, sourcePath.length-3)
        }
      }
      if (sourcePath) {
        let active = _.get(templateObject, sourcePath)
        switch (ctrl.type) {
        case 'checkbox':
          if (!active) {
            active = { $v: false }
          } else if (active.$v === undefined) {
            active = { $v: !!active }
          } else {
            active.$v = !!active.$v
          }
          break

        default:
          break
        }
        if (active) {
          ctrl.active = removeVs(active.$v)
          ctrl.sourcePath = active
        }
      }
    }
    if (reverse) {
      switch (true) { // match any case that is true
      case typeof reverse === 'string':
        control.reverse = (ctrl, templateObject) => {
          setActiveVal(ctrl, reverse, templateObject)
        }
        break

      case Array.isArray(reverse):
        control.reverse = (ctrl, templateObject) => {
          reverse.forEach(path => {
            setActiveVal(ctrl, path, templateObject)
          })
        }
        break
      }
    } else {
      control.reverse = (ctrl, templateObject) => {
        setActiveVal(ctrl, null, templateObject)
      }
    }
  }
}

//looks for ## at end of a YAML line
export function setSourcePaths(yaml, otherYAMLTabs = [], controlData) {
  const { parsed } = parseYAML(yaml)
  const controlMap = {}
  controlData.forEach(control => {
    const { id, type, active = [] } = control
    controlMap[id] = control

    switch (type) {
    case 'group':
      // each group gets an array of control data maps, one per group
      control.controlMapArr = []
      active.forEach(cd => {
        const cdm = {}
        control.controlMapArr.push(cdm)
        cd.forEach(c => {
          cdm[c.id] = c
        })
      })
      break

    case 'table':
      // each table cell has its own source path
      control.sourcePaths = { paths: [] }
      break
    }
  })

  otherYAMLTabs.forEach(tab => {
    const { id: tabId, templateYAML } = tab
    const { parsed: tabParsed } = parseYAML(templateYAML)
    syncControlData(tabParsed, controlData, controlMap, tabId)
    tab.templateYAML = templateYAML.replace(/\s*##.+$/gm, '') // remove source markers
  })
  syncControlData(parsed, controlData, controlMap, '<<main>>')
  return yaml.replace(/\s*##.+$/gm, '') // remove source markers
}

//point control to what template value it changes
//looks for ##controlId in template
const syncControlData = (parsed, controlData, controlMap, tabId) => {
  Object.entries(parsed).forEach(([key, value]) => {
    value.forEach(({ $synced }, inx) => {
      syncControls($synced, `${key}[${inx}].$synced`, controlMap, tabId)
    })
  })
}

const syncControls = (object, path, controlMap, tabId) => {
  if (object) {
    if (object.$cmt) {
      // comment links in groups/tables have the format ##groupId.inx.controlId
      // ties into controlMap created above
      const [controlKey, inx, dataKey] = object.$cmt.split('.')
      let control = controlMap[controlKey]
      if (control) {
        const { type, controlMapArr } = control
        if (type !== 'table') {
          if (inx) {
            const cdm = controlMapArr[inx]
            if (cdm) {
              control = cdm[dataKey]
            }
          }
          control.sourcePaths = { tabId, path }
        } else if (inx) {
          control.sourcePaths.tabId = tabId
          let pathMap = control.sourcePaths.paths[inx]
          if (!pathMap) {
            pathMap = control.sourcePaths.paths[inx] = {}
          }
          pathMap[dataKey] = path
        }
      }
    }
    let o, p
    object = object.$v !== undefined ? object.$v : object
    if (Array.isArray(object)) {
      for (let i = 0; i < object.length; i++) {
        o = object[i]
        if (o.$v !== undefined) {
          p = `${path}[${i}].$v`
          syncControls(o, p, controlMap, tabId)
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
          syncControls(o, p, controlMap, tabId)
        }
      })
    }
  }
}

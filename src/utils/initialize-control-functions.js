'use strict'

import { parseYAML, getSourcePath, removeVs } from '../ResourceEditor/src/utils/source-utils'
import get from 'lodash/get'

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

    if (typeof control.hidden === 'function') {
      control.hidden = control.hidden.bind(null, control, lastestData)
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

    const setActiveVal = (ctrl, path, templateObject, sourcePathMap) => {
      let sourcePath

      // the control has a reverse path specifies where the value is in templateObject
      if (path) {
        sourcePath = getSourcePath(path)
      } else if (sourcePathMap && sourcePathMap[ctrl.id]) {
      
      // the template file has a ## comment that specifies where the value is in templateObject
        sourcePath = sourcePathMap[ctrl.id].path
        if (typeof sourcePath === 'string' && sourcePath.endsWith('.$v')) {
          sourcePath = sourcePath.substring(0, sourcePath.length-3)
        }
      }
      if (sourcePath) {
        let active = get(templateObject, sourcePath)
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
      control.reverse = (ctrl, templateObject, sourcePathMap) => {
        setActiveVal(ctrl, null, templateObject, sourcePathMap)
      }
    }
  }
}

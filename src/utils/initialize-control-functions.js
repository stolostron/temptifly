'use strict'

import { getSourcePath } from './utils'
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

    control.setActive = value => {
      control.active = value
      if (typeof control.onSelect === 'function') {
        control.onSelect()
        editor.forceUpdate()
      }
    }

    if (reverse) {
      const setActiveVal = (ctrl, path, templateObject) => {
        let active = _.get(templateObject, getSourcePath(path))
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
          ctrl.active = active.$v
          ctrl.sourcePath = active
        }
      }
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
    }
  }
}

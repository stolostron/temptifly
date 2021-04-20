'use strict'

import { initializeControlData } from './initialize-control-data'
import { initializeControlFunctions } from './initialize-control-functions'
import cloneDeep from 'lodash/cloneDeep'

export const ControlMode = Object.freeze({
  TABLE_ONLY: 'TABLE_ONLY',
  PROMPT_ONLY: 'PROMPT_ONLY'
})

export const initializeControls = (
  initialControlData,
  editor,
  i18n,
  uniqueGroupID,
  inGroup
) => {
  const controlData = initializeControlData(
    initialControlData,
    i18n,
    uniqueGroupID,
    inGroup
  )
  initializeControlFunctions(controlData, editor)
  return controlData
}

// from an edit resource, discover # of groups, card selections
export function discoverControls(controlData, templateObject, editor, i18n) {
  templateObject = cloneDeep(templateObject)
  const discoverControl = control => {
    const { discover } = control
    if (discover) {
      discover(control, controlData, templateObject, editor, i18n)
    }
  }
  controlData.forEach(control => {
    discoverControl(control, i18n)
  })
}

//reverse control active values from template
export function reverseTemplate(controlData, templateObject, sourcePathMap) {
  templateObject = cloneDeep(templateObject)
  const reverseControl = control => {
    const { type, active = [], reverse, shift } = control
    if (type === 'group') {
      active.forEach(group => {
        group.forEach(gcontrol => {
          reverseControl(gcontrol)
        })
        if (typeof shift === 'function') {
          shift(templateObject)
        }
      })
    } else if (typeof reverse === 'function') {
      reverse(control, templateObject, sourcePathMap)
    }
  }
  controlData.forEach(control => {
    reverseControl(control)
  })
}

// reverse control active valuess from template
export function setEditingMode(controlData) {
  const setEditMode = control => {
    const { type, active, hidden:isHidden, editing } = control
    if (type === 'group') {
      active.forEach(group => {
        group.forEach(gcontrol => {
          setEditMode(gcontrol)
        })
      })
    } else if (editing) {
      const { hidden, disabled, collapsed, editMode } = editing
      // if editing existing app, hide this field initially
      if (hidden) {
        if (isHidden) {
          control.hidden = true
        } else {
          control.type = 'hidden'
        }
      }
      // if editing existing app, disable this field
      if (disabled) {
        control.disabled = true
      }
      // if editing existing app, disable this field
      if (collapsed) {
        control.collapsed = true
      }
      // if editing existing app, set editMode
      if (editMode) {
        control.editMode = true
      }
    }
  }
  controlData.forEach(control => {
    setEditMode(control)
  })
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


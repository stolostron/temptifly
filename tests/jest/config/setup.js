'use strict'

import 'cross-fetch/polyfill'
require('jest-canvas-mock')

document.queryCommandSupported = () => {
  return true
}

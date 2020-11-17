'use strict'

import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import 'cross-fetch/polyfill'
require('jest-canvas-mock')

configure({ adapter: new Adapter() })

document.queryCommandSupported = () => {
  return true
}

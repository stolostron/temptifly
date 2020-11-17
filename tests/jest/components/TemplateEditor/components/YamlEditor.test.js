'use strict'

import React from 'react'
import YamlEditor from '../../../../../src/components/YamlEditor'
import renderer from 'react-test-renderer'

describe('YamlEditor', () => {
  it('renders as expected 1', () => {
    const props = {
      height: '41vh',
      onYamlChange() {},
      readOnly: true,
      setEditor() {},
      width: '50vw',
      yaml: 'yaml sample'
    }
    const component = renderer.create(<YamlEditor {...props} />)
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('renders as expected 2', () => {
    const props = {}
    const component = renderer.create(<YamlEditor {...props} />)
    expect(component.toJSON()).toMatchSnapshot()
  })
})

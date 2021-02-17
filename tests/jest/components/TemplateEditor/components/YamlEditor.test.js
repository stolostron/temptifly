'use strict'

import React from 'react'
import YamlEditor from '../../../../../src/components/YamlEditor'
import { render } from '@testing-library/react'

describe('YamlEditor', () => {
  it('renders as expected', () => {
    const Component = () => {
      return (
        <YamlEditor
          height= '41vh'
          onYamlChange={()=>{}}
          readOnly={true}
          setEditor={()=>{}}
          width='50vw'
          yaml='yaml sample'
        />
      )
    }
    const { asFragment } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()
  })
})

'use strict'

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import TemplateEditor from '../../../../src/TemplateEditor'
import renderer from 'react-test-renderer'
import applicationTemplate from './template.hbs'
import { shallow , mount } from 'enzyme'


import { controlData, portals } from '../TestingData'

describe('TemplateEditor component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <BrowserRouter>
        <TemplateEditor
          template={applicationTemplate}
          controlData={controlData}
          portals={portals}
          type={'application'}
          title={'creation.app.yaml'}
          i18n={fn}
        />
      </BrowserRouter>
    )
    expect(component.toJSON()).toMatchSnapshot()
  })
})

describe('on control change function', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const wrapper = mount(
      <BrowserRouter>
        <TemplateEditor
          template={applicationTemplate}
          controlData={controlData}
          portals={portals}
          type={'application'}
          title={'creation.app.yaml'}
          i18n={fn}
        />
      </BrowserRouter>
    )
    const evt = {
      target: {
        value: 'value-testing'
      },
      selectedItems: ['selectedItems-testing-1', 'selectedItems-testing-2']
    }

    wrapper
      .find('#eman')
      .at(0)
      .simulate('change', evt)
    wrapper
      .find('#emanspace')
      .at(0)
      .simulate('change', evt)

    wrapper
      .find('#main-')
      .at(0)
      .simulate('click', evt)
  })
})

describe('getResourceJSON function', () => {
  const result = [
    {
      apiVersion: 'app.k8s.io/v1beta1',
      kind: 'Application',
      metadata: { name: null, namespace: null },
      spec: {
        componentKinds: [
          { group: 'apps.open-cluster-management.io', kind: 'Subscription' }
        ],
        descriptor: {},
        selector: {
          matchExpressions: [{ key: 'app', operator: 'In', values: [null] }]
        }
      }
    }
  ]

  it('renders as expected', () => {
    const fn = jest.fn()
    const wrapper = shallow(
      <BrowserRouter>
        <TemplateEditor
          template={applicationTemplate}
          controlData={controlData}
          portals={portals}
          type={'application'}
          title={'creation.app.yaml'}
          i18n={fn}
        />
      </BrowserRouter>
    )
    expect(wrapper.find('TemplateEditor').dive().instance().getResourceJSON()).toEqual(result)
  })
})

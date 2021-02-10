'use strict'

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import TemplateEditor from '../../../../src/TemplateEditor'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import template from '../../../../example/templates/template.hbs'
import controlData from '../../../../example/controlData/ControlData'

//window.MonacoEnvironment = {
//  getWorkerUrl: function() {
//    return `${config.contextPath}/editor.worker.js`
//  }
//}

export const portals = Object.freeze({
  cancelBtn: 'cancel-button-portal-id',
  createBtn: 'create-button-portal-id',
  editBtn: 'edit-button-portal-id'
})

const i18n = (key) => {
  return key
}

describe('TemplateEditor component',() => {
  it('renders as expected',  async () => {

    const createResource = async () => {
    }
    const createControl={
      createResource,
    }
    const Component = () => {
      return (
        <BrowserRouter>
          <TemplateEditor
            template={template}
            controlData={controlData}
            createControl={createControl}
            portals={portals}
            type={'application'}
            title={'creation.app.yaml'}
            i18n={i18n}
            initialOpen={true}
          />
        </BrowserRouter>
      )
    }

    const { getByTestId, asFragment, debug } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()

    userEvent.type(getByTestId('text-eman'), 'test')
    userEvent.click(getByTestId('card-cluster.create.baremetal.subtitle'))
    screen.debug(debug(), 2000000)

    await waitFor(() => expect(screen.getByTestId('combo-imageSet')).toBeInTheDocument())

    userEvent.type(getByTestId('combo-imageSet'), 'test')


    //    userEvent.type(getByTestId('textinput'), 'n')
    //    expect(control.active).toBe('n')
    //
    //    control.name = ''
    //    control.exception = 'error'
    //    rerender(<Component />)
    //    control.placeholder = 'placeholder'
    //    rerender(<Component />)
    //    expect(asFragment()).toMatchSnapshot()
  })
})



//describe('TemplateEditor component', () => {
//  it('renders as expected', () => {
//    const fn = jest.fn()
//    const component = renderer.create(
//      <BrowserRouter>
//        <TemplateEditor
//          template={applicationTemplate}
//          controlData={controlData}
//          portals={portals}
//          type={'application'}
//          title={'creation.app.yaml'}
//          i18n={fn}
//        />
//      </BrowserRouter>
//    )
//    expect(component.toJSON()).toMatchSnapshot()
//  })
//})
//
//describe('on control change function', () => {
//  it('renders as expected', () => {
//    const fn = jest.fn()
//    const wrapper = mount(
//      <BrowserRouter>
//        <TemplateEditor
//          template={applicationTemplate}
//          controlData={controlData}
//          portals={portals}
//          type={'application'}
//          title={'creation.app.yaml'}
//          i18n={fn}
//        />
//      </BrowserRouter>
//    )
//    const evt = {
//      target: {
//        value: 'value-testing'
//      },
//      selectedItems: ['selectedItems-testing-1', 'selectedItems-testing-2']
//    }
//
//    wrapper
//      .find('#eman')
//      .at(0)
//      .simulate('change', evt)
//    wrapper
//      .find('#emanspace')
//      .at(0)
//      .simulate('change', evt)
//
//    wrapper
//      .find('#main-')
//      .at(0)
//      .simulate('click', evt)
//  })
//})
//
//describe('getResourceJSON function', () => {
//  const result = [
//    {
//      apiVersion: 'app.k8s.io/v1beta1',
//      kind: 'Application',
//      metadata: { name: null, namespace: null },
//      spec: {
//        componentKinds: [
//          { group: 'apps.open-cluster-management.io', kind: 'Subscription' }
//        ],
//        descriptor: {},
//        selector: {
//          matchExpressions: [{ key: 'app', operator: 'In', values: [null] }]
//        }
//      }
//    }
//  ]
//
//  it('renders as expected', () => {
//    const fn = jest.fn()
//    const wrapper = shallow(
//      <BrowserRouter>
//        <TemplateEditor
//          template={applicationTemplate}
//          controlData={controlData}
//          portals={portals}
//          type={'application'}
//          title={'creation.app.yaml'}
//          i18n={fn}
//        />
//      </BrowserRouter>
//    )
//    expect(wrapper.find('TemplateEditor').dive().instance().getResourceJSON()).toEqual(result)
//  })
//})

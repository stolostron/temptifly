'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import capitalize from 'lodash/capitalize'
import { Alert } from '@patternfly/react-core'

class ControlPanelFinish extends React.Component {
  static propTypes = {
    comment: PropTypes.string,
    details: PropTypes.array,
    renderNotifications: PropTypes.func,
    startStep: PropTypes.number
  };

  constructor(props) {
    super(props)
  }

  render() {
    const { details, comment, renderNotifications } = this.props

    return (
      <React.Fragment>
        <div>
          {this.renderDetails(details)}
          {comment &&
            <Alert variant="warning" isInline title={comment} />
          }
          {renderNotifications()}
        </div>
      </React.Fragment>
    )
  }

  renderDetails(details) {
    let step = this.props.startStep+1
    return (
      <div className="tf--finish-details">
        {details.map(({title, sections})=>{
          if (title.type !== 'review') {
            return (
              <div key={step} className="tf--finish-step">
                <div className="tf--finish-step-title" >
                  <div className="tf--finish-step-circle">
                    {step++}
                  </div>
                  <div>{title.title}</div>
                </div>
                <div className="tf--finish-step-sections">
                  {this.renderSections(sections)}
                </div>
              </div>
            )
          } else {
            step++
            return null
          }
        })}
      </div>)
  }

  renderSections(sections) {
    const tables = []
    let id
    sections.forEach(section =>{
      section.content = section.content.filter(control=>{
        if (control.type==='table') {
          tables.push(control)
          return false
        }
        id = control.id
        return true
      })
    })
    return (
      <React.Fragment>
        {this.renderTables(tables)}
        {sections.map(({content})=> {
          return <div key={id} className="pf-c-description-list__group tf--finish-step-section">
            {this.renderContent(content)}
          </div>
        })}
      </React.Fragment>
    )
  }

  renderContent(controlData, divider) {
    return (
      <React.Fragment>
        {divider && '---'}
        {controlData.map(control => {
          const { type } = control
          switch (type) {
          case 'group':
            return this.renderGroup(control)
          case 'table':
            return this.renderTable(control)
          default:
            return this.renderControl(control)
          }
        })}
      </React.Fragment>
    )
  }

  renderGroup(control) {
    const { active = [] } = control
    return (
      <React.Fragment>
        {active.map((controlData) => {
          return this.renderContent(controlData, active.length>1)
        })}
      </React.Fragment>
    )
  }

  renderGroupControlSections(controlData, grpNum, grpId = '') {
    // create collapsable control sections
    let section
    let content = []
    let stopRendering = false
    let stopRenderingOnNextControl = false
    const controlSections = []
    controlData.forEach(control => {
      const { type, pauseControlCreationHereUntilSelected } = control
      stopRendering = stopRenderingOnNextControl
      if (pauseControlCreationHereUntilSelected) {
        stopRenderingOnNextControl = !control.active
      }
      if (!stopRendering) {
        if (type === 'section') {
          content = []
          section = { title: control, content }
          controlSections.push(section)
        } else {
          content.push(control)
        }
      }
    })
    return this.renderControlSections(controlSections, grpId)
  }

  renderTables(tables) {
    return (
      <div>
        {tables.map(table=>{
          const { active = [], controlData } = table
          const columns = controlData.filter(({mode})=>!mode)
          return (<div key ={table.id} className="tf--finish-step-table">
            {columns.map(({name}, inx)=>{
              return (
                <div key={name} style={{gridColumn: inx+1, fontWeight: 'bold'}}>{name}</div>
              )
            })}
            {active.map(row=> (
              columns.map(({id}, inx)=> (
                <div key={id} style={{gridColumn: inx+1}}>{row[id]}</div>
              ))
            ))}
          </div>)
        })}
      </div>
    )
  }

  renderControl(control) {
    const {type, active, availableMap, name, id, exception, validation, summary, hidden} = control
    let term
    let desc
    let summaries
    switch(type) {
    case 'text':
    case 'singleselect':
    case 'multiselect':
    case 'combobox':
    case 'treeselect':
      term = name
      desc = active
      break
    case 'number':
      term = name
      desc = active
      break
    case 'checkbox':
      term = name
      desc = active ? active.toString() : 'false'
      break
    case 'cards':
      term = capitalize(id)
      desc = typeof active === 'function' ? active() : active
      if (desc && availableMap) {
        desc = availableMap[desc].title
      }
      break
    case 'labels':
      term = name
      desc = active.map(({ key: k, value }) => {
        return `${k}=${value}`
      }).join(', ')
      break
    case 'values':
      term = name
      desc = active.join(', ')
      break
    case 'custom':
      if (typeof summary === 'function') {
        summaries = summary(control)
      }
      break
    }

    const isHidden = (!term && !summaries) || (typeof hidden === 'function' ? hidden() : hidden)
    if (!isHidden) {
      if (!summaries) {
        summaries=[{
          term,
          desc,
          exception,
          validation
        }]
      }
      return (
        <React.Fragment>
          {summaries.map(({term, desc, exception, validation})=>{
            let styles = {}
            if (exception) {
              desc = '*Fix exceptions'
              styles = {color: 'red'}
            } else if (typeof desc==='string' && desc.length>64) {
              desc = `${desc.substr(0, 32)}...${desc.substr(-32)}`
            } else if (!desc && validation && validation.required) {
              desc = '*Required'
              styles = {color: 'red'}
            }
            return (
              <React.Fragment key={desc}>
                <dt className="pf-c-description-list__term"><span className="pf-c-description-list__text">{term}</span></dt>
                <dd className="pf-c-description-list__description"><div className="pf-c-description-list__text" style={styles}>{desc||'-none-'}</div></dd>
              </React.Fragment>
            )
          })}
        </React.Fragment>
      )
    } else {
      return null
    }
  }

}

export default ControlPanelFinish

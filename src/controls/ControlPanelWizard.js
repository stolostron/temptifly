'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Button, Wizard, WizardFooter, WizardContextConsumer } from '@patternfly/react-core';
import ControlPanelFinish from './ControlPanelFinish'
import get from 'lodash/get'
import set from 'lodash/set'
import isEmpty from 'lodash/isEmpty'
import cloneDeep from 'lodash/cloneDeep'

class ControlPanelWizard extends React.Component {

  render() {
    const { controlClasses, setWizardRef, renderControlSections, renderNotifications } = this.props
    let { steps } = this.props
    const details = cloneDeep(steps)
    steps.forEach(step=>{
      step.controls = []
      step.sections.forEach(({content})=>{
        step.controls = step.controls.concat(content)
      })
    })

    // determine valid last step
    let validStepIndex
    steps.some(({title:control, controls=[]}, index)=>{
      const {isComplete, type='step'} = control
      switch (type) {
      case 'step':
        controls.some(({mustValidate})=>{
          if (mustValidate && !isComplete) {
            validStepIndex = index
            return true
          }
        })
        break
      case 'review':
        if (!isComplete) {
          validStepIndex = index
        }
        break
      }
      return validStepIndex
    })
    validStepIndex = validStepIndex || steps.length+1

    const renderReview = (details, comment) => {
      return (
        <ControlPanelFinish
          className={controlClasses}
          details={details}
          comment={comment}
          renderNotifications={renderNotifications.bind(this)}
        />
      )
    }

    let lastType
    steps = steps.map(({title:control, controls, sections}, inx)=>{
      const { id, type, title, comment, exception } = control
      lastType = type
      
      // put error ! on step with errors
      let hasErrors=exception
      controls.forEach(({exception})=>{
        if (exception) {
          hasErrors= true
        }
      })

      return {
        id,
        index: inx,
        name:<div className="tf--finish-step-button">
          {title}
          {hasErrors&&<div className="tf--finish-step-button-error">!</div>}
        </div>,
        control,
        controls,
        canJumpTo: inx <= validStepIndex,
        component: <div key={id} className={controlClasses}>
          <h2>{title}</h2>
          {control.type==='review'? renderReview(details.slice(0,inx), comment) : renderControlSections(sections)}
        </div>
      }
    })
    if (lastType!=='review') {
      steps.push({
        id: 'review',
        name: 'Review',
        control: {nextButtonLabel: 'Create'},
        component: <div className={controlClasses}>
          <h2>Review</h2>
          <ControlPanelFinish
            className={controlClasses}
            details={details}
            renderNotifications={renderNotifications.bind(this)}
          />
        </div>,
        canJumpTo: steps.length+1 <= validStepIndex,
      })
    }

    const onMove = (curr, prev) => {
      // if wizard is stopped, remember where it left off
      set(steps[0], 'control.startAtStep', curr.id)

      // custom step change actions
      if (this.props.onStepChange) {
        this.props.onStepChange(steps.find(({ id }) => id === curr.id), steps.find(({ id }) => id === prev.id))
      }
    }

    const onSave = () => {
      this.props.handleCreateResource()
    }

    const onClose = () => {
      this.props.handleCancelCreate()
    }

    const validateNextStep = (activeStep, onNext) => {
      const { type, mutation, disableEditorOnSuccess, disablePreviousControlsOnSuccess } = activeStep.control
      switch(type) {
        case 'step':
          const validateControls = activeStep.controls.filter(control=>control.validate)
          if (validateControls.length>0){
            let hasErrors = false
            const promises = (validateControls.map(control=>control.validate()))
            Promise.allSettled(promises).then((results) => {
              results.some((result) => {
                hasErrors=!isEmpty(result.value)
                return hasErrors
              })
              activeStep.control.exception = hasErrors
              if (!hasErrors) {
                activeStep.control.isComplete = true
                onNext()
              }
              this.forceUpdate()
            })
          } else {
            onNext()
          }
          break
        case 'review':
          if (mutation) {
              mutation(this.props.controlData).then((status)=>{
                if (status==='ERROR') {
                  if (disableEditorOnSuccess) {
                    this.props.setEditorReadOnly(true)
                  }
                  if (disablePreviousControlsOnSuccess) {
                    steps.slice(0, activeStep.index).reverse().forEach(step=>{
                      step.controls.forEach(control=>{
                        control.disabled = true
                      })
                    })
                  }
                  activeStep.control.isComplete = true
                  delete activeStep.control.mutation
                  delete activeStep.control.nextButtonLabel
                  onNext()
                }
              })
          } else {
            onNext()
          }
          break
        default:
          onNext()
          break
      }
    }

    const CustomFooter = (
      <WizardFooter>
        <WizardContextConsumer>
          {({ activeStep, onNext, onBack, onClose }) => {
              return (
                <>
                  <Button variant="primary" onClick={validateNextStep.bind(null, activeStep, onNext)}>
                    {activeStep.control.nextButtonLabel || 'Next'}
                  </Button>
                  <Button variant="secondary" onClick={onBack} isAriaDisabled={activeStep.index===0}>
                    Back
                  </Button>
                  <Button variant="link" onClick={onClose}>
                    Cancel
                  </Button>
                </>
              )
          }
        }
        </WizardContextConsumer>
      </WizardFooter>
    );


    const title = 'Create wizard'
    let startAtStep = get(steps[0], 'control.startAtStep')
    startAtStep = steps.findIndex(({id})=>id===startAtStep) + 1
    if (startAtStep<1) startAtStep = 1
    return (
      <Wizard
        className={this.props.wizardClassName}
        ref={setWizardRef}
        navAriaLabel={`${title} steps`}
        mainAriaLabel={`${title} content`}
        steps={steps}
        height={'100%'}
        onNext={onMove}
        onBack={onMove}
        onGoToStep={onMove}
        onSave={onSave}
        onClose={onClose}
        startAtStep={startAtStep}
        footer={CustomFooter}
      />
    )
  }
}

ControlPanelWizard.propTypes = {
  choice: PropTypes.object,
  controlData: PropTypes.array,
  handleOnClick: PropTypes.func,
  i18n: PropTypes.func,
  selected: PropTypes.bool,
  setEditorReadOnly: PropTypes.func,
  type: PropTypes.string
}

export default ControlPanelWizard

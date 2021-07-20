'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Tooltip from '../components/Tooltip'

class ControlPanelCards extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    fetchData: PropTypes.object,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
    showEditor: PropTypes.bool
  };

  setControlRef = (control, ref) => {
    this.multiSelect = control.ref = ref
  }

  componentDidMount() {
    const { control, fetchData, handleChange } = this.props
    const { active } = control
    if (typeof active === 'function') {
      const activeID = active(control, fetchData)
      if (activeID) {
        handleChange(activeID)
      }
    }
  }

  render() {
    const { i18n, control, showEditor } = this.props
    const { available=[], availableMap } = control
    let { active } = control
    active = active||[]
    const gridClasses = classNames({
      'tf--grid-container': true,
      small: showEditor
    })
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-card-container"
          ref={this.setControlRef.bind(this, control)}
        >
          <div className={gridClasses}>
            <div className={'tf--grid'}>
              <div className={'tf--providers-container tf--row'}>
                {available
                  .map(availableKey => {
                    const choice = availableMap[availableKey]
                    const { id, hidden } = choice
                    return hidden ? null : (
                      <ControlPanelCard
                        key={id}
                        type={id}
                        selected={active.includes && active.includes(id)}
                        choice={choice}
                        handleOnClick={this.handleChange.bind(this, id)}
                        i18n={i18n}
                      />
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }

  handleChange(id) {
    this.props.handleChange(id)
  }
}

const ControlPanelCard = ({
  choice,
  handleOnClick,
  type,
  selected,
  i18n
}) => {
  const { disabled, logo, title, tooltip, learnMore } = choice
  const cardClasses = classNames({
    'tf--create-cluster-page__provider-card': true,
    'tf--create-cluster-page__provider-card-isSelected': selected,
  })
  const wrapperClasses = classNames('tf--provider-card', {
    'tf--provider-card-isDisabled': disabled
  })
  const handleClick = evt => {
    if (!disabled) {
      handleOnClick(evt, type)
    }
  }
  let image=null
  switch (typeof logo) {
  case 'string':
    image=<img src={logo} alt={title} />
    break
  case 'object':
    image=logo
    break
  }

  const id = title.replace(/\s+/g, '-').toLowerCase()
  return (
    <div
      className={wrapperClasses}
      id={id}
      role="button"
      onClick={handleClick}
      tabIndex="0"
      aria-label={title}
      onKeyDown={handleClick}
      data-testid={`card-${id}`}
    >
      <div className={'tf--provider-card-container'}>
        <div className={cardClasses}>
          <div>{image}</div>
          <div>{title}</div>
        </div>
        {tooltip && (
          <div className="card-tooltip-container">
            <Tooltip control={{ tooltip, learnMore }} i18n={i18n} />
          </div>
        )}
      </div>
    </div>
  )
}

ControlPanelCard.propTypes = {
  choice: PropTypes.object,
  handleOnClick: PropTypes.func,
  i18n: PropTypes.func,
  selected: PropTypes.bool,
  type: PropTypes.string
}

export default ControlPanelCards

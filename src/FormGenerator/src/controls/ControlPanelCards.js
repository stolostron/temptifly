'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Tooltip from '../components/Tooltip'
import isEmpty from 'lodash/isEmpty'
import {
  CheckmarkIcon,
} from '../src/icons/Icons'

class ControlPanelCards extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    fetchData: PropTypes.object,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
    showEditor: PropTypes.bool
  };

  static getDerivedStateFromProps(props, state) {
    const { initialized } = state
    if (!initialized) {
      const { control } = props
      const { active, collapseCardsControlOnSelect } = control
      return { collapsed: collapseCardsControlOnSelect && !isEmpty(active), initialized: true}
    }
    return null
  }

  constructor(props) {
    super(props)
    const { control } = props
    const { active, collapsed, collapseCardsControlOnSelect } = control

    // if active was preset by loading an existing resource
    // collapse cards on that selection
    this.state = {
      collapsed: collapsed || (collapseCardsControlOnSelect && !!active)
    }
  }

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
    const { collapsed } = this.state
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
              {this.renderTitle(control)}
              <div className={'tf--providers-container tf--row'}>
                {available
                  .filter(id => {
                    return (
                      active.length === 0 || !collapsed || active.includes(id)
                    )
                  })
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

  renderTitle(control) {
    const { title, collapsable, validation={} } = control
    const { required } = validation
    if (title && collapsable) {
      const handleCollapse = () => {
        this.setState(prevState => {
          return { collapsed: !prevState.collapsed }
        })
      }
      const handleCollapseKey = e => {
        if (e.type === 'click' || e.key === 'Enter') {
          handleCollapse()
        }
      }
      return (
        <div
          className="creation-view-controls-cards-title-container"
          tabIndex="0"
          role={'button'}
          title={title}
          aria-label={title}
          onClick={handleCollapse}
          onKeyPress={handleCollapseKey}
        >
          <div className="creation-view-controls-cards-title">
            {title}
            {required && (
              <div className="creation-view-controls-required">*</div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  handleChange(id) {
    const { collapsed } = this.state
    const { control } = this.props
    const { collapseCardsControlOnSelect } = control
    if (collapseCardsControlOnSelect) {
      this.setState(prevState => {
        return { collapsed: !prevState.collapsed }
      })
    }
    this.props.handleChange(collapsed ? null : id)
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
    'tf--create-cluster-page__provider-card-isDisabled': disabled
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

  const half = title.substring(0, title.length / 2).lastIndexOf(' ')
  const title1 = title.substring(0, half)
  const title2 = title.substring(half)
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
          {image}
          <p className={'tf--create-cluster-page__provider-card-title'}>
            {title1}
            <span>{title2}</span>
          </p>
        </div>
        {selected && (
          <div className="card-checkmark">
            <CheckmarkIcon />
          </div>
        )}
        {tooltip &&
          !selected && (
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

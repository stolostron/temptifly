'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Tooltip from '../components/Tooltip'
import _ from 'lodash'
import {
  CheckmarkIcon,
} from '../icons/Icons'

class ControlPanelCards extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    fetchData: PropTypes.object,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
    showEditor: PropTypes.bool
  };

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
  };

  UNSAFE_componentWillMount() {
    const { control } = this.props
    const { active, collapseCardsControlOnSelect } = control
    if (typeof active === 'function') {
      const activeID = control.active(control, this.props.fetchData)
      if (activeID) {
        this.props.handleChange(activeID)
      } else {
        control.active = []
      }
    }
    this.setState({ collapsed: collapseCardsControlOnSelect && !_.isEmpty(active) })
  }

  render() {
    const { i18n, control, showEditor } = this.props
    const { available=[], availableMap } = control
    const { collapsed } = this.state
    let { active } = control
    active = active||[]
    const gridClasses = classNames({
      'mcx--grid-container': true,
      small: showEditor
    })
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-card-container"
          ref={this.setControlRef.bind(this, control)}
        >
          <div className={gridClasses}>
            <div className={'bx--grid'}>
              {this.renderTitle(control)}
              <div className={'mcx--providers-container bx--row'}>
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
                        selected={active.includes(id)}
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
    'mcx--create-cluster-page__provider-card': true,
    'mcx--create-cluster-page__provider-card-isSelected': selected,
    'mcx--create-cluster-page__provider-card-isDisabled': disabled
  })
  const wrapperClasses = classNames('mcx--provider-card', {
    'mcx--provider-card-isDisabled': disabled
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
      disabled={true}
      tabIndex="0"
      aria-label={title}
      onKeyDown={handleClick}
    >
      <div className={'mcx--provider-card-container'}>
        <div className={cardClasses}>
          {image}
          <p className={'mcx--create-cluster-page__provider-card-title'}>
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

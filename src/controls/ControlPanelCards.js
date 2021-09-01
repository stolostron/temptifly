'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import groupBy from 'lodash/groupBy'
import { Title, TitleSizes } from '@patternfly/react-core'
import Tooltip from '../components/Tooltip'
import isEmpty from 'lodash/isEmpty'

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

    const availableCards = Object.keys(availableMap).reduce((acc, curr) => {
      if (available.includes(curr)) {
        acc.push(availableMap[curr])
      }
      return acc
    }, [])
    const cardGroups = groupBy(availableCards, (c) => c.section)
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-card-container"
          ref={this.setControlRef.bind(this, control)}
        >
          <div className={gridClasses}>
            <div className={'tf--grid'}>

              {Object.keys(cardGroups).map((group) => (
                <React.Fragment key={group}>
                  {group !== 'undefined' && <Title headingLevel="h1" size={TitleSizes.xl}>{group}</Title>}
                  <div className={'tf--providers-container tf--row'}>
                    {cardGroups[group]
                      .filter(choice => {
                        return (
                          active.length === 0 || !collapsed || active.includes(choice.id)
                        )
                      })
                      .map((choice) => {
                        const { id, hidden } = choice
                        return !hidden && (
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
                </React.Fragment>
              ))}
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

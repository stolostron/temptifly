'use strict'

import React from 'react'
import PropTypes from 'prop-types'

const TooltipContainer = ({ isDisabled, tooltip, children }) => {
  return isDisabled ? (
    <div align="center" className="bx--tooltip--definition">
      <div className="bx--tooltip__trigger" aria-describedby="definition-tooltip-4">
        {children}
      </div>
      <div id="definition-tooltip-4" className="bx--tooltip--definition__bottom" role="tooltip" aria-label={tooltip}>
        <span className="bx--tooltip__caret"></span>
        <p>{tooltip}</p>
      </div>
    </div>
  ) : (
    children
  )
}

TooltipContainer.propTypes = {
  children: PropTypes.element,
  isDisabled: PropTypes.bool,
  tooltip: PropTypes.string
}

export default TooltipContainer

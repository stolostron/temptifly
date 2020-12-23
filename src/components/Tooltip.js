'use strict'

import React from 'react'
import { Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import PropTypes from 'prop-types'

class Tooltip extends React.PureComponent {
  static propTypes = {
    control: PropTypes.object.isRequired,
  };

  render() {
    const { control } = this.props
    const { controlId, tooltip } = control
    return tooltip ? (
      <Popover
        id={`${controlId}-label-help-popover`}
        bodyContent={tooltip}
      >
        <button
          id={`${controlId}-label-help-button`}
          aria-label="More info"
          onClick={(e) => e.preventDefault()}
          className="pf-c-form__group-label-help"
        >
          <HelpIcon noVerticalAlign />
        </button>
      </Popover>
    ) : null
  }
}

export default Tooltip

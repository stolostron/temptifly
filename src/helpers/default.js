'use strict'

module.exports.defaultFn = (opts) => {
  if (opts.data && opts.data._switch_value_ && !opts.data._cased_) {
    return opts.fn(this)
  }
}

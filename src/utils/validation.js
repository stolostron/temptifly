'use strict'

import msgs from '../../nls/platform.properties'


export const VALIDATE_URL = {
  tester: {
    test: value => {
      try {
        new URL(value)
      } catch (e) {
        return false
      }
      return true
    }
  },
  notification: 'creation.invalid.url',
  required: true
}

export const VALIDATE_USER_AND_IP = {
  tester: new RegExp(
    '^[-.0-9a-z]+@(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3,4}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(:[0-9]+)*$'
  ),
  notification: 'creation.ocp.cluster.valid.user.ip',
  required: true
}

export const VALIDATE_MAC_ADDRESS = {
  tester: new RegExp('^([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})$'),
  notification: 'creation.ocp.cluster.valid.mac',
  required: true
}

export const VALIDATE_ALPHANUMERIC = {
  tester: new RegExp('^[A-Za-z0-9-_]+$'),
  notification: 'creation.valid.alphanumeric',
  required: false
}

export const VALIDATE_NUMERIC = {
  tester: new RegExp('^[0-9]+$'),
  notification: 'creation.valid.numeric',
  required: true
}

export const VALID_DNS_NAME =
  '^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$'
const VALID_DNS_NAME_TESTER = new RegExp(VALID_DNS_NAME)

// Tests for one or more path entries
export const VALID_REPOPATH =
  '^.+/[A-Za-z0-9]+(/[A-Za-z0-9-_\\.]*[A-Za-z0-9]+)*$'
const VALID_REPOPATH_TESTER = new RegExp(VALID_REPOPATH)

export const IMAGE_MIRROR_VALIDATOR = (value, locale) => {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  const dnsName = value.split(':', 2)
  const errDnsName = BASE_DNS_NAME_VALIDATOR(dnsName[0], locale)
  if (errDnsName) {
    return errDnsName
  }
  if (dnsName.length === 1) {
    return msgs.get('creation.ocp.cluster.valid.imageregistrymirror')
  }
  const port = dnsName[1].split('/', 2)
  if (
    (port.length === 1 && port[0].length === 0) ||
    !VALIDATE_NUMERIC.tester.test(port[0])
  ) {
    return msgs.get('creation.ocp.cluster.valid.port')
  }
  if (port.length === 1) {
    return msgs.get('creation.ocp.cluster.valid.imageregistrymirror')
  }
  if (!VALID_REPOPATH_TESTER.test(value)) {
    return msgs.get('creation.ocp.cluster.valid.repopath')
  }
  return null
}

export const BASE_DNS_NAME_VALIDATOR = (value, locale) => {
  if (
    value &&
    value.startsWith('.') &&
    VALID_DNS_NAME_TESTER.test(value.substr(1))
  ) {
    return msgs.get('formerror.valid.baseDNSPeriod', locale)
  }
  if (!VALID_DNS_NAME_TESTER.test(value)) {
    return msgs.get('formerror.valid.name', locale)
  }
  return null
}

export const VALIDATE_BASE_DNS_NAME_REQUIRED = {
  contextTester: (value, templateObjectMap, locale) => {
    return BASE_DNS_NAME_VALIDATOR(value, locale)
  },
  notification: 'creation.ocp.cluster.missing.input',
  required: true
}

export const VALID_DNS_LABEL = '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'

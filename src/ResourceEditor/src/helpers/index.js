import { caseFn } from './case.js'
import { defaultFn } from './default.js'
import { if_eqFn } from './if_eq.js'
import { if_gtFn } from './if_gt.js'
import { if_neFn } from './if_ne.js'
import { if_orFn } from './if_or.js'
import { switchFn } from './switch.js'


export const helpers = {
    helpers: {
        case: caseFn,
        default: defaultFn,
        if_eq: if_eqFn,
        if_gt: if_gtFn,
        if_ne: if_neFn,
        if_or: if_orFn,
        switch: switchFn
    }
}

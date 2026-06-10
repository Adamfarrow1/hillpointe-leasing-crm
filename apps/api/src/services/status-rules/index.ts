import { registerRule } from './rule-engine.js';
import { contactedRule } from './contacted.rule.js';
import { tourScheduledRule } from './tour-scheduled.rule.js';
import { touredRule } from './toured.rule.js';
import { applicationRule } from './application.rule.js';
import { leasedRule } from './leased.rule.js';
import { lostRule } from './lost.rule.js';

registerRule(contactedRule);
registerRule(tourScheduledRule);
registerRule(touredRule);
registerRule(applicationRule);
registerRule(leasedRule);
registerRule(lostRule);

export { executeRule } from './rule-engine.js';
export type { RuleResult } from './types.js';

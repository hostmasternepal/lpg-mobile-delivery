import { Module } from '@nestjs/common';
import { PriorityClassificationController } from './priority-classification.controller';
import { PriorityClassificationService } from './priority-classification.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§7, ARCHITECTURE_REVIEW.md §C):
 * priority assessment against the active PriorityPolicyVersion's rules,
 * human override (mandatory reason), and policy-version activation. Sole
 * owner of priority_groups, priority_rules, priority_policy_versions,
 * request_priority_groups, priority_overrides.
 *
 * assess() MUST NOT invent a scoring formula when
 * priority_policy_versions.scoring_formula is null — output stays an
 * unordered set of matched groups. See OPEN-BUSINESS-DECISION-08/09.
 */
@Module({
  controllers: [PriorityClassificationController],
  providers: [PriorityClassificationService],
  exports: [PriorityClassificationService],
})
export class PriorityClassificationModule {}

# Software Requirements Specification
## LPG Emergency Priority Delivery System (Mobile LPG Emergency Delivery Van)

**Source document:** अवधारणा पत्र (Concept Paper) — MoICS (Ministry of Industry, Commerce and Supplies), implementation coordination by NOC (Nepal Oil Corporation).

**Status:** Draft — derived strictly from the approved concept paper. Every requirement below cites the source section (§1–§10) it is grounded in. Nothing beyond the source document has been invented. Every gap the source document leaves open is marked `OPEN-BUSINESS-DECISION` and is **not** resolved in this SRS — it must be resolved by MoICS/NOC stakeholders before design/implementation of that item proceeds.

**ID scheme:** All requirements in this document share one continuous ID space (`REQ-001`, `REQ-002`, …) regardless of category, so every requirement has a single, globally unique identifier. User stories (`US-xxx`) and acceptance criteria reference the `REQ-xxx` IDs they validate rather than minting new requirement IDs. Unresolved items are numbered `OPEN-BUSINESS-DECISION-01`, `-02`, … for traceability, but each still carries the literal marker `OPEN-BUSINESS-DECISION` as required.

---

## 1. Product Overview

The LPG Emergency Priority Delivery System is a digital complaint-to-delivery mechanism proposed by MoICS, coordinated by NOC. Its objective, stated verbatim in the source: during an LPG supply crisis, provide doorstep LPG delivery on a priority basis to consumers who are most urgent/at-risk (Objective statement; §1).

It is explicitly **not** a replacement for regular LPG distribution — it is an "Emergency Priority Delivery Mechanism" for crisis management, operating alongside the existing distribution system (§1, closing message).

- **REQ-001**: The system shall enable a Digital Complaint-to-Delivery process that supports, and does not replace, the existing LPG distribution system. [§1, closing message]
- **REQ-002**: The system's purpose is to identify the most vulnerable/at-risk LPG consumers and deliver to them on a priority basis during a declared LPG supply crisis. [Objective, §1]

---

## 2. Scope

### In scope (explicit)
- **REQ-003**: Collection of LPG demand/complaints from multiple named sources into a single digital system. [§2, §3]
- **REQ-004**: Verification, priority classification, shortlisting, and delivery-queue management of collected requests. [§2, §4, §5]
- **REQ-005**: Coordination of a dedicated "LPG Emergency Priority Delivery Van" service via NOC and partner distributors/delivery companies. [§6]
- **REQ-006**: OTP-based delivery confirmation. [§7]
- **REQ-007**: A real-time dashboard for MoICS/NOC authorized officials. [§8]
- **REQ-008**: Initial pilot operation in Kathmandu Valley and additional districts with high LPG shortage. [§10]
- **REQ-009**: Integration with existing NOC, LPG distributor, delivery company, and Hello Sarkar systems in preference to new infrastructure. [§10]

### Out of scope (explicit)
- Regular/routine LPG distribution and allocation — the system is additive, not a replacement (closing message).

### Unresolved scope items
- `OPEN-BUSINESS-DECISION-01`: The specific list of pilot districts beyond "Kathmandu Valley" is not enumerated in the source (§10 says only "केही जिल्ला" / "some districts").
- `OPEN-BUSINESS-DECISION-02`: Exact integration boundaries/contracts with NOC, distributor, delivery company, and Hello Sarkar systems are not defined (§10).

---

## 3. Actors

| Actor | Description | Source |
|---|---|---|
| Beneficiary | Subject of a request; recipient of OTP and delivery | §3, §7 |
| Intake Source | Hello Sarkar, Social Media, News/Media Reports, NOC/Ministry Call Centre, local government bodies, public/community representatives, other official references — originators of request data | §3 |
| Verifying Body / Distribution Company | Confirms request validity by phone or other means | §5 |
| NOC | Coordinates distributors/delivery companies; operates the priority van program | §6, §10 |
| LPG Distributor / Delivery Company | Executes delivery under NOC coordination | §6 |
| Delivery Agent | Receives delivery assignment data; performs OTP verification; updates delivery status | §6, §7 |
| MoICS/NOC Authorized Official | Views the real-time dashboard | §8 |

- **REQ-010**: The system shall recognize the Beneficiary as the subject of a request, identifiable at minimum by name, mobile number, and address/location where available. [§3]
- **REQ-011**: The system shall accept requests originating from each of the listed Intake Sources. [§3]
- **REQ-012**: The system shall support a Verifying Body/Distribution Company function that confirms request validity. [§5]
- **REQ-013**: The system shall support NOC coordination functions across distributors and delivery companies operating the priority van. [§6, §10]
- **REQ-014**: The system shall support a Delivery Agent function that receives assignment data and performs OTP verification. [§6, §7]
- **REQ-015**: The system shall support a MoICS/NOC Authorized Official function with dashboard viewing access. [§8]

### Unresolved actor items
- `OPEN-BUSINESS-DECISION-03`: The specific organization/individuals filling the "Verifying Body/Distribution Company" function, and their system access level, are not defined (§5).
- `OPEN-BUSINESS-DECISION-04`: Access tiers within "Authorized Official" (e.g., MoICS vs. NOC, national vs. district-level) are not defined (§8).
- `OPEN-BUSINESS-DECISION-05`: No authentication mechanism or role/permission matrix is defined for any actor.

---

## 4. Functional Requirements

### 4.1 Intake
- **REQ-016**: The system shall allow recording of a new request/complaint, tagged with its source channel. [§3]
- **REQ-017**: The system shall capture the following fields per request, where available: beneficiary name, mobile number, address/location, LPG need/problem description, family/group status, priority group, request source, date/time. [§3]
- **REQ-018**: The system shall allow a request to be recorded with partial data, consistent with the source qualifier "सम्भव भएसम्म" (where possible). [§3]

### 4.2 Verification
- **REQ-019**: The system shall support marking a request as "Verified" following confirmation by phone or other means. [§5]
- **REQ-020**: The system shall support transitioning a request from Verified to Shortlisted. [§5]
- **REQ-021**: The system shall support transitioning a Shortlisted request into the Delivery Queue. [§5]
- **REQ-022**: The verification step shall serve to reduce duplicate requests and false information. [§5]

### 4.3 Priority Classification
- **REQ-023**: The system shall classify each verified request into one or more of the following priority groups: extremely poor/deprived families; students/student hostels; marginalized/at-risk communities; senior citizens; persons with disabilities; single women/women-headed poor families; essential services/institutions; other beneficiaries with special humanitarian need. [§4]

### 4.4 Delivery Planning
- **REQ-024**: The system shall generate a delivery plan on a daily or as-needed basis, based on the location and priority of queued requests. [§6]
- **REQ-025**: The system shall provide each delivery agent, via the system, with: beneficiary details, location, contact number, delivery priority, and delivery status for each assigned delivery. [§6]

### 4.5 OTP-Based Delivery Confirmation
- **REQ-026**: The system shall generate and send an OTP to the beneficiary's mobile number at the time of delivery. [§7]
- **REQ-027**: The system shall require the delivery agent to verify the OTP within the system before a delivery can be marked complete. [§7]
- **REQ-028**: The system shall record a delivery as "Delivery Confirmed" only after successful OTP verification. [§7]

### 4.6 Dashboard
- **REQ-029**: The system shall provide a real-time dashboard for authorized officials displaying: Total Requests, Verified Requests, Priority Requests, Shortlisted Beneficiaries, Delivery Planned, Delivery in Progress, Delivered, Pending/Rejected, District/Location-wise Demand, Source-wise Complaints, Daily LPG Distribution. [§8]

### 4.7 Digital Proof of Delivery
- **REQ-030**: The system shall maintain a digital record of each completed delivery as proof of distribution. [§7, §9]

### Unresolved functional items
- `OPEN-BUSINESS-DECISION-06`: Deduplication logic/matching key for detecting duplicate requests is not defined (§5).
- `OPEN-BUSINESS-DECISION-07`: No verification-failure or rejection path/criteria is defined (§5).
- `OPEN-BUSINESS-DECISION-08`: No priority scoring/weighting/tie-breaking method across the priority groups is defined; only the qualifying group list exists (§4).
- `OPEN-BUSINESS-DECISION-09`: No proof/evidence standard for priority-group membership is defined (§4).
- `OPEN-BUSINESS-DECISION-10`: Delivery capacity, fleet size, and coverage boundary per plan are not defined (§6).
- `OPEN-BUSINESS-DECISION-11`: OTP validity duration, retry/resend limits, and fallback for unreachable/phoneless beneficiaries are not defined (§7).
- `OPEN-BUSINESS-DECISION-12`: The "Pending/Rejected" dashboard status has no defined trigger or entry/exit criteria anywhere in the source (§8).

---

## 5. Non-Functional Requirements

The source document states qualitative intents ("real-time", "digital") but provides no quantified non-functional targets. Each item below is stated exactly to the level the source supports; the missing quantification is flagged as open rather than assumed.

- **REQ-031**: The dashboard shall present data in real time. [§8] — precise refresh interval/latency target: `OPEN-BUSINESS-DECISION-13`.
- **REQ-032**: System availability/uptime target during a declared LPG crisis: `OPEN-BUSINESS-DECISION-14` (not stated in source).
- **REQ-033**: System scalability target for concurrent requests/peak crisis load: `OPEN-BUSINESS-DECISION-15` (not stated in source).
- **REQ-034**: System UI language(s): `OPEN-BUSINESS-DECISION-16` (source itself mixes Nepali/English; no explicit requirement stated).
- **REQ-035**: Accessibility requirements for users with disabilities, an explicit priority group under REQ-023: `OPEN-BUSINESS-DECISION-17` (not stated in source).
- **REQ-036**: Data retention/deletion policy for beneficiary PII: `OPEN-BUSINESS-DECISION-18` (not stated in source).
- **REQ-037**: Delivery-agent client platform (mobile app, feature-phone/SMS, web): `OPEN-BUSINESS-DECISION-19` (not stated in source).

---

## 6. User Stories

Each story is traced to the `REQ-xxx` IDs it realizes.

- **US-001** (REQ-016, REQ-017, REQ-018): As an intake operator, I want to record a new LPG request with the caller's available details and source, so that it enters the system for processing.
- **US-002** (REQ-019, REQ-020, REQ-021): As a verifying officer, I want to confirm a request by phone and mark it verified, so that only genuine needs proceed to shortlisting and the delivery queue.
- **US-003** (REQ-023): As the system, I want to classify a verified request into a priority group, so that the most vulnerable beneficiaries are identified for priority delivery.
- **US-004** (REQ-024, REQ-025): As NOC/dispatch staff, I want the system to generate a delivery plan by location and priority and hand assignment data to delivery agents, so that deliveries are organized efficiently.
- **US-005** (REQ-026, REQ-027, REQ-028): As a delivery agent, I want to verify a beneficiary's OTP at the point of delivery, so that I deliver LPG only to the verified beneficiary and the system records confirmed delivery.
- **US-006** (REQ-029): As a MoICS/NOC authorized official, I want to view a real-time dashboard of requests, verifications, priorities, and deliveries, so that I can monitor the crisis response.
- **US-007** (REQ-030): As a government stakeholder, I want a digital record of every completed delivery, so that distribution can be shown to be transparent and non-duplicated.

---

## 7. Acceptance Criteria

**AC for REQ-019 / REQ-020 / REQ-021 (Verification → Shortlisted → Delivery Queue)**
- Given a recorded request, when verification is confirmed by phone or other means, then request status shall change to "Verified."
- Given a Verified request, when shortlisting occurs, then status shall change to "Shortlisted."
- Given a Shortlisted request, when queued for delivery, then status shall change to "Delivery Queue."
- Rejection/failure path: `OPEN-BUSINESS-DECISION-07` — no acceptance criteria can be written until this is resolved.

**AC for REQ-023 (Priority Classification)**
- Given a Verified request with recorded family/group status, when classified, then the request shall be tagged with at least one matching priority group from the REQ-023 list, if applicable.
- Tie-breaking/multi-group weighting: `OPEN-BUSINESS-DECISION-08` — no acceptance criteria can be written until this is resolved.

**AC for REQ-026 / REQ-027 / REQ-028 (OTP)**
- Given a delivery agent has reached the beneficiary, when the system sends an OTP to the beneficiary's registered mobile, then the beneficiary shall receive a one-time code.
- Given the agent enters the OTP into the system, when the entered code matches the issued OTP, then delivery status shall change to "Delivery Confirmed."
- Given the OTP does not match or is not entered, when the agent attempts to complete delivery, then the system shall NOT mark the delivery complete.
- OTP expiry/retry/fallback behavior: `OPEN-BUSINESS-DECISION-11` — no acceptance criteria can be written until this is resolved.

**AC for REQ-029 (Dashboard)**
- Given changes to request, verification, priority, or delivery data, when an authorized official views the dashboard, then all eleven listed metrics shall reflect current system state.
- Refresh latency target: `OPEN-BUSINESS-DECISION-13` — no acceptance criteria can be written until this is resolved.

---

## 8. State Machines

### 8.1 Request Lifecycle (governed by REQ-016–REQ-030)

```
Received --(REQ-016,017,018)--> Recorded
Recorded --(REQ-019)--> Verified
Verified --(REQ-023)--> [Priority-Classified]
Verified --(REQ-020)--> Shortlisted
Shortlisted --(REQ-021)--> Delivery Queue
Delivery Queue --(REQ-024)--> Delivery Planned
Delivery Planned --(REQ-025)--> Delivery In Progress
Delivery In Progress --(REQ-026,027)--> [OTP Verification]
[OTP Verification] --(REQ-028, success)--> Delivery Confirmed
```

- Transition into a **Pending/Rejected** state (named in REQ-029/§8 dashboard metrics) has no defined trigger from any of the above states: `OPEN-BUSINESS-DECISION-12`.
- Transition on **verification failure** (Recorded → ? ) is undefined: `OPEN-BUSINESS-DECISION-07`.
- Transition on **OTP failure** ([OTP Verification] → ? ) is undefined: `OPEN-BUSINESS-DECISION-11`.

### 8.2 OTP Sub-State-Machine (governed by REQ-026–REQ-028)

```
OTP Not Sent --(REQ-026)--> OTP Sent
OTP Sent --(REQ-027, match)--> OTP Verified --(REQ-028)--> Delivery Confirmed
OTP Sent --(REQ-027, mismatch/no entry)--> ??? [OPEN-BUSINESS-DECISION-11]
```

---

## 9. Business Rules

- **REQ-038**: A request shall only enter the Delivery Queue after it has been Verified and Shortlisted, in that order. [§5, sequential dependency]
- **REQ-039**: A delivery shall only be marked complete after successful OTP verification. [§7]
- **REQ-040**: Priority group shall be recorded for a request wherever it can be determined. [§3, §4]
- **REQ-041**: Delivery plan generation shall consider both location and priority jointly as inputs. [§6]
- **REQ-042**: The system shall operate only as a supplementary emergency/priority mechanism and shall not replace or override the routine LPG distribution/allocation system. [closing message]

### Unresolved business rule items
- `OPEN-BUSINESS-DECISION-20`: Cylinder quantity limits, repeat-request frequency/cooldown, and pricing/subsidy handling per beneficiary are not defined anywhere in the source.

---

## 10. API Requirements

The source document specifies no API contracts, protocols, or interface formats. The items below identify only the functional touchpoints implied by REQ-016–REQ-030 that would require an interface; all technical details are open.

- **REQ-043**: The system shall expose an interface for intake operators to create and update requests. [Derived from §3] — protocol/auth: `OPEN-BUSINESS-DECISION-21`.
- **REQ-044**: The system shall expose an interface for verifying staff to update a request's status to Verified. [Derived from §5] — protocol/auth: `OPEN-BUSINESS-DECISION-22`.
- **REQ-045**: The system shall expose an interface for delivery agents to view assigned deliveries and submit OTP verification results. [§6, §7] — client type/protocol/auth: `OPEN-BUSINESS-DECISION-23`.
- **REQ-046**: The system shall expose a read interface serving the dashboard to authorized officials. [§8] — protocol/auth: `OPEN-BUSINESS-DECISION-24`.
- **REQ-047**: The system shall expose integration interfaces to Hello Sarkar, NOC, and distributor/delivery-company systems. [§10] — contract/format/protocol: `OPEN-BUSINESS-DECISION-25`.

---

## 11. Data Requirements

- **REQ-048**: A Request entity shall persist: beneficiary name, mobile number, address/location, LPG need/problem, family/group status, priority group, request source, date/time, and current status. [§3, §5, §8]
- **REQ-049**: A Delivery entity shall persist: assigned delivery agent, beneficiary reference, location, contact number, delivery priority, delivery status, OTP verification result, and delivery timestamp. [§6, §7]
- **REQ-050**: Dashboard aggregate values shall be derivable from Request and Delivery entity data, covering the eleven metrics in REQ-029. [§8]

### Unresolved data items
- `OPEN-BUSINESS-DECISION-26`: Full entity-relationship schema, field types/constraints, and uniqueness/dedup keys are not defined in the source.

---

## 12. Integration Requirements

- **REQ-051**: The system shall integrate with or receive data from Hello Sarkar. [§3, §10] — method: `OPEN-BUSINESS-DECISION-27`.
- **REQ-052**: The system shall integrate with or receive data from the NOC/Ministry Call Centre. [§3, §10] — method: `OPEN-BUSINESS-DECISION-28`.
- **REQ-053**: The system shall integrate with LPG distributors and delivery companies for delivery execution. [§6, §10] — method: `OPEN-BUSINESS-DECISION-29`.
- **REQ-054**: The system shall be capable of ingesting request data sourced from Social Media and News/Media reports. [§3] — automated feed vs. manual transcription: `OPEN-BUSINESS-DECISION-30`.
- **REQ-055**: OTP delivery shall integrate with a mobile messaging (SMS) gateway. [§7] — provider/protocol: `OPEN-BUSINESS-DECISION-31`.

---

## 13. Security Requirements

- **REQ-056**: The system shall use OTP verification to ensure LPG delivery reaches only the verified/genuine beneficiary. [§7]
- **REQ-057**: The system shall maintain digital records to help prevent duplicate/unauthorized distribution. [§5, §9]

### Unresolved security items
- `OPEN-BUSINESS-DECISION-32`: No authentication mechanism is defined for any actor role.
- `OPEN-BUSINESS-DECISION-33`: No authorization/RBAC model is defined.
- `OPEN-BUSINESS-DECISION-34`: No PII protection requirements (encryption at rest/in transit) are defined for beneficiary data, including disability/vulnerability status data.
- `OPEN-BUSINESS-DECISION-35`: No session management or OTP rate-limiting/abuse-prevention requirements are defined.

**Note:** Given the system explicitly processes PII of legally vulnerable populations (REQ-023 groups), the absence of source-stated security controls is a material gap that should be escalated to stakeholders before any implementation, not treated as "no requirement."

---

## 14. Audit Requirements

- **REQ-058**: The system shall retain a digital record of each completed delivery as proof of distribution. [§7, §9]

### Unresolved audit items
- `OPEN-BUSINESS-DECISION-36`: No change/action audit log (who verified, who classified priority, who dispatched, and when) is defined in the source.
- `OPEN-BUSINESS-DECISION-37`: Audit log retention duration and access control are not defined.

---

## 15. Reporting Requirements

- **REQ-059**: The system shall provide real-time reporting as the final stage of the request lifecycle. [§2]
- **REQ-060**: The system shall provide government stakeholders with real-time demand and delivery information. [§9]
- **REQ-061**: Dashboard reporting shall include the eleven metrics specified in REQ-029. [§8]

### Unresolved reporting items
- `OPEN-BUSINESS-DECISION-38`: Periodic/scheduled report generation (daily/weekly/monthly), export formats, and distribution lists are not defined in the source.

---

## Appendix A: Open Business Decisions Register

| ID | Topic | Blocking |
|---|---|---|
| OPEN-BUSINESS-DECISION-01 | Full pilot district list | REQ-008 |
| OPEN-BUSINESS-DECISION-02 | Integration contracts with existing systems | REQ-009 |
| OPEN-BUSINESS-DECISION-03 | Verifying body identity/access | REQ-012 |
| OPEN-BUSINESS-DECISION-04 | Authorized-official access tiers | REQ-015 |
| OPEN-BUSINESS-DECISION-05 | Role/permission matrix & authentication | All actor-facing REQs |
| OPEN-BUSINESS-DECISION-06 | Duplicate-detection matching key | REQ-022 |
| OPEN-BUSINESS-DECISION-07 | Verification failure/rejection path | REQ-019–021, state machine |
| OPEN-BUSINESS-DECISION-08 | Priority scoring/weighting/tie-break | REQ-023 |
| OPEN-BUSINESS-DECISION-09 | Priority-group proof/evidence standard | REQ-023 |
| OPEN-BUSINESS-DECISION-10 | Delivery fleet capacity/coverage | REQ-024 |
| OPEN-BUSINESS-DECISION-11 | OTP validity/retry/fallback | REQ-026–028, state machine |
| OPEN-BUSINESS-DECISION-12 | Pending/Rejected trigger criteria | REQ-029, state machine |
| OPEN-BUSINESS-DECISION-13 | Dashboard refresh latency | REQ-031 |
| OPEN-BUSINESS-DECISION-14 | Availability/uptime target | REQ-032 |
| OPEN-BUSINESS-DECISION-15 | Scalability/peak-load target | REQ-033 |
| OPEN-BUSINESS-DECISION-16 | UI language(s) | REQ-034 |
| OPEN-BUSINESS-DECISION-17 | Accessibility requirements | REQ-035 |
| OPEN-BUSINESS-DECISION-18 | Data retention/deletion policy | REQ-036 |
| OPEN-BUSINESS-DECISION-19 | Delivery-agent client platform | REQ-037 |
| OPEN-BUSINESS-DECISION-20 | Cylinder quantity/frequency/pricing rules | REQ-042 |
| OPEN-BUSINESS-DECISION-21 to -25 | API protocols/auth/contracts | REQ-043–047 |
| OPEN-BUSINESS-DECISION-26 | Full data schema | REQ-048–050 |
| OPEN-BUSINESS-DECISION-27 to -31 | Integration methods | REQ-051–055 |
| OPEN-BUSINESS-DECISION-32 to -35 | Authentication, authorization, PII protection, session/rate limiting | REQ-056–057 |
| OPEN-BUSINESS-DECISION-36 to -37 | Audit logging and retention | REQ-058 |
| OPEN-BUSINESS-DECISION-38 | Scheduled reporting/exports | REQ-059–061 |

**None of the above have been resolved in this document. Design and implementation of the affected requirement must not proceed until each is answered by MoICS/NOC stakeholders.**

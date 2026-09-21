-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_or_username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_district_access" (
    "user_id" TEXT NOT NULL,
    "district_code" TEXT NOT NULL,

    CONSTRAINT "user_district_access_pkey" PRIMARY KEY ("user_id","district_code")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "mobile_number" TEXT,
    "address_text" TEXT,
    "location" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "beneficiary_id" TEXT,
    "lpg_need_description" TEXT,
    "family_group_status" TEXT,
    "source_channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "version" INTEGER NOT NULL DEFAULT 0,
    "requested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_outcomes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "verification_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "verified_by" TEXT,
    "method" TEXT NOT NULL,
    "outcome_id" TEXT NOT NULL,
    "notes" TEXT,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "priority_groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "label_ne" TEXT,

    CONSTRAINT "priority_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "priority_policy_versions" (
    "id" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "scoring_formula" JSONB,
    "activated_at" TIMESTAMP(3),
    "activated_by" TEXT,

    CONSTRAINT "priority_policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "priority_rules" (
    "id" TEXT NOT NULL,
    "policy_version_id" TEXT NOT NULL,
    "predicate" JSONB NOT NULL,
    "target_group_id" TEXT NOT NULL,

    CONSTRAINT "priority_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_priority_groups" (
    "request_id" TEXT NOT NULL,
    "priority_group_id" TEXT NOT NULL,
    "assessed_under_policy_version_id" TEXT,

    CONSTRAINT "request_priority_groups_pkey" PRIMARY KEY ("request_id","priority_group_id")
);

-- CreateTable
CREATE TABLE "priority_overrides" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "previous_groups" JSONB NOT NULL,
    "new_groups" JSONB NOT NULL,
    "actor_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "priority_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "capacity_cylinders" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_plans" (
    "id" TEXT NOT NULL,
    "plan_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_plan_vehicles" (
    "id" TEXT NOT NULL,
    "delivery_plan_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "agent_profile_id" TEXT,
    "cylinders_loaded" INTEGER NOT NULL DEFAULT 0,
    "cylinders_remaining" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "delivery_plan_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_stops" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "delivery_plan_vehicle_id" TEXT,
    "sequence_number" INTEGER,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "version" INTEGER NOT NULL DEFAULT 0,
    "planned_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "delivery_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "delivery_stop_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "delivery_stop_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "recipient" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_inbox" (
    "id" TEXT NOT NULL,
    "source_channel" TEXT NOT NULL,
    "external_reference_id" TEXT NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "integration_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before_state" JSONB,
    "after_state" JSONB,
    "correlation_id" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_or_username_key" ON "users"("phone_or_username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_user_id_key" ON "agent_profiles"("user_id");

-- CreateIndex
CREATE INDEX "beneficiaries_mobile_number_idx" ON "beneficiaries"("mobile_number");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_source_channel_idx" ON "requests"("source_channel");

-- CreateIndex
CREATE UNIQUE INDEX "verification_outcomes_code_key" ON "verification_outcomes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "priority_groups_code_key" ON "priority_groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_plans_plan_date_key" ON "delivery_plans"("plan_date");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_request_id_key" ON "deliveries"("request_id");

-- CreateIndex
CREATE INDEX "delivery_stops_status_idx" ON "delivery_stops"("status");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_stops_delivery_id_attempt_number_key" ON "delivery_stops"("delivery_id", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "integration_inbox_source_channel_external_reference_id_key" ON "integration_inbox"("source_channel", "external_reference_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_district_access" ADD CONSTRAINT "user_district_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "verification_outcomes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_policy_versions" ADD CONSTRAINT "priority_policy_versions_activated_by_fkey" FOREIGN KEY ("activated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_rules" ADD CONSTRAINT "priority_rules_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "priority_policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_rules" ADD CONSTRAINT "priority_rules_target_group_id_fkey" FOREIGN KEY ("target_group_id") REFERENCES "priority_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_priority_groups" ADD CONSTRAINT "request_priority_groups_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_priority_groups" ADD CONSTRAINT "request_priority_groups_priority_group_id_fkey" FOREIGN KEY ("priority_group_id") REFERENCES "priority_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_priority_groups" ADD CONSTRAINT "request_priority_groups_assessed_under_policy_version_id_fkey" FOREIGN KEY ("assessed_under_policy_version_id") REFERENCES "priority_policy_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_overrides" ADD CONSTRAINT "priority_overrides_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_overrides" ADD CONSTRAINT "priority_overrides_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_plan_vehicles" ADD CONSTRAINT "delivery_plan_vehicles_delivery_plan_id_fkey" FOREIGN KEY ("delivery_plan_id") REFERENCES "delivery_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_plan_vehicles" ADD CONSTRAINT "delivery_plan_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_plan_vehicles" ADD CONSTRAINT "delivery_plan_vehicles_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_stops" ADD CONSTRAINT "delivery_stops_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_stops" ADD CONSTRAINT "delivery_stops_delivery_plan_vehicle_id_fkey" FOREIGN KEY ("delivery_plan_vehicle_id") REFERENCES "delivery_plan_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_delivery_stop_id_fkey" FOREIGN KEY ("delivery_stop_id") REFERENCES "delivery_stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_delivery_stop_id_fkey" FOREIGN KEY ("delivery_stop_id") REFERENCES "delivery_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

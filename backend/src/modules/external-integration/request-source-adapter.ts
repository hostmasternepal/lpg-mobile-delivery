import { CreateRequestDto } from '../request-intake/dto/create-request.dto';
import { InboundRequestPayloadDto } from './dto/receive-webhook.dto';

/**
 * Normalizes a raw inbound payload into RequestIntake's own DTO shape.
 * This interface is the anti-corruption boundary docs/ARCHITECTURE.md
 * §11 describes: RequestIntake's intake logic never depends on any
 * external system's data shape, because every source's adapter converts
 * to this one common contract before calling
 * RequestIntakeService.createRequest().
 *
 * No external system's ACTUAL field names or contract are asserted
 * anywhere in this codebase — OPEN-BUSINESS-DECISION-21/22/25/27-31 stay
 * fully open. GenericPassthroughAdapter below (which assumes the payload
 * already matches our own field names) is the only implementation until
 * a real per-source contract is confirmed; adding one then means adding
 * a new class here and registering it in
 * ExternalIntegrationService.getAdapterFor() — the staging/idempotency
 * pipeline in receiveWebhook() does not change.
 */
export interface IRequestSourceAdapter {
  normalize(sourceChannel: string, payload: InboundRequestPayloadDto): CreateRequestDto;
}

export class GenericPassthroughAdapter implements IRequestSourceAdapter {
  normalize(sourceChannel: string, payload: InboundRequestPayloadDto): CreateRequestDto {
    const dto = new CreateRequestDto();
    dto.sourceChannel = sourceChannel as CreateRequestDto['sourceChannel'];
    dto.beneficiaryName = payload.beneficiaryName;
    dto.mobileNumber = payload.mobileNumber;
    dto.addressText = payload.addressText;
    dto.location = payload.location;
    dto.lpgNeedDescription = payload.lpgNeedDescription;
    dto.familyGroupStatus = payload.familyGroupStatus;
    dto.requestedAt = payload.requestedAt;
    return dto;
  }
}

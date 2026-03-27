package com.gadgetseva.dto;

import com.gadgetseva.entity.RequestPriority;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateServiceRequestRequest(
        @Valid @NotNull CustomerPayload customer,
        @Valid @NotNull DevicePayload device,
        @NotBlank String issueSummary,
        String issueDescription,
        @NotNull RequestPriority priority,
        @NotBlank String sourceChannel,
        String tenantCode,
        String loanNumber,
        String certificateOfInsuranceNumber,
        String previousTicketNumber,
        String partnerReference,
        String projectName,
        String branchName,
        String employeeCode,
        String employeeName,
        Integer promisedSlaHours
) {
}

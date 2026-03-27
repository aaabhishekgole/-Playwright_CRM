package com.gadgetseva.util;

import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.exception.InvalidTransitionException;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;

public final class StatusTransitionRules {

    private static final Map<RequestStatus, EnumSet<RequestStatus>> ALLOWED = new EnumMap<>(RequestStatus.class);

    static {
        ALLOWED.put(RequestStatus.REQUEST_CREATED, EnumSet.of(RequestStatus.PICKUP_ASSIGNED));
        ALLOWED.put(RequestStatus.PICKUP_ASSIGNED, EnumSet.of(RequestStatus.PICKUP_IN_PROGRESS, RequestStatus.PICKUP_COMPLETED));
        ALLOWED.put(RequestStatus.PICKUP_IN_PROGRESS, EnumSet.of(RequestStatus.PICKUP_COMPLETED));
        ALLOWED.put(RequestStatus.PICKUP_COMPLETED, EnumSet.of(RequestStatus.RECEIVED_AT_HUB, RequestStatus.DIAGNOSIS_IN_PROGRESS));
        ALLOWED.put(RequestStatus.RECEIVED_AT_HUB, EnumSet.of(RequestStatus.DIAGNOSIS_IN_PROGRESS));
        ALLOWED.put(RequestStatus.DIAGNOSIS_IN_PROGRESS, EnumSet.of(RequestStatus.ESTIMATE_PREPARED, RequestStatus.TOTAL_LOSS));
        ALLOWED.put(RequestStatus.ESTIMATE_PREPARED, EnumSet.of(
                RequestStatus.DIAGNOSIS_IN_PROGRESS,
                RequestStatus.ESTIMATE_APPROVED,
                RequestStatus.CASHLESS_PENDING_APPROVAL,
                RequestStatus.TOTAL_LOSS
        ));
        ALLOWED.put(RequestStatus.CASHLESS_PENDING_APPROVAL, EnumSet.of(
                RequestStatus.CASHLESS_APPROVED,
                RequestStatus.CASHLESS_REVISION_REQUIRED,
                RequestStatus.CASHLESS_REJECTED,
                RequestStatus.ESTIMATE_APPROVED
        ));
        ALLOWED.put(RequestStatus.CASHLESS_REVISION_REQUIRED, EnumSet.of(RequestStatus.CASHLESS_PENDING_APPROVAL, RequestStatus.CASHLESS_REJECTED));
        ALLOWED.put(RequestStatus.CASHLESS_REJECTED, EnumSet.of(RequestStatus.CLOSED));
        ALLOWED.put(RequestStatus.CASHLESS_APPROVED, EnumSet.of(RequestStatus.REPAIR_IN_PROGRESS));
        ALLOWED.put(RequestStatus.ESTIMATE_APPROVED, EnumSet.of(RequestStatus.REPAIR_IN_PROGRESS));
        ALLOWED.put(RequestStatus.REPAIR_IN_PROGRESS, EnumSet.of(RequestStatus.REPAIR_COMPLETED));
        ALLOWED.put(RequestStatus.REPAIR_COMPLETED, EnumSet.of(RequestStatus.READY_FOR_DISPATCH, RequestStatus.DELIVERY_ASSIGNED));
        ALLOWED.put(RequestStatus.TOTAL_LOSS, EnumSet.of(RequestStatus.CLOSED));
        ALLOWED.put(RequestStatus.READY_FOR_DISPATCH, EnumSet.of(RequestStatus.DELIVERY_ASSIGNED));
        ALLOWED.put(RequestStatus.DELIVERY_ASSIGNED, EnumSet.of(RequestStatus.OUT_FOR_DELIVERY));
        ALLOWED.put(RequestStatus.OUT_FOR_DELIVERY, EnumSet.of(RequestStatus.DELIVERED));
        ALLOWED.put(RequestStatus.DELIVERED, EnumSet.of(RequestStatus.INVOICED));
        ALLOWED.put(RequestStatus.INVOICED, EnumSet.of(RequestStatus.CLOSED));
        ALLOWED.put(RequestStatus.CLOSED, EnumSet.noneOf(RequestStatus.class));
    }

    private StatusTransitionRules() {
    }

    public static void assertAllowed(RequestStatus current, RequestStatus target) {
        EnumSet<RequestStatus> allowedTargets = ALLOWED.getOrDefault(current, EnumSet.noneOf(RequestStatus.class));
        if (!allowedTargets.contains(target)) {
            throw new InvalidTransitionException("Invalid transition from " + current + " to " + target);
        }
    }
}

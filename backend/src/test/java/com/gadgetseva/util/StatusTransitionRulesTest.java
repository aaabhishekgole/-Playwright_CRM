package com.gadgetseva.util;

import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.exception.InvalidTransitionException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class StatusTransitionRulesTest {

    @Test
    void allowsHappyPathTransition() {
        Assertions.assertDoesNotThrow(() -> StatusTransitionRules.assertAllowed(
                RequestStatus.REQUEST_CREATED,
                RequestStatus.PICKUP_ASSIGNED
        ));
    }

    @Test
    void allowsRunnerCustomerUpdateTransition() {
        Assertions.assertDoesNotThrow(() -> StatusTransitionRules.assertAllowed(
                RequestStatus.PICKUP_ASSIGNED,
                RequestStatus.CUSTOMER_NOT_AVAILABLE
        ));
    }

    @Test
    void allowsReassignAfterRunnerCustomerUpdate() {
        Assertions.assertDoesNotThrow(() -> StatusTransitionRules.assertAllowed(
                RequestStatus.CUSTOMER_RESCHEDULED,
                RequestStatus.PICKUP_ASSIGNED
        ));
    }

    @Test
    void rejectsInvalidTransition() {
        Assertions.assertThrows(InvalidTransitionException.class, () -> StatusTransitionRules.assertAllowed(
                RequestStatus.REQUEST_CREATED,
                RequestStatus.DELIVERED
        ));
    }
}

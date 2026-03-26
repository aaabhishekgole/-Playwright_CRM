package com.gadgetseva.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadgetseva.dto.CreateServiceRequestRequest;
import com.gadgetseva.dto.CustomerPayload;
import com.gadgetseva.dto.DevicePayload;
import com.gadgetseva.dto.ServiceRequestResponse;
import com.gadgetseva.entity.RequestPriority;
import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.exception.GlobalExceptionHandler;
import com.gadgetseva.service.ServiceRequestService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ServiceRequestControllerTest {

    private final ServiceRequestService serviceRequestService = Mockito.mock(ServiceRequestService.class);
    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new ServiceRequestController(serviceRequestService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void createsServiceRequest() throws Exception {
        CreateServiceRequestRequest request = new CreateServiceRequestRequest(
                new CustomerPayload("Nisha", "nisha@example.com", "1234567890", "Street 1", null, "Dubai", "Dubai", "00001"),
                new DevicePayload("Apple", "iPhone 14", "SER123", "490154203237518", "OUT_OF_WARRANTY", "Screen cracked", "IMEI:490154203237518"),
                "Screen broken",
                "Touch not working",
                RequestPriority.HIGH,
                "CRM",
                "GSH-CORE",
                "AMZ-RMA-1",
                48
        );
        ServiceRequestResponse response = new ServiceRequestResponse(
                1L,
                "GSH-20260323-1001",
                "GSH-CORE",
                "Gadget Seva Hub Direct",
                "AMZ-RMA-1",
                "Nisha",
                "1234567890",
                null,
                "Apple iPhone 14",
                "490154203237518",
                "VALID",
                "IMEI:490154203237518",
                "Screen broken",
                "Touch not working",
                RequestPriority.HIGH,
                RequestStatus.REQUEST_CREATED,
                "CRM",
                null,
                null,
                null,
                Instant.now(),
                Instant.now(),
                Instant.now(),
                null,
                null,
                false,
                null,
                null,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                Instant.now(),
                Instant.now()
        );

        Mockito.when(serviceRequestService.create(Mockito.any())).thenReturn(response);

        mockMvc.perform(post("/api/service-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
package com.gadgetseva.util;

import com.gadgetseva.persistence.ServiceRequestStore;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
public class RequestNumberGenerator {

    private final ServiceRequestStore serviceRequestStore;
    private final AtomicInteger counter = new AtomicInteger(1000);
    private LocalDate sequenceDate;

    public RequestNumberGenerator(ServiceRequestStore serviceRequestStore) {
        this.serviceRequestStore = serviceRequestStore;
    }

    public synchronized String next() {
        LocalDate today = LocalDate.now();
        if (sequenceDate == null || !sequenceDate.equals(today)) {
            counter.set(resolveCurrentCounter(today));
            sequenceDate = today;
        }

        String date = today.format(DateTimeFormatter.BASIC_ISO_DATE);
        return "GSH-" + date + "-" + counter.incrementAndGet();
    }

    private int resolveCurrentCounter(LocalDate date) {
        String prefix = "GSH-" + date.format(DateTimeFormatter.BASIC_ISO_DATE) + "-";
        return serviceRequestStore.findAllOrderByCreatedAtDesc().stream()
                .map(serviceRequest -> serviceRequest.getRequestNumber())
                .filter(requestNumber -> requestNumber != null && requestNumber.startsWith(prefix))
                .map(requestNumber -> requestNumber.substring(prefix.length()))
                .mapToInt(this::safeParseCounter)
                .max()
                .orElse(1000);
    }

    private int safeParseCounter(String suffix) {
        try {
            return Integer.parseInt(suffix);
        } catch (NumberFormatException ignored) {
            return 1000;
        }
    }
}

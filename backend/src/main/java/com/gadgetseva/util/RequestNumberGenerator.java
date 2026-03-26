package com.gadgetseva.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
public class RequestNumberGenerator {

    private final AtomicInteger counter = new AtomicInteger(1000);

    public String next() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return "GSH-" + date + "-" + counter.incrementAndGet();
    }
}

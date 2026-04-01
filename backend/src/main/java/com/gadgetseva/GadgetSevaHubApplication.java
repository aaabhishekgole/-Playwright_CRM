package com.gadgetseva;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GadgetSevaHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(GadgetSevaHubApplication.class, args);
    }
}

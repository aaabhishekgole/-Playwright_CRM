package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}

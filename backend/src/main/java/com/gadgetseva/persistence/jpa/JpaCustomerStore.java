package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Customer;
import com.gadgetseva.persistence.CustomerStore;
import com.gadgetseva.repository.jpa.CustomerRepository;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaCustomerStore implements CustomerStore {

    private final CustomerRepository customerRepository;

    public JpaCustomerStore(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Override
    public Customer save(Customer customer) {
        return customerRepository.save(customer);
    }
}

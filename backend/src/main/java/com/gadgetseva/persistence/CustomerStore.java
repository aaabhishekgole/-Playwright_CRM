package com.gadgetseva.persistence;

import com.gadgetseva.entity.Customer;

public interface CustomerStore {

    Customer save(Customer customer);
}

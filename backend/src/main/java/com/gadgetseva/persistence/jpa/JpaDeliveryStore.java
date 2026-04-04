package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Delivery;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.DeliveryStore;
import com.gadgetseva.repository.jpa.DeliveryRepository;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaDeliveryStore implements DeliveryStore {

    private final DeliveryRepository deliveryRepository;

    public JpaDeliveryStore(DeliveryRepository deliveryRepository) {
        this.deliveryRepository = deliveryRepository;
    }

    @Override
    public Optional<Delivery> findByServiceRequest(ServiceRequest serviceRequest) {
        return deliveryRepository.findByServiceRequest(serviceRequest);
    }

    @Override
    public Delivery save(Delivery delivery) {
        return deliveryRepository.save(delivery);
    }
}

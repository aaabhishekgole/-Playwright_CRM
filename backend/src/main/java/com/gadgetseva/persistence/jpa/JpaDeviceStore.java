package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Device;
import com.gadgetseva.persistence.DeviceStore;
import com.gadgetseva.repository.jpa.DeviceRepository;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaDeviceStore implements DeviceStore {

    private final DeviceRepository deviceRepository;

    public JpaDeviceStore(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @Override
    public Optional<Device> findBySerialNumber(String serialNumber) {
        return deviceRepository.findBySerialNumber(serialNumber);
    }

    @Override
    public Device save(Device device) {
        return deviceRepository.save(device);
    }
}

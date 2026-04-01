package com.gadgetseva.persistence;

import com.gadgetseva.entity.Device;
import java.util.Optional;

public interface DeviceStore {

    Optional<Device> findBySerialNumber(String serialNumber);

    Device save(Device device);
}

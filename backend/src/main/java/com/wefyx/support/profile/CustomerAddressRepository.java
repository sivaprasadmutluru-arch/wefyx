package com.wefyx.support.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {
    List<CustomerAddress> findByCustomerEmailIgnoreCaseOrderByDefaultAddressDescUpdatedAtDesc(String email);
    Optional<CustomerAddress> findByIdAndCustomerEmailIgnoreCase(Long id, String email);
}

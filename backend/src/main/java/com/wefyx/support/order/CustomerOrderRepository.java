package com.wefyx.support.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder,Long>, JpaSpecificationExecutor<CustomerOrder> {
    List<CustomerOrder> findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    Optional<CustomerOrder> findByPaymentReference(String reference);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from CustomerOrder o where o.id=:id") Optional<CustomerOrder> lockById(@org.springframework.data.repository.query.Param("id")Long id);
    Optional<CustomerOrder> findByReference(String reference);
}

package com.wefyx.support.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderAuditEventRepository extends JpaRepository<OrderAuditEvent,Long> {
    List<OrderAuditEvent> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}

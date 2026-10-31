package com.wefyx.support.booking;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.*;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<Booking> findByEmployeeEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<Booking> findAllByOrderByCreatedAtDesc();
    Optional<Booking> findByRequestKey(String key);
    List<Booking> findByDateAndOccupiedSlotIsNotNull(LocalDate date);
    Optional<Booking> findByCheckoutSessionId(String sessionId);
    List<Booking> findByDateAndStatusAndOccupiedSlotIsNotNull(LocalDate date,Booking.Status status);
    @Query("select b.time from Booking b where b.date = :date and b.occupiedSlot is not null")
    List<String> occupiedTimes(@Param("date") LocalDate date);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> lockById(@Param("id") Long id);
}

package com.wefyx.support.booking;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "service_bookings", indexes = {
    @Index(name = "booking_customer_idx", columnList = "customerEmail,createdAt"),
    @Index(name = "booking_employee_idx", columnList = "employeeEmail,createdAt")
})
public class Booking {
    public enum Status { AWAITING_PAYMENT, CONFIRMED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED }
    public enum SupportType { SITE_VISIT, REMOTE, GENERAL }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Version Long version;
    @Column(nullable = false, unique = true) String reference;
    @Column(nullable = false, unique = true) String requestKey;
    @Column(nullable = false) String customerEmail;
    String supportType;
    String serviceName;
    @Column(precision=10,scale=2) BigDecimal baseAmount;
    @Column(precision=10,scale=2) BigDecimal vatAmount;
    String checkoutSessionId;
    @Column(length=2000) String checkoutUrl;
    Instant holdUntil;
    int checkoutAttempt;
    int slotMinutes=60;
    String company;
    String contactName;
    String contactEmail;
    String phone;
    String category;
    String subject;
    @Column(length = 4000) String description;
    LocalDate date;
    String time;
    @Column(length = 1000) String address;
    String emirate;
    @Column(precision = 10, scale = 2) BigDecimal amount;
    @Enumerated(EnumType.STRING) Status status;
    // A unique slot is claimed only after verified payment, never for unpaid drafts.
    @Column(unique = true) String occupiedSlot;
    @Column(unique = true) String paymentReference;
    String employeeEmail;
    String employeeName;
    @Column(length = 3000) String workSummary;
    @Column(length = 2000) String actionsTaken;
    Instant createdAt;
    Instant paidAt;
    Instant assignedAt;
    Instant startedAt;
    Instant completedAt;
    protected Booking() {}
}

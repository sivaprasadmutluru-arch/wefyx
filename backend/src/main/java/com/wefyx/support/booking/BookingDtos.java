package com.wefyx.support.booking;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;

public final class BookingDtos {
    private BookingDtos() {}
    public record Create(
        @NotBlank @Pattern(regexp = "[a-zA-Z0-9-]{16,80}") String requestKey,
        @NotBlank @Pattern(regexp="[A-Z][A-Z0-9_]{1,39}") String supportType,
        @NotBlank @Size(max = 200) String company,
        @NotBlank @Size(max = 120) String contactName,
        @NotBlank @Email @Size(max = 254) String contactEmail,
        @NotBlank @Pattern(regexp = "[+0-9][0-9() .-]{6,24}") String phone,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 180) String subject,
        @NotBlank @Size(max = 4000) String description,
        @NotNull LocalDate date,
        @NotBlank String time,
        @NotBlank @Size(max = 1000) String address,
        @NotBlank @Size(max = 80) String emirate) {}
    public record Assign(@NotBlank @Email String employeeEmail) {}
    public record Report(@NotBlank @Size(max = 3000) String workSummary,
                         @NotNull @Size(max = 20) List<@NotBlank @Size(max = 90) String> actionsTaken) {}
    public record View(Long id, String reference, String supportType, String company,
        String contactName, String contactEmail, String phone, String category, String subject,
        String description, LocalDate date, String time, String address, String emirate,
        BigDecimal amount, String currency, Booking.Status status, String employeeName,
        Instant createdAt, Instant paidAt, Instant assignedAt, Instant startedAt, Instant completedAt,
        String workSummary, List<String> actionsTaken, String serviceName, BigDecimal baseAmount, BigDecimal vatAmount) {
        static View from(Booking b) {
            return new View(b.id,b.reference,b.supportType,b.company,b.contactName,b.contactEmail,
                b.phone,b.category,b.subject,b.description,b.date,b.time,b.address,b.emirate,b.amount,
                "AED",b.status,b.employeeName,b.createdAt,b.paidAt,b.assignedAt,b.startedAt,
                b.completedAt,b.workSummary,b.actionsTaken == null ? List.of() : List.of(b.actionsTaken.split("\n")),b.serviceName,b.baseAmount,b.vatAmount);
        }
    }
}

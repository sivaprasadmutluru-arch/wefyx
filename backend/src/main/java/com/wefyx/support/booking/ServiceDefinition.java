package com.wefyx.support.booking;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
@Entity @Table(name="service_definitions")
public class ServiceDefinition {
 @Id @NotBlank @Pattern(regexp="[A-Z][A-Z0-9_]{1,39}") public String code;
 @NotBlank @Size(max=120) public String name;
 @NotBlank @Size(max=1000) @Column(length=1000) public String description;
 @NotNull @DecimalMin("1.00") @Digits(integer=7,fraction=2) @Column(precision=10,scale=2) public BigDecimal basePrice;
 @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=2) @Column(precision=5,scale=2) public BigDecimal vatPercent=new BigDecimal("5");
 @Min(0) @Max(23) public int openingHour=9;
 @Min(1) @Max(24) public int closingHour=17;
 @Min(15) @Max(240) public int slotMinutes=60;
 @NotBlank public String workingDays="MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY";
 @Min(1) @Max(365) public int advanceDays=90;
 public boolean active=true;
 public BigDecimal vat(){return basePrice.multiply(vatPercent).divide(new BigDecimal("100"),2,java.math.RoundingMode.HALF_UP);}
 public BigDecimal total(){return basePrice.add(vat());}
}

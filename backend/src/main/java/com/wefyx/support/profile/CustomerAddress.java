package com.wefyx.support.profile;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_addresses", indexes = {
    @Index(name = "idx_customer_addresses_email", columnList = "customerEmail")
})
public class CustomerAddress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String customerEmail;
    @Column(nullable = false, length = 80) private String label;
    @Column(nullable = false, length = 120) private String contactName;
    @Column(nullable = false, length = 40) private String phone;
    @Column(nullable = false, length = 1000) private String addressLine;
    @Column(length = 80) private String emirate;
    @Column(length = 80) private String country;
    private Double latitude;
    private Double longitude;
    private boolean defaultAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist void create(){var now=LocalDateTime.now();createdAt=now;updatedAt=now;}
    @PreUpdate void update(){updatedAt=LocalDateTime.now();}

    public Long getId(){return id;}
    public String getCustomerEmail(){return customerEmail;} public void setCustomerEmail(String v){customerEmail=v;}
    public String getLabel(){return label;} public void setLabel(String v){label=v;}
    public String getContactName(){return contactName;} public void setContactName(String v){contactName=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getAddressLine(){return addressLine;} public void setAddressLine(String v){addressLine=v;}
    public String getEmirate(){return emirate;} public void setEmirate(String v){emirate=v;}
    public String getCountry(){return country;} public void setCountry(String v){country=v;}
    public Double getLatitude(){return latitude;} public void setLatitude(Double v){latitude=v;}
    public Double getLongitude(){return longitude;} public void setLongitude(Double v){longitude=v;}
    public boolean isDefaultAddress(){return defaultAddress;} public void setDefaultAddress(boolean v){defaultAddress=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}

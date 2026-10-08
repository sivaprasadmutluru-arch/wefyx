package com.wefyx.support.order;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_orders", indexes = {
    @Index(name = "idx_customer_orders_email", columnList = "customerEmail"),
    @Index(name = "idx_customer_orders_reference", columnList = "reference", unique = true)
})
public class CustomerOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String reference;
    @Column(nullable = false) private String customerEmail;
    @Column(nullable = false) private String customerName;
    private String organization;
    @Column(nullable = false) private String status;
    @Column(length = 40) private String paymentMethod;
    @Column(length = 40) private String paymentStatus;
    @Column(length = 120) private String paymentReference;
    @Column(length = 500) private String paymentProofUrl;
    @Column(length = 1000) private String paymentNotes;
    @Column(length = 80) private String invoiceNumber;
    private LocalDateTime paidAt;
    @Column(nullable = false) private String currency;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal subtotal;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal vat;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal securityDeposit=BigDecimal.ZERO;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal total;
    @Column(nullable = false) private Integer itemCount;
    @Column(nullable = false, columnDefinition = "text") private String itemsJson;
    private boolean termsAccepted;
    private LocalDateTime termsAcceptedAt;
    private boolean inventoryReleased;
    @Column(length = 80) private String deliveryLabel;
    @Column(length = 120) private String deliveryContactName;
    @Column(length = 40) private String deliveryPhone;
    @Column(length = 1000) private String deliveryAddress;
    @Column(length = 80) private String deliveryEmirate;
    @Column(length = 80) private String deliveryCountry;
    private Double deliveryLatitude;
    private Double deliveryLongitude;
    @Column(length = 40) private String deliveryStatus;
    @Column(length = 2000) private String trackingNotes;
    @Column(length = 1000) private String cancellationReason;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected CustomerOrder() {}
    @PrePersist void create(){if(createdAt==null)createdAt=LocalDateTime.now();updatedAt=LocalDateTime.now();}
    @PreUpdate void update(){updatedAt=LocalDateTime.now();}

    public Long getId(){return id;} public String getReference(){return reference;} public void setReference(String v){reference=v;}
    public String getCustomerEmail(){return customerEmail;} public void setCustomerEmail(String v){customerEmail=v;}
    public String getCustomerName(){return customerName;} public void setCustomerName(String v){customerName=v;}
    public String getOrganization(){return organization;} public void setOrganization(String v){organization=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public String getPaymentMethod(){return paymentMethod;} public void setPaymentMethod(String v){paymentMethod=v;}
    public String getPaymentStatus(){return paymentStatus;} public void setPaymentStatus(String v){paymentStatus=v;}
    public String getPaymentReference(){return paymentReference;} public void setPaymentReference(String v){paymentReference=v;}
    public String getPaymentProofUrl(){return paymentProofUrl;} public void setPaymentProofUrl(String v){paymentProofUrl=v;}
    public String getPaymentNotes(){return paymentNotes;} public void setPaymentNotes(String v){paymentNotes=v;}
    public String getInvoiceNumber(){return invoiceNumber;} public void setInvoiceNumber(String v){invoiceNumber=v;}
    public LocalDateTime getPaidAt(){return paidAt;} public void setPaidAt(LocalDateTime v){paidAt=v;}
    public String getCurrency(){return currency;} public void setCurrency(String v){currency=v;}
    public BigDecimal getSubtotal(){return subtotal;} public void setSubtotal(BigDecimal v){subtotal=v;}
    public BigDecimal getVat(){return vat;} public void setVat(BigDecimal v){vat=v;}
    public BigDecimal getSecurityDeposit(){return securityDeposit;} public void setSecurityDeposit(BigDecimal v){securityDeposit=v;}
    public BigDecimal getTotal(){return total;} public void setTotal(BigDecimal v){total=v;}
    public Integer getItemCount(){return itemCount;} public void setItemCount(Integer v){itemCount=v;}
    public String getItemsJson(){return itemsJson;} public void setItemsJson(String v){itemsJson=v;}
    public boolean isTermsAccepted(){return termsAccepted;} public void setTermsAccepted(boolean v){termsAccepted=v;}
    public LocalDateTime getTermsAcceptedAt(){return termsAcceptedAt;} public void setTermsAcceptedAt(LocalDateTime v){termsAcceptedAt=v;}
    public boolean isInventoryReleased(){return inventoryReleased;} public void setInventoryReleased(boolean v){inventoryReleased=v;}
    public String getDeliveryLabel(){return deliveryLabel;} public void setDeliveryLabel(String v){deliveryLabel=v;}
    public String getDeliveryContactName(){return deliveryContactName;} public void setDeliveryContactName(String v){deliveryContactName=v;}
    public String getDeliveryPhone(){return deliveryPhone;} public void setDeliveryPhone(String v){deliveryPhone=v;}
    public String getDeliveryAddress(){return deliveryAddress;} public void setDeliveryAddress(String v){deliveryAddress=v;}
    public String getDeliveryEmirate(){return deliveryEmirate;} public void setDeliveryEmirate(String v){deliveryEmirate=v;}
    public String getDeliveryCountry(){return deliveryCountry;} public void setDeliveryCountry(String v){deliveryCountry=v;}
    public Double getDeliveryLatitude(){return deliveryLatitude;} public void setDeliveryLatitude(Double v){deliveryLatitude=v;}
    public Double getDeliveryLongitude(){return deliveryLongitude;} public void setDeliveryLongitude(Double v){deliveryLongitude=v;}
    public String getDeliveryStatus(){return deliveryStatus;} public void setDeliveryStatus(String v){deliveryStatus=v;}
    public String getTrackingNotes(){return trackingNotes;} public void setTrackingNotes(String v){trackingNotes=v;}
    public String getCancellationReason(){return cancellationReason;} public void setCancellationReason(String v){cancellationReason=v;}
    public LocalDateTime getDispatchedAt(){return dispatchedAt;} public void setDispatchedAt(LocalDateTime v){dispatchedAt=v;}
    public LocalDateTime getDeliveredAt(){return deliveredAt;} public void setDeliveredAt(LocalDateTime v){deliveredAt=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}

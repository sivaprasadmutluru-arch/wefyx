package com.wefyx.support.offer;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="shop_offers",uniqueConstraints=@UniqueConstraint(columnNames="code"))
public class ShopOffer {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(nullable=false,length=40) public String code;
    @Column(nullable=false,length=160) public String title;
    @Column(nullable=false) public String discountType="PERCENT";
    @Column(nullable=false,precision=14,scale=2) public BigDecimal discountValue;
    @Column(nullable=false,precision=14,scale=2) public BigDecimal minimumSubtotal=BigDecimal.ZERO;
    @Column(precision=14,scale=2) public BigDecimal maximumDiscount;
    @Column(nullable=false) public String mode="BUY";
    @ElementCollection(fetch=FetchType.EAGER)
    @CollectionTable(name="shop_offer_products",joinColumns=@JoinColumn(name="offer_id"))
    @Column(name="product_code")
    public java.util.Set<String> productCodes=new java.util.LinkedHashSet<>();
    public LocalDate startsOn;
    public LocalDate endsOn;
    public boolean active;
}

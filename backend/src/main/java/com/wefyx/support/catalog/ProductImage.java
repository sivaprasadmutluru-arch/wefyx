package com.wefyx.support.catalog;
import jakarta.persistence.*;
@Entity @Table(name="product_images")
public class ProductImage {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @Column(nullable=false) String contentType;
 @Column(nullable=false) String checksum;
 @Lob @Column(nullable=false) byte[] content;
 protected ProductImage(){}
}

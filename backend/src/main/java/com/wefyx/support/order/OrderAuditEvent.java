package com.wefyx.support.order;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="order_audit_events", indexes=@Index(name="idx_order_audit_order_id", columnList="orderId"))
public class OrderAuditEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long orderId;
    @Column(length=180) private String actorEmail;
    @Column(nullable=false,length=80) private String action;
    @Column(length=80) private String fieldName;
    @Column(length=1000) private String previousValue;
    @Column(length=1000) private String nextValue;
    @Column(length=2000) private String note;
    @Column(nullable=false) private LocalDateTime createdAt;
    @PrePersist void create(){if(createdAt==null)createdAt=LocalDateTime.now();}
    public Long getId(){return id;}
    public Long getOrderId(){return orderId;} public void setOrderId(Long v){orderId=v;}
    public String getActorEmail(){return actorEmail;} public void setActorEmail(String v){actorEmail=v;}
    public String getAction(){return action;} public void setAction(String v){action=v;}
    public String getFieldName(){return fieldName;} public void setFieldName(String v){fieldName=v;}
    public String getPreviousValue(){return previousValue;} public void setPreviousValue(String v){previousValue=v;}
    public String getNextValue(){return nextValue;} public void setNextValue(String v){nextValue=v;}
    public String getNote(){return note;} public void setNote(String v){note=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}

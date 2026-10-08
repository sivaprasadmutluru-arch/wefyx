package com.wefyx.support.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wefyx.support.catalog.CatalogProductRepository;
import com.wefyx.support.config.AccessControl;
import com.wefyx.support.config.AccessControl.Role;
import com.wefyx.support.notification.NotificationService;
import com.wefyx.support.profile.CustomerAddressRepository;
import com.wefyx.support.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class CustomerOrderController {
    private final CustomerOrderRepository orders;
    private final CatalogProductRepository products;
    private final CustomerAddressRepository addresses;
    private final UserRepository users;
    private final AccessControl access;
    private final NotificationService notifications;
    private final ObjectMapper json;

    public CustomerOrderController(CustomerOrderRepository orders,CatalogProductRepository products,CustomerAddressRepository addresses,UserRepository users,AccessControl access,NotificationService notifications,ObjectMapper json){
        this.orders=orders;this.products=products;this.addresses=addresses;this.users=users;this.access=access;this.notifications=notifications;this.json=json;
    }

    @GetMapping
    public List<View> list(Authentication auth){
        Role role=access.role(auth);
        List<CustomerOrder> rows;
        if(role==Role.CUSTOMER) rows=orders.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(auth.getName());
        else { access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE); rows=orders.findAll(); }
        return rows.stream().sorted(Comparator.comparing(CustomerOrder::getCreatedAt,Comparator.nullsLast(Comparator.naturalOrder())).reversed()).map(this::view).toList();
    }

    @GetMapping("/{id}")
    public View one(@PathVariable Long id,Authentication auth){var order=find(id);visible(order,auth);return view(order);}

    @GetMapping("/search")
    public PageView search(@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="ALL") String status,@RequestParam(defaultValue="ALL") String mode,@RequestParam(required=false) String from,@RequestParam(required=false) String to,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);
        Specification<CustomerOrder> spec=(root,query,builder)->{
            List<Predicate> predicates=new ArrayList<>();
            if(!blank(q)){
                String like="%"+q.trim().toLowerCase(Locale.ROOT)+"%";
                predicates.add(builder.or(builder.like(builder.lower(root.get("reference")),like),builder.like(builder.lower(root.get("customerEmail")),like),builder.like(builder.lower(root.get("customerName")),like),builder.like(builder.lower(root.get("organization")),like),builder.like(builder.lower(root.get("paymentMethod")),like),builder.like(builder.lower(root.get("itemsJson")),like)));
            }
            if(!"ALL".equalsIgnoreCase(status)) predicates.add(builder.equal(root.get("status"),status.toUpperCase(Locale.ROOT)));
            if(!"ALL".equalsIgnoreCase(mode)) predicates.add(builder.like(builder.upper(root.get("itemsJson")),"%\"MODE\":\""+mode.toUpperCase(Locale.ROOT)+"\"%"));
            if(!blank(from)) predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"),LocalDate.parse(from).atStartOfDay()));
            if(!blank(to)) predicates.add(builder.lessThanOrEqualTo(root.get("createdAt"),LocalDate.parse(to).atTime(23,59,59)));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        int pageSize=Math.max(1,Math.min(100,size));var result=orders.findAll(spec,PageRequest.of(Math.max(0,page),pageSize,Sort.by(Sort.Direction.DESC,"createdAt")));
        var all=orders.findAll(spec);BigDecimal value=all.stream().map(CustomerOrder::getTotal).filter(Objects::nonNull).reduce(BigDecimal.ZERO,BigDecimal::add);
        long active=all.stream().filter(x->!Set.of("COMPLETED","CANCELLED").contains(x.getStatus())).count();
        long completed=all.stream().filter(x->"COMPLETED".equals(x.getStatus())).count();
        long unpaid=all.stream().filter(x->!Set.of("PAID","REFUNDED").contains(value(x.getPaymentStatus(),"PENDING"))).count();
        long paymentLinks=all.stream().filter(x->"PAYMENT_LINK".equals(x.getPaymentMethod())&&!"PAID".equals(x.getPaymentStatus())).count();
        long delayed=all.stream().filter(x->!Set.of("COMPLETED","CANCELLED").contains(x.getStatus())&&x.getCreatedAt()!=null&&x.getCreatedAt().isBefore(LocalDateTime.now().minusDays(2))).count();
        long lowStock=products.findAll().stream().filter(x->x.isActive()&&x.getStockQuantity()!=null&&x.getStockQuantity()<=2).count();
        return new PageView(result.getContent().stream().map(this::view).toList(),result.getTotalElements(),result.getTotalPages(),result.getNumber(),result.getSize(),active,completed,value,unpaid,paymentLinks,lowStock,delayed);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public View create(@RequestBody Create input,Authentication auth){
        access.require(auth,Role.CUSTOMER);
        if(input.items()==null||input.items().isEmpty())bad("Your cart is empty");
        if(input.items().size()>50)bad("An order can contain at most 50 products");
        if(!input.termsAccepted())bad("Accept the rental, refund and delivery terms before checkout");
        var account=users.findByEmailIgnoreCase(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.FORBIDDEN,"Customer account not found"));
        DeliveryAddress delivery=delivery(input.deliveryAddress(),account,auth.getName());
        List<Item> clean=new ArrayList<>(); BigDecimal subtotal=BigDecimal.ZERO; int itemCount=0;
        for(Item requested:input.items()){
            var product=products.findByCodeIgnoreCase(requested.productId()).filter(x->x.isActive()).orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Product is no longer available: "+requested.productId()));
            String mode="BUY".equalsIgnoreCase(requested.mode())?"BUY":"RENT";
            if("BUY".equals(mode)&&!product.isPurchasable())bad(product.getName()+" is not available to purchase");
            if("RENT".equals(mode)&&!product.isRentable())bad(product.getName()+" is not available to rent");
            int quantity=Math.max(1,Math.min(100,requested.quantity()));
            if(product.getStockQuantity()==null||product.getStockQuantity()<quantity)bad("Only "+Math.max(0,product.getStockQuantity()==null?0:product.getStockQuantity())+" units are available for "+product.getName());
            int months="BUY".equals(mode)?1:Math.max(1,Math.min(36,requested.months()));
            BigDecimal unit="BUY".equals(mode)?product.getBuyPrice():product.getRentalPrice();
            BigDecimal line=unit.multiply(bd(quantity)).multiply(bd(months));
            clean.add(new Item(product.getCode(),product.getName(),mode,unit,quantity,months,line));
            product.setStockQuantity(product.getStockQuantity()-quantity);products.save(product);
            subtotal=subtotal.add(line); itemCount+=quantity;
        }
        BigDecimal vat=subtotal.multiply(new BigDecimal("0.05")).setScale(2,RoundingMode.HALF_UP);
        BigDecimal securityDeposit=clean.stream().anyMatch(item->"RENT".equals(item.mode()))?subtotal.multiply(new BigDecimal("0.20")).setScale(2,RoundingMode.HALF_UP):BigDecimal.ZERO;
        String paymentMethod=paymentMethod(input.paymentMethod());
        var order=new CustomerOrder();
        order.setReference(nextReference());order.setCustomerEmail(account.getEmail());order.setCustomerName(account.getName());order.setOrganization(account.getOrganization());
        order.setStatus("PLACED");order.setPaymentMethod(paymentMethod);order.setPaymentStatus("PENDING");order.setDeliveryStatus("PENDING");order.setInvoiceNumber(nextInvoiceReference());order.setCurrency("AED");order.setSubtotal(subtotal);order.setVat(vat);order.setSecurityDeposit(securityDeposit);order.setTotal(subtotal.add(vat));order.setItemCount(itemCount);order.setTermsAccepted(true);order.setTermsAcceptedAt(LocalDateTime.now());
        order.setDeliveryLabel(delivery.label());order.setDeliveryContactName(delivery.contactName());order.setDeliveryPhone(delivery.phone());order.setDeliveryAddress(delivery.addressLine());order.setDeliveryEmirate(delivery.emirate());order.setDeliveryCountry(delivery.country());order.setDeliveryLatitude(delivery.latitude());order.setDeliveryLongitude(delivery.longitude());
        try{order.setItemsJson(json.writeValueAsString(clean));}catch(JsonProcessingException error){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Unable to save order");}
        var saved=orders.save(order);
        notifications.send(account.getEmail(),null,"ORDER_PLACED","Order received",saved.getReference()+" has been received. Payment method: "+paymentMethod.replace('_',' ').toLowerCase(Locale.ROOT)+".");
        return view(saved);
    }

    @PatchMapping("/{id}/status")
    public View status(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String next=String.valueOf(body.get("status")).toUpperCase(Locale.ROOT);
        if(!Set.of("PLACED","CONFIRMED","PROCESSING","DISPATCHED","COMPLETED","CANCELLED").contains(next))bad("Invalid order status");
        order.setStatus(next);
        if("DISPATCHED".equals(next)){order.setDeliveryStatus("DISPATCHED");if(order.getDispatchedAt()==null)order.setDispatchedAt(LocalDateTime.now());}
        if("COMPLETED".equals(next)){order.setDeliveryStatus("DELIVERED");if(order.getDeliveredAt()==null)order.setDeliveredAt(LocalDateTime.now());}
        if("CANCELLED".equals(next)){order.setDeliveryStatus("CANCELLED");order.setCancellationReason(value(body.get("reason"),order.getCancellationReason()));releaseInventory(order);}
        var saved=orders.save(order);
        notifications.send(saved.getCustomerEmail(),null,"ORDER_STATUS","Order status updated",saved.getReference()+" is now "+next.toLowerCase(Locale.ROOT)+".");
        return view(saved);
    }

    @PatchMapping("/{id}/payment")
    public View payment(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String next=String.valueOf(body.get("paymentStatus")).toUpperCase(Locale.ROOT);
        if(!Set.of("UNPAID","PENDING","PAID","PARTIALLY_PAID","REFUNDED","FAILED").contains(next))bad("Invalid payment status");
        order.setPaymentStatus(next);if("PAID".equals(next)&&order.getPaidAt()==null)order.setPaidAt(LocalDateTime.now());if(!"PAID".equals(next)&&!"PARTIALLY_PAID".equals(next))order.setPaidAt(null);
        if(!blank(body.get("invoiceNumber")))order.setInvoiceNumber(body.get("invoiceNumber").trim());if(!blank(body.get("paymentMethod")))order.setPaymentMethod(paymentMethod(body.get("paymentMethod")));
        order.setPaymentReference(cleanText(body.get("paymentReference"),120));order.setPaymentProofUrl(cleanText(body.get("paymentProofUrl"),500));order.setPaymentNotes(cleanText(body.get("paymentNotes"),1000));
        var saved=orders.save(order);
        notifications.send(saved.getCustomerEmail(),null,"ORDER_PAYMENT","Payment status updated",saved.getReference()+" payment is "+next.toLowerCase(Locale.ROOT).replace('_',' ')+".");
        return view(saved);
    }

    @PatchMapping("/{id}/payment-proof")
    public View paymentProof(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        var order=find(id);visible(order,auth);
        String proof=required(body.get("paymentProofUrl"),"Payment proof link");
        order.setPaymentProofUrl(cleanText(proof,500));
        order.setPaymentReference(cleanText(body.get("paymentReference"),120));
        order.setPaymentNotes(cleanText(body.get("paymentNotes"),1000));
        order.setPaymentStatus("PENDING");
        notifications.send(order.getCustomerEmail(),null,"ORDER_PAYMENT_PROOF","Payment proof received",order.getReference()+" payment proof was submitted and is pending review.");
        return view(orders.save(order));
    }

    @PatchMapping("/{id}/fulfillment")
    public View fulfillment(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String next=String.valueOf(body.get("deliveryStatus")).toUpperCase(Locale.ROOT);
        if(!Set.of("PENDING","PACKING","DISPATCHED","OUT_FOR_DELIVERY","DELIVERED","FAILED","CANCELLED").contains(next))bad("Invalid delivery status");
        order.setDeliveryStatus(next);order.setTrackingNotes(cleanText(body.get("trackingNotes"),2000));
        if("DISPATCHED".equals(next)||"OUT_FOR_DELIVERY".equals(next)){if(order.getDispatchedAt()==null)order.setDispatchedAt(LocalDateTime.now());}
        if("DELIVERED".equals(next)){order.setStatus("COMPLETED");if(order.getDeliveredAt()==null)order.setDeliveredAt(LocalDateTime.now());}
        if("CANCELLED".equals(next)){order.setStatus("CANCELLED");order.setCancellationReason(value(body.get("reason"),order.getCancellationReason()));releaseInventory(order);}
        var saved=orders.save(order);
        notifications.send(saved.getCustomerEmail(),null,"ORDER_DELIVERY","Delivery status updated",saved.getReference()+" delivery is "+next.toLowerCase(Locale.ROOT).replace('_',' ')+".");
        return view(saved);
    }

    @PatchMapping("/bulk-status")
    public List<View> bulkStatus(@RequestBody BulkStatus body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);if(body.ids()==null||body.ids().isEmpty())bad("Select at least one order");
        String next=String.valueOf(body.status()).toUpperCase(Locale.ROOT);if(!Set.of("PLACED","CONFIRMED","PROCESSING","DISPATCHED","COMPLETED","CANCELLED").contains(next))bad("Invalid order status");
        return body.ids().stream().map(this::find).map(order->{order.setStatus(next);if("CANCELLED".equals(next)){order.setCancellationReason(value(body.reason(),order.getCancellationReason()));order.setDeliveryStatus("CANCELLED");releaseInventory(order);}return view(orders.save(order));}).toList();
    }

    private CustomerOrder find(Long id){return orders.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found"));}
    private void visible(CustomerOrder order,Authentication auth){Role role=access.role(auth);if(role==Role.CUSTOMER&&!order.getCustomerEmail().equalsIgnoreCase(auth.getName()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"This order is not available to your account");if(role==Role.VENDOR)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Vendors cannot access customer orders");}
    private String nextReference(){long number=orders.count()+1;while(true){String value="ORD-"+LocalDateTime.now().getYear()+"-"+String.format("%05d",number++);if(orders.findByReference(value).isEmpty())return value;}}
    private String nextInvoiceReference(){return "INV-"+LocalDateTime.now().getYear()+"-"+String.format("%05d",orders.count()+1);}
    private DeliveryAddress delivery(DeliveryAddress input,com.wefyx.support.user.SupportUser account,String email){
        if(input!=null&&input.id()!=null){
            var saved=addresses.findByIdAndCustomerEmailIgnoreCase(input.id(),email).orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a valid delivery address"));
            return new DeliveryAddress(saved.getId(),saved.getLabel(),saved.getContactName(),saved.getPhone(),saved.getAddressLine(),saved.getEmirate(),saved.getCountry(),saved.getLatitude(),saved.getLongitude());
        }
        if(input!=null&&!blank(input.addressLine())) return clean(input,account);
        var saved=addresses.findByCustomerEmailIgnoreCaseOrderByDefaultAddressDescUpdatedAtDesc(email).stream().findFirst();
        if(saved.isPresent()){
            var item=saved.get();
            return new DeliveryAddress(item.getId(),item.getLabel(),item.getContactName(),item.getPhone(),item.getAddressLine(),item.getEmirate(),item.getCountry(),item.getLatitude(),item.getLongitude());
        }
        if(!blank(account.getAddress())) return new DeliveryAddress(null,"Primary",account.getName(),account.getPhone(),account.getAddress(),value(account.getEmirate(),"Dubai"),value(account.getCountry(),"United Arab Emirates"),null,null);
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Delivery address is required");
    }
    private DeliveryAddress clean(DeliveryAddress input,com.wefyx.support.user.SupportUser account){
        return new DeliveryAddress(input.id(),value(input.label(),"Delivery address"),value(input.contactName(),account.getName()),value(input.phone(),account.getPhone()),required(input.addressLine(),"Delivery address"),value(input.emirate(),"Dubai"),value(input.country(),"United Arab Emirates"),input.latitude(),input.longitude());
    }
    private void releaseInventory(CustomerOrder order){if(order.isInventoryReleased())return;try{for(Item item:json.readValue(order.getItemsJson(),Item[].class)){products.findByCodeIgnoreCase(item.productId()).ifPresent(product->{product.setStockQuantity((product.getStockQuantity()==null?0:product.getStockQuantity())+Math.max(1,item.quantity()));products.save(product);});}order.setInventoryReleased(true);}catch(JsonProcessingException error){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Unable to release order inventory");}}
    private View view(CustomerOrder order){try{BigDecimal deposit=order.getSecurityDeposit()==null?BigDecimal.ZERO:order.getSecurityDeposit();return new View(order.getId(),order.getReference(),order.getCustomerEmail(),order.getCustomerName(),order.getOrganization(),order.getStatus(),order.getPaymentMethod(),order.getPaymentStatus(),order.getPaymentReference(),order.getPaymentProofUrl(),order.getPaymentNotes(),order.getInvoiceNumber(),order.getPaidAt(),order.getDeliveryStatus(),order.getTrackingNotes(),order.getCancellationReason(),order.getDispatchedAt(),order.getDeliveredAt(),order.getCurrency(),order.getSubtotal(),order.getVat(),deposit,order.getTotal(),order.getTotal().add(deposit),order.getItemCount(),order.isTermsAccepted(),order.getTermsAcceptedAt(),order.isInventoryReleased(),json.readValue(order.getItemsJson(),Item[].class),new DeliveryAddress(null,order.getDeliveryLabel(),order.getDeliveryContactName(),order.getDeliveryPhone(),order.getDeliveryAddress(),order.getDeliveryEmirate(),order.getDeliveryCountry(),order.getDeliveryLatitude(),order.getDeliveryLongitude()),order.getCreatedAt(),order.getUpdatedAt());}catch(JsonProcessingException error){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Order data is unavailable");}}
    private static BigDecimal bd(long value){return BigDecimal.valueOf(value);}
    private static void bad(String message){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    private static boolean blank(String value){return value==null||value.isBlank();}
    private static String value(String value,String fallback){return blank(value)?fallback:value.trim();}
    private static String required(String value,String label){if(blank(value))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,label+" is required");return value.trim();}
    private static String cleanText(String value,int max){if(blank(value))return null;String clean=value.trim();return clean.length()>max?clean.substring(0,max):clean;}
    private static String paymentMethod(String value){String clean=blank(value)?"PAY_ON_DELIVERY":value.trim().toUpperCase(Locale.ROOT);if(!Set.of("CARD","APPLE_PAY","GOOGLE_PAY","SAMSUNG_PAY","PAY_ON_DELIVERY","CASH_ON_DELIVERY","CARD_ON_DELIVERY","BANK_TRANSFER","TABBY","TAMARA","PAYPAL","PAYMENT_LINK").contains(clean))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid payment method");return clean;}

    public record Create(List<Item> items,DeliveryAddress deliveryAddress,String paymentMethod,boolean termsAccepted) {}
    public record BulkStatus(List<Long> ids,String status,String reason) {}
    public record DeliveryAddress(Long id,String label,String contactName,String phone,String addressLine,String emirate,String country,Double latitude,Double longitude) {}
    public record Item(String productId,String name,String mode,BigDecimal unitPrice,int quantity,int months,BigDecimal lineTotal) {}
    public record View(Long id,String reference,String customerEmail,String customerName,String organization,String status,String paymentMethod,String paymentStatus,String paymentReference,String paymentProofUrl,String paymentNotes,String invoiceNumber,LocalDateTime paidAt,String deliveryStatus,String trackingNotes,String cancellationReason,LocalDateTime dispatchedAt,LocalDateTime deliveredAt,String currency,BigDecimal subtotal,BigDecimal vat,BigDecimal securityDeposit,BigDecimal total,BigDecimal amountDue,Integer itemCount,boolean termsAccepted,LocalDateTime termsAcceptedAt,boolean inventoryReleased,Item[] items,DeliveryAddress deliveryAddress,LocalDateTime createdAt,LocalDateTime updatedAt) {}
    public record PageView(List<View> content,long totalElements,int totalPages,int page,int size,long activeOrders,long completedOrders,BigDecimal orderValue,long unpaidOrders,long pendingPaymentLinks,long lowStockProducts,long delayedOrders) {}
}

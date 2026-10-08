package com.wefyx.support.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wefyx.support.catalog.CatalogProductRepository;
import com.wefyx.support.config.AccessControl;
import com.wefyx.support.config.AccessControl.Role;
import com.wefyx.support.notification.NotificationService;
import com.wefyx.support.profile.CustomerAddressRepository;
import com.wefyx.support.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public View create(@RequestBody Create input,Authentication auth){
        access.require(auth,Role.CUSTOMER);
        if(input.items()==null||input.items().isEmpty())bad("Your cart is empty");
        if(input.items().size()>50)bad("An order can contain at most 50 products");
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
        var order=new CustomerOrder();
        order.setReference(nextReference());order.setCustomerEmail(account.getEmail());order.setCustomerName(account.getName());order.setOrganization(account.getOrganization());
        order.setStatus("PLACED");order.setCurrency("AED");order.setSubtotal(subtotal);order.setVat(vat);order.setTotal(subtotal.add(vat));order.setItemCount(itemCount);
        order.setDeliveryLabel(delivery.label());order.setDeliveryContactName(delivery.contactName());order.setDeliveryPhone(delivery.phone());order.setDeliveryAddress(delivery.addressLine());order.setDeliveryEmirate(delivery.emirate());order.setDeliveryCountry(delivery.country());order.setDeliveryLatitude(delivery.latitude());order.setDeliveryLongitude(delivery.longitude());
        try{order.setItemsJson(json.writeValueAsString(clean));}catch(JsonProcessingException error){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Unable to save order");}
        var saved=orders.save(order);
        notifications.send(account.getEmail(),null,"ORDER_PLACED","Order received",saved.getReference()+" has been received and is awaiting confirmation.");
        return view(saved);
    }

    @PatchMapping("/{id}/status")
    public View status(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String next=String.valueOf(body.get("status")).toUpperCase(Locale.ROOT);
        if(!Set.of("PLACED","CONFIRMED","PROCESSING","DISPATCHED","COMPLETED","CANCELLED").contains(next))bad("Invalid order status");
        order.setStatus(next);var saved=orders.save(order);
        notifications.send(saved.getCustomerEmail(),null,"ORDER_STATUS","Order status updated",saved.getReference()+" is now "+next.toLowerCase(Locale.ROOT)+".");
        return view(saved);
    }

    private CustomerOrder find(Long id){return orders.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found"));}
    private void visible(CustomerOrder order,Authentication auth){Role role=access.role(auth);if(role==Role.CUSTOMER&&!order.getCustomerEmail().equalsIgnoreCase(auth.getName()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"This order is not available to your account");if(role==Role.VENDOR)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Vendors cannot access customer orders");}
    private String nextReference(){long number=orders.count()+1;while(true){String value="ORD-"+LocalDateTime.now().getYear()+"-"+String.format("%05d",number++);if(orders.findByReference(value).isEmpty())return value;}}
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
    private View view(CustomerOrder order){try{return new View(order.getId(),order.getReference(),order.getStatus(),order.getCurrency(),order.getSubtotal(),order.getVat(),order.getTotal(),order.getItemCount(),json.readValue(order.getItemsJson(),Item[].class),new DeliveryAddress(null,order.getDeliveryLabel(),order.getDeliveryContactName(),order.getDeliveryPhone(),order.getDeliveryAddress(),order.getDeliveryEmirate(),order.getDeliveryCountry(),order.getDeliveryLatitude(),order.getDeliveryLongitude()),order.getCreatedAt(),order.getUpdatedAt());}catch(JsonProcessingException error){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Order data is unavailable");}}
    private static BigDecimal bd(long value){return BigDecimal.valueOf(value);}
    private static void bad(String message){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    private static boolean blank(String value){return value==null||value.isBlank();}
    private static String value(String value,String fallback){return blank(value)?fallback:value.trim();}
    private static String required(String value,String label){if(blank(value))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,label+" is required");return value.trim();}

    public record Create(List<Item> items,DeliveryAddress deliveryAddress) {}
    public record DeliveryAddress(Long id,String label,String contactName,String phone,String addressLine,String emirate,String country,Double latitude,Double longitude) {}
    public record Item(String productId,String name,String mode,BigDecimal unitPrice,int quantity,int months,BigDecimal lineTotal) {}
    public record View(Long id,String reference,String status,String currency,BigDecimal subtotal,BigDecimal vat,BigDecimal total,Integer itemCount,Item[] items,DeliveryAddress deliveryAddress,LocalDateTime createdAt,LocalDateTime updatedAt) {}
}

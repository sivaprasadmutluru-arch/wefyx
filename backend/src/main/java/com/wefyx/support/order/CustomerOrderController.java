package com.wefyx.support.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wefyx.support.catalog.CatalogProductRepository;
import com.wefyx.support.config.AccessControl;
import com.wefyx.support.config.AccessControl.Role;
import com.wefyx.support.notification.NotificationService;
import com.wefyx.support.profile.CustomerAddressRepository;
import com.wefyx.support.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@RestController
@RequestMapping("/api/orders")
public class CustomerOrderController {
    private final CustomerOrderRepository orders;
    private final CatalogProductRepository products;
    private final CustomerAddressRepository addresses;
    private final UserRepository users;
    private final AccessControl access;
    private final NotificationService notifications;
    private final OrderAuditEventRepository audits;
    private final ObjectMapper json;
    private final com.wefyx.support.offer.ShopOfferService offers;
    private final com.wefyx.support.payment.StripeClient stripe;
    private final com.wefyx.support.booking.BookingService bookingPayments;
    @Value("${wefyx.payments.stripe.secret-key:}") private String stripeSecretKey;
    @Value("${wefyx.payments.stripe.publishable-key:}") private String stripePublishableKey;
    @Value("${wefyx.payments.stripe.webhook-secret:}") private String stripeWebhookSecret;
    @Value("${wefyx.payments.stripe.success-url:http://localhost:5173/account/orders?payment=stripe_success}") private String stripeSuccessUrl;
    @Value("${wefyx.payments.stripe.cancel-url:http://localhost:5173/cart?payment=stripe_cancelled}") private String stripeCancelUrl;

    public CustomerOrderController(CustomerOrderRepository orders,CatalogProductRepository products,CustomerAddressRepository addresses,UserRepository users,AccessControl access,NotificationService notifications,OrderAuditEventRepository audits,ObjectMapper json,com.wefyx.support.offer.ShopOfferService offers,com.wefyx.support.payment.StripeClient stripe,com.wefyx.support.booking.BookingService bookingPayments){
        this.orders=orders;this.products=products;this.addresses=addresses;this.users=users;this.access=access;this.notifications=notifications;this.audits=audits;this.json=json;this.offers=offers;this.stripe=stripe;this.bookingPayments=bookingPayments;
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

    @GetMapping("/{id}/audit")
    public List<AuditView> audit(@PathVariable Long id,Authentication auth){var order=find(id);visible(order,auth);if(access.role(auth)==Role.CUSTOMER)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Order audit is available to staff only");return audits.findByOrderIdOrderByCreatedAtDesc(id).stream().map(AuditView::from).toList();}

    @GetMapping("/{id}/invoice.pdf")
    public ResponseEntity<byte[]> invoice(@PathVariable Long id,Authentication auth){var order=find(id);visible(order,auth);byte[] pdf=invoicePdf(order);return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+value(order.getInvoiceNumber(),order.getReference())+".pdf\"").body(pdf);}

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
        DeliveryAddress billing=input.billingAddress()!=null&&!blank(input.billingAddress().addressLine())?clean(input.billingAddress(),account):delivery;
        List<Item> clean=priceItems(input.items(),true);
        Pricing pricing=pricing(clean,input.promoCode());
        BigDecimal subtotal=pricing.subtotal(),vat=pricing.vat(),securityDeposit=pricing.securityDeposit();
        int itemCount=clean.stream().mapToInt(Item::quantity).sum();
        String paymentMethod=paymentMethod(input.paymentMethod());
        if(pricing.amountDue().signum()>0&&(paymentMethod.equals("CARD")||stripeHostedPayment(paymentMethod))&&!stripe.webhookConfigured())throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Online payments require Stripe webhook setup. Choose an offline payment method or contact support.");
        var order=new CustomerOrder();
        order.setReference(nextReference());order.setCustomerEmail(account.getEmail());order.setCustomerName(account.getName());order.setOrganization(account.getOrganization());
        order.setStatus("PLACED");order.setPaymentMethod(paymentMethod);order.setPaymentStatus("PENDING");order.setDeliveryStatus("PENDING");order.setDepositStatus(securityDeposit.signum()>0?"HELD":"NOT_REQUIRED");order.setInvoiceNumber(nextInvoiceReference());order.setCurrency("AED");order.setSubtotal(subtotal);order.setVat(vat);order.setSecurityDeposit(securityDeposit);order.setTotal(pricing.total());order.setPromoCode(pricing.promoCode());order.setDiscountAmount(pricing.discountAmount());order.setItemCount(itemCount);order.setTermsAccepted(true);order.setTermsAcceptedAt(LocalDateTime.now());order.setTermsVersion(value(input.termsVersion(),"2026-10-08"));
        order.setDeliveryLabel(delivery.label());order.setDeliveryContactName(delivery.contactName());order.setDeliveryPhone(delivery.phone());order.setDeliveryAddress(delivery.addressLine());order.setDeliveryEmirate(delivery.emirate());order.setDeliveryCountry(delivery.country());order.setDeliveryLatitude(delivery.latitude());order.setDeliveryLongitude(delivery.longitude());
        order.setBillingLabel(billing.label());order.setBillingContactName(billing.contactName());order.setBillingPhone(billing.phone());order.setBillingAddress(billing.addressLine());order.setBillingEmirate(billing.emirate());order.setBillingCountry(billing.country());
        try{order.setItemsJson(json.writeValueAsString(clean));}catch(JsonProcessingException error){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Unable to save order");}
        var saved=orders.save(order);
        audit(saved,auth,"ORDER_CREATED","status",null,"PLACED","Customer checkout");
        String checkoutUrl=null, paymentClientSecret=null, stripePublishableKey=null;
        if(pricing.amountDue().signum()==0){saved.setPaymentStatus("PAID");saved.setPaidAt(LocalDateTime.now());saved=orders.save(saved);}
        else if("CARD".equals(paymentMethod)){
            var intent=stripePaymentIntent(saved);
            paymentClientSecret=intent.clientSecret();
            stripePublishableKey=stripePublishableKey();
            saved.setPaymentReference(intent.paymentIntentId());
            saved.setPaymentNotes("Stripe card payment created. Awaiting customer confirmation.");
            saved=orders.save(saved);
            audit(saved,auth,"STRIPE_PAYMENT_INTENT_CREATED","paymentReference",null,intent.paymentIntentId(),"Stripe Elements card checkout");
        }else if(stripeHostedPayment(paymentMethod)){
            var session=stripeCheckout(saved);
            checkoutUrl=session.url();
            saved.setPaymentReference(session.sessionId());
            saved.setPaymentNotes("Stripe Checkout session created. Awaiting customer payment.");
            saved=orders.save(saved);
            audit(saved,auth,"STRIPE_CHECKOUT_SESSION_CREATED","paymentReference",null,session.sessionId(),"Stripe hosted checkout");
        }
        notifications.send(account.getEmail(),null,"ORDER_PLACED","Order received",saved.getReference()+" has been received. Payment method: "+paymentMethod.replace('_',' ').toLowerCase(Locale.ROOT)+".");
        return view(saved,checkoutUrl,paymentClientSecret,stripePublishableKey);
    }

    @PostMapping("/preview")
    public Pricing preview(@RequestBody Create input){return pricing(priceItems(input.items(),false),input.promoCode());}

    private List<Item> priceItems(List<Item> requestedItems,boolean reserve){
        if(requestedItems==null||requestedItems.isEmpty())bad("Select at least one cart item");
        if(requestedItems.size()>50)bad("An order can contain at most 50 products");
        List<Item> clean=new ArrayList<>();
        for(Item requested:requestedItems){
            var product=products.findByCodeIgnoreCase(requested.productId()).filter(x->x.isActive()).orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Product is no longer available: "+requested.productId()));
            String mode="BUY".equalsIgnoreCase(requested.mode())?"BUY":"RENT";
            if("BUY".equals(mode)&&!product.isPurchasable())bad(product.getName()+" is not available to purchase");
            if("RENT".equals(mode)&&!product.isRentable())bad(product.getName()+" is not available to rent");
            int quantity=Math.max(1,Math.min(100,requested.quantity()));
            if(product.getStockQuantity()==null||product.getStockQuantity()<quantity)bad("Only "+Math.max(0,product.getStockQuantity()==null?0:product.getStockQuantity())+" units are available for "+product.getName());
            String rentalPeriod="BUY".equals(mode)?null:rentalPeriod(requested.rentalPeriod());
            int duration="BUY".equals(mode)?1:rentalDuration(requested.rentalDuration()>0?requested.rentalDuration():requested.months(),rentalPeriod);
            int months="BUY".equals(mode)?1:("MONTH".equals(rentalPeriod)?duration:1);
            BigDecimal unit="BUY".equals(mode)?product.getBuyPrice():rentalUnit(product.getRentalPrice(),rentalPeriod);
            BigDecimal line=unit.multiply(bd(quantity)).multiply(bd(duration));
            clean.add(new Item(product.getCode(),product.getName(),mode,unit,quantity,months,line,rentalPeriod,duration,cleanText(requested.startDate(),20)));
            if(reserve){product.setStockQuantity(product.getStockQuantity()-quantity);products.save(product);}
        }
        return clean;
    }
    private Pricing pricing(List<Item> items,String code){
        BigDecimal subtotal=items.stream().map(Item::lineTotal).reduce(BigDecimal.ZERO,BigDecimal::add).setScale(2,RoundingMode.HALF_UP);
        var discount=offers.apply(code,items.stream().map(item->new com.wefyx.support.offer.ShopOfferService.Line(item.productId(),item.mode(),item.lineTotal())).toList());
        BigDecimal taxable=subtotal.subtract(discount.amount());
        BigDecimal vat=taxable.multiply(new BigDecimal("0.05")).setScale(2,RoundingMode.HALF_UP);
        BigDecimal deposit=items.stream().filter(item->"RENT".equals(item.mode())).map(Item::lineTotal).reduce(BigDecimal.ZERO,BigDecimal::add).multiply(new BigDecimal("0.20")).setScale(2,RoundingMode.HALF_UP);
        return new Pricing(subtotal,discount.code(),discount.amount(),vat,deposit,taxable.add(vat),taxable.add(vat).add(deposit));
    }
    public record Pricing(BigDecimal subtotal,String promoCode,BigDecimal discountAmount,BigDecimal vat,BigDecimal securityDeposit,BigDecimal total,BigDecimal amountDue){}

    @PostMapping("/stripe/webhook") @Transactional
    public ResponseEntity<Map<String,String>> stripeWebhook(@RequestBody String payload,@RequestHeader(value="Stripe-Signature",required=false)String signature){
        var event=stripe.event(payload,signature);String type=event.path("type").asText();
        if(!Set.of("checkout.session.completed","checkout.session.async_payment_succeeded","payment_intent.succeeded","checkout.session.expired","payment_intent.canceled").contains(type))return ResponseEntity.ok(Map.of("status","ignored"));
        var object=event.path("data").path("object");
        if(object.path("metadata").hasNonNull("bookingId")){bookingPayments.webhook(event);return ResponseEntity.ok(Map.of("status","ok"));}
        boolean session=type.startsWith("checkout.");
        if(Set.of("checkout.session.expired","payment_intent.canceled").contains(type)){
            var found=orders.findByPaymentReference(object.path("id").asText());if(found.isPresent()){var order=orders.lockById(found.get().getId()).orElseThrow();if(!"PAID".equals(order.getPaymentStatus())){order.setPaymentStatus("CANCELLED");order.setStatus("CANCELLED");order.setDeliveryStatus("CANCELLED");releaseInventory(order);orders.save(order);}}return ResponseEntity.ok(Map.of("status","ok"));
        }
        if(session&&!"paid".equals(object.path("payment_status").asText()))return ResponseEntity.ok(Map.of("status","unpaid"));
        if(!session&&!"succeeded".equals(object.path("status").asText()))return ResponseEntity.ok(Map.of("status","unpaid"));
        var found=orders.findByPaymentReference(object.path("id").asText());if(found.isEmpty())return ResponseEntity.ok(Map.of("status","order_not_found"));
        var order=orders.lockById(found.get().getId()).orElseThrow();verifyAmount(order,object,session?"amount_total":"amount_received");markStripePaid(order);return ResponseEntity.ok(Map.of("status","ok"));
    }
    @PostMapping("/{id}/stripe/confirm") @Transactional
    public View confirmStripePayment(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        var order=orders.lockById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found"));visible(order,auth);
        String intentId=required(body.get("paymentIntentId"),"Payment intent");if(!intentId.equals(order.getPaymentReference()))bad("Payment does not match this order");
        var intent=stripe.get("/payment_intents/"+encode(intentId));if(!"succeeded".equals(intent.path("status").asText()))bad("Stripe payment has not succeeded.");
        verifyAmount(order,intent,"amount_received");markStripePaid(order);return view(order);
    }
    private void verifyAmount(CustomerOrder order,com.fasterxml.jackson.databind.JsonNode object,String amountField){
        var due=order.getTotal().add(order.getSecurityDeposit()==null?BigDecimal.ZERO:order.getSecurityDeposit());
        if(!"aed".equals(object.path("currency").asText())||!object.path(amountField).isIntegralNumber()||object.path(amountField).asLong()!=due.movePointRight(2).longValueExact()||!String.valueOf(order.getId()).equals(object.path("metadata").path("orderId").asText()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Stripe amount, currency or order does not match.");
    }
    private void markStripePaid(CustomerOrder order){if("PAID".equals(order.getPaymentStatus()))return;String previous=order.getPaymentStatus();order.setPaymentStatus("PAID");order.setPaidAt(LocalDateTime.now());order.setPaymentNotes("Stripe payment verified: "+order.getPaymentReference());orders.save(order);audit(order,null,"STRIPE_PAYMENT_CONFIRMED","paymentStatus",previous,"PAID",order.getPaymentReference());notifications.send(order.getCustomerEmail(),null,"ORDER_PAYMENT","Payment received",order.getReference()+" payment was confirmed.");}

    @PatchMapping("/{id}/status")
    public View status(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String next=String.valueOf(body.get("status")).toUpperCase(Locale.ROOT);
        if(!Set.of("PLACED","CONFIRMED","PROCESSING","DISPATCHED","COMPLETED","CANCELLED").contains(next))bad("Invalid order status");
        String previous=order.getStatus();order.setStatus(next);
        if("DISPATCHED".equals(next)){order.setDeliveryStatus("DISPATCHED");if(order.getDispatchedAt()==null)order.setDispatchedAt(LocalDateTime.now());}
        if("COMPLETED".equals(next)){order.setDeliveryStatus("DELIVERED");if(order.getDeliveredAt()==null)order.setDeliveredAt(LocalDateTime.now());}
        if("CANCELLED".equals(next)){order.setDeliveryStatus("CANCELLED");order.setCancellationReason(value(body.get("reason"),order.getCancellationReason()));releaseInventory(order);}
        var saved=orders.save(order);
        audit(saved,auth,"STATUS_CHANGED","status",previous,next,value(body.get("reason"),""));
        notifications.send(saved.getCustomerEmail(),null,"ORDER_STATUS","Order status updated",saved.getReference()+" is now "+next.toLowerCase(Locale.ROOT)+".");
        return view(saved);
    }

    @PatchMapping("/{id}/payment")
    public View payment(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String next=String.valueOf(body.get("paymentStatus")).toUpperCase(Locale.ROOT);
        if(!Set.of("UNPAID","PENDING","PAID","PARTIALLY_PAID","REFUNDED","FAILED").contains(next))bad("Invalid payment status");
        String previous=order.getPaymentStatus();order.setPaymentStatus(next);if("PAID".equals(next)&&order.getPaidAt()==null)order.setPaidAt(LocalDateTime.now());if(!"PAID".equals(next)&&!"PARTIALLY_PAID".equals(next))order.setPaidAt(null);
        if(!blank(body.get("invoiceNumber")))order.setInvoiceNumber(body.get("invoiceNumber").trim());if(!blank(body.get("paymentMethod")))order.setPaymentMethod(paymentMethod(body.get("paymentMethod")));
        order.setPaymentReference(cleanText(body.get("paymentReference"),120));order.setPaymentProofUrl(cleanText(body.get("paymentProofUrl"),500));order.setPaymentNotes(cleanText(body.get("paymentNotes"),1000));
        var saved=orders.save(order);
        audit(saved,auth,"PAYMENT_CHANGED","paymentStatus",previous,next,order.getPaymentReference());
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
        audit(order,auth,"PAYMENT_PROOF_SUBMITTED","paymentProofUrl",null,proof,order.getPaymentReference());
        notifications.send(order.getCustomerEmail(),null,"ORDER_PAYMENT_PROOF","Payment proof received",order.getReference()+" payment proof was submitted and is pending review.");
        return view(orders.save(order));
    }

    @PatchMapping("/{id}/cancel-request")
    public View cancelRequest(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        var order=find(id);visible(order,auth);if(access.role(auth)!=Role.CUSTOMER)bad("Only customers can request cancellation from this endpoint");
        if(Set.of("COMPLETED","CANCELLED").contains(order.getStatus()))bad("This order can no longer be cancelled");
        order.setCancellationRequestStatus("REQUESTED");order.setCancellationRequestedAt(LocalDateTime.now());order.setCancellationRequestReason(cleanText(required(body.get("reason"),"Cancellation reason"),1000));
        var saved=orders.save(order);audit(saved,auth,"CANCELLATION_REQUESTED","cancellationRequestStatus",null,"REQUESTED",order.getCancellationRequestReason());
        notifications.send(saved.getCustomerEmail(),null,"ORDER_CANCELLATION","Cancellation requested",saved.getReference()+" cancellation request is under review.");
        return view(saved);
    }

    @PatchMapping("/{id}/cancel-decision")
    public View cancelDecision(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String decision=String.valueOf(body.get("decision")).toUpperCase(Locale.ROOT);
        if(!Set.of("APPROVED","REJECTED").contains(decision))bad("Invalid cancellation decision");
        String previous=order.getCancellationRequestStatus();order.setCancellationRequestStatus(decision);order.setCancellationReason(value(body.get("reason"),order.getCancellationRequestReason()));
        if("APPROVED".equals(decision)){order.setStatus("CANCELLED");order.setDeliveryStatus("CANCELLED");releaseInventory(order);}
        var saved=orders.save(order);audit(saved,auth,"CANCELLATION_"+decision,"cancellationRequestStatus",previous,decision,order.getCancellationReason());
        notifications.send(saved.getCustomerEmail(),null,"ORDER_CANCELLATION","Cancellation "+decision.toLowerCase(Locale.ROOT),saved.getReference()+" cancellation was "+decision.toLowerCase(Locale.ROOT)+".");
        return view(saved);
    }

    @PatchMapping("/{id}/deposit")
    public View deposit(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String next=String.valueOf(body.get("depositStatus")).toUpperCase(Locale.ROOT);
        if(!Set.of("NOT_REQUIRED","HELD","PARTIALLY_REFUNDED","REFUNDED","DEDUCTED").contains(next))bad("Invalid deposit status");
        String previous=order.getDepositStatus();order.setDepositStatus(next);order.setDepositRefundReference(cleanText(body.get("depositRefundReference"),120));order.setDepositDeductionReason(cleanText(body.get("depositDeductionReason"),1000));
        if(Set.of("REFUNDED","PARTIALLY_REFUNDED","DEDUCTED").contains(next)&&order.getDepositRefundedAt()==null)order.setDepositRefundedAt(LocalDateTime.now());
        var saved=orders.save(order);audit(saved,auth,"DEPOSIT_CHANGED","depositStatus",previous,next,order.getDepositRefundReference());
        notifications.send(saved.getCustomerEmail(),null,"ORDER_DEPOSIT","Deposit status updated",saved.getReference()+" deposit is "+next.toLowerCase(Locale.ROOT).replace('_',' ')+".");
        return view(saved);
    }

    @PatchMapping("/{id}/fulfillment")
    public View fulfillment(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);var order=find(id);String next=String.valueOf(body.get("deliveryStatus")).toUpperCase(Locale.ROOT);
        if(!Set.of("PENDING","PACKING","DISPATCHED","OUT_FOR_DELIVERY","DELIVERED","FAILED","CANCELLED").contains(next))bad("Invalid delivery status");
        String previous=order.getDeliveryStatus();order.setDeliveryStatus(next);order.setTrackingNotes(cleanText(body.get("trackingNotes"),2000));
        if("DISPATCHED".equals(next)||"OUT_FOR_DELIVERY".equals(next)){if(order.getDispatchedAt()==null)order.setDispatchedAt(LocalDateTime.now());}
        if("DELIVERED".equals(next)){order.setStatus("COMPLETED");if(order.getDeliveredAt()==null)order.setDeliveredAt(LocalDateTime.now());}
        if("CANCELLED".equals(next)){order.setStatus("CANCELLED");order.setCancellationReason(value(body.get("reason"),order.getCancellationReason()));releaseInventory(order);}
        var saved=orders.save(order);
        audit(saved,auth,"DELIVERY_CHANGED","deliveryStatus",previous,next,order.getTrackingNotes());
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
    private void audit(CustomerOrder order,Authentication auth,String action,String field,String previous,String next,String note){OrderAuditEvent event=new OrderAuditEvent();event.setOrderId(order.getId());event.setActorEmail(auth==null?null:auth.getName());event.setAction(action);event.setFieldName(field);event.setPreviousValue(cleanText(previous,1000));event.setNextValue(cleanText(next,1000));event.setNote(cleanText(note,2000));audits.save(event);}
    private StripeCheckout stripeCheckout(CustomerOrder order){
        var amount=order.getTotal().add(order.getSecurityDeposit()==null?BigDecimal.ZERO:order.getSecurityDeposit());var form=new LinkedHashMap<String,String>();
        form.put("mode","payment");form.put("payment_method_types[0]","card");form.put("customer_email",order.getCustomerEmail());form.put("client_reference_id",order.getReference());form.put("metadata[orderId]",String.valueOf(order.getId()));form.put("success_url",stripeSuccessUrl+(stripeSuccessUrl.contains("?")?"&":"?")+"order="+encode(order.getReference()));form.put("cancel_url",stripeCancelUrl);form.put("line_items[0][quantity]","1");form.put("line_items[0][price_data][currency]","aed");form.put("line_items[0][price_data][unit_amount]",amount.movePointRight(2).toBigIntegerExact().toString());form.put("line_items[0][price_data][product_data][name]","Wefyx order "+order.getReference());
        var response=stripe.post("/checkout/sessions",form,"order-session-"+order.getId());return new StripeCheckout(response.path("id").asText(),response.path("url").asText());
    }
    private StripePaymentIntent stripePaymentIntent(CustomerOrder order){
        var amount=order.getTotal().add(order.getSecurityDeposit()==null?BigDecimal.ZERO:order.getSecurityDeposit());var form=new LinkedHashMap<String,String>();form.put("amount",amount.movePointRight(2).toBigIntegerExact().toString());form.put("currency","aed");form.put("receipt_email",order.getCustomerEmail());form.put("description","Wefyx order "+order.getReference());form.put("metadata[orderId]",String.valueOf(order.getId()));form.put("payment_method_types[0]","card");var response=stripe.post("/payment_intents",form,"order-intent-"+order.getId());return new StripePaymentIntent(response.path("id").asText(),response.path("client_secret").asText(),response.path("status").asText());
    }
    private static String encode(String value){return com.wefyx.support.payment.StripeClient.encode(value);}
    private String stripePublishableKey(){return stripePublishableKey;}
    private byte[] invoicePdf(CustomerOrder order){String text="Wefyx.pro Invoice\n"+value(order.getInvoiceNumber(),order.getReference())+"\nOrder: "+order.getReference()+"\nCustomer: "+order.getCustomerName()+"\nSubtotal: AED "+order.getSubtotal()+"\nDiscount ("+value(order.getPromoCode(),"none")+"): AED "+order.getDiscountAmount()+"\nVAT: AED "+order.getVat()+"\nRefundable deposit: AED "+value(String.valueOf(order.getSecurityDeposit()),"0")+"\nAmount due: AED "+order.getTotal().add(order.getSecurityDeposit()==null?BigDecimal.ZERO:order.getSecurityDeposit())+"\nPayment: "+value(order.getPaymentStatus(),"PENDING");String stream="BT /F1 14 Tf 50 780 Td ("+pdfText(text)+") Tj ET";String pdf="%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length "+stream.length()+">>stream\n"+stream+"\nendstream endobj\nxref\n0 6\n0000000000 65535 f \ntrailer<</Root 1 0 R/Size 6>>\nstartxref\n0\n%%EOF";return pdf.getBytes(java.nio.charset.StandardCharsets.US_ASCII);}
    private static String pdfText(String value){return value.replace("\\","\\\\").replace("(","\\(").replace(")","\\)").replace("\n","\\n");}
    private View view(CustomerOrder order){return view(order,null,null,null);}
    private View view(CustomerOrder order,String checkoutUrl){return view(order,checkoutUrl,null,null);}
    private View view(CustomerOrder order,String checkoutUrl,String paymentClientSecret,String stripePublishableKey){try{BigDecimal deposit=order.getSecurityDeposit()==null?BigDecimal.ZERO:order.getSecurityDeposit();return new View(order.getId(),order.getReference(),order.getCustomerEmail(),order.getCustomerName(),order.getOrganization(),order.getStatus(),order.getPaymentMethod(),order.getPaymentStatus(),order.getPaymentReference(),order.getPaymentProofUrl(),order.getPaymentNotes(),order.getInvoiceNumber(),order.getPaidAt(),order.getDeliveryStatus(),order.getTrackingNotes(),order.getCancellationReason(),order.getCancellationRequestStatus(),order.getCancellationRequestedAt(),order.getCancellationRequestReason(),order.getDepositStatus(),order.getDepositRefundReference(),order.getDepositDeductionReason(),order.getDepositRefundedAt(),order.getDispatchedAt(),order.getDeliveredAt(),order.getCurrency(),order.getSubtotal(),order.getVat(),deposit,order.getTotal(),order.getTotal().add(deposit),order.getItemCount(),order.isTermsAccepted(),order.getTermsAcceptedAt(),order.getTermsVersion(),order.isInventoryReleased(),json.readValue(order.getItemsJson(),Item[].class),new DeliveryAddress(null,order.getDeliveryLabel(),order.getDeliveryContactName(),order.getDeliveryPhone(),order.getDeliveryAddress(),order.getDeliveryEmirate(),order.getDeliveryCountry(),order.getDeliveryLatitude(),order.getDeliveryLongitude()),new DeliveryAddress(null,order.getBillingLabel(),order.getBillingContactName(),order.getBillingPhone(),order.getBillingAddress(),order.getBillingEmirate(),order.getBillingCountry(),null,null),order.getCreatedAt(),order.getUpdatedAt(),checkoutUrl,paymentClientSecret,stripePublishableKey,order.getPromoCode(),order.getDiscountAmount());}catch(JsonProcessingException error){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Order data is unavailable");}}
    private static BigDecimal bd(long value){return BigDecimal.valueOf(value);}
    private static void bad(String message){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    private static boolean blank(String value){return value==null||value.isBlank();}
    private static String value(String value,String fallback){return blank(value)?fallback:value.trim();}
    private static String required(String value,String label){if(blank(value))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,label+" is required");return value.trim();}
    private static String cleanText(String value,int max){if(blank(value))return null;String clean=value.trim();return clean.length()>max?clean.substring(0,max):clean;}
    private static String paymentMethod(String value){String clean=blank(value)?"PAY_ON_DELIVERY":value.trim().toUpperCase(Locale.ROOT);if(!Set.of("CARD","APPLE_PAY","GOOGLE_PAY","PAY_ON_DELIVERY","CASH_ON_DELIVERY","CARD_ON_DELIVERY","BANK_TRANSFER","PAYMENT_LINK").contains(clean))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid payment method");return clean;}
    private static boolean stripeHostedPayment(String value){return Set.of("APPLE_PAY","GOOGLE_PAY","PAYMENT_LINK").contains(value);}
    private static String rentalPeriod(String value){String clean=blank(value)?"MONTH":value.trim().toUpperCase(Locale.ROOT);if(!Set.of("DAY","WEEK","MONTH").contains(clean))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid rental period");return clean;}
    private static int rentalDuration(int value,String period){int max="MONTH".equals(period)?36:"WEEK".equals(period)?52:365;return Math.max(1,Math.min(max,value));}
    private static BigDecimal rentalUnit(BigDecimal monthly,String period){if(monthly==null)monthly=BigDecimal.ZERO;if("DAY".equals(period))return monthly.divide(new BigDecimal("30"),2,RoundingMode.CEILING);if("WEEK".equals(period))return monthly.divide(new BigDecimal("4"),2,RoundingMode.CEILING);return monthly;}

    public record Create(List<Item> items,DeliveryAddress deliveryAddress,DeliveryAddress billingAddress,String paymentMethod,boolean termsAccepted,String termsVersion,String promoCode) {}
    public record StripeCheckout(String sessionId,String url) {}
    public record StripePaymentIntent(String paymentIntentId,String clientSecret,String status) {}
    public record BulkStatus(List<Long> ids,String status,String reason) {}
    public record DeliveryAddress(Long id,String label,String contactName,String phone,String addressLine,String emirate,String country,Double latitude,Double longitude) {}
    public record Item(String productId,String name,String mode,BigDecimal unitPrice,int quantity,int months,BigDecimal lineTotal,String rentalPeriod,int rentalDuration,String startDate) {}
    public record View(Long id,String reference,String customerEmail,String customerName,String organization,String status,String paymentMethod,String paymentStatus,String paymentReference,String paymentProofUrl,String paymentNotes,String invoiceNumber,LocalDateTime paidAt,String deliveryStatus,String trackingNotes,String cancellationReason,String cancellationRequestStatus,LocalDateTime cancellationRequestedAt,String cancellationRequestReason,String depositStatus,String depositRefundReference,String depositDeductionReason,LocalDateTime depositRefundedAt,LocalDateTime dispatchedAt,LocalDateTime deliveredAt,String currency,BigDecimal subtotal,BigDecimal vat,BigDecimal securityDeposit,BigDecimal total,BigDecimal amountDue,Integer itemCount,boolean termsAccepted,LocalDateTime termsAcceptedAt,String termsVersion,boolean inventoryReleased,Item[] items,DeliveryAddress deliveryAddress,DeliveryAddress billingAddress,LocalDateTime createdAt,LocalDateTime updatedAt,String checkoutUrl,String paymentClientSecret,String stripePublishableKey,String promoCode,BigDecimal discountAmount) {}
    public record PageView(List<View> content,long totalElements,int totalPages,int page,int size,long activeOrders,long completedOrders,BigDecimal orderValue,long unpaidOrders,long pendingPaymentLinks,long lowStockProducts,long delayedOrders) {}
    public record AuditView(Long id,String actorEmail,String action,String fieldName,String previousValue,String nextValue,String note,LocalDateTime createdAt){static AuditView from(OrderAuditEvent e){return new AuditView(e.getId(),e.getActorEmail(),e.getAction(),e.getFieldName(),e.getPreviousValue(),e.getNextValue(),e.getNote(),e.getCreatedAt());}}
}

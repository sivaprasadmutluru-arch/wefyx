package com.wefyx.support.booking;

import com.wefyx.support.config.AccessControl;
import com.wefyx.support.config.AccessControl.Role;
import com.wefyx.support.notification.*;
import com.wefyx.support.user.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.IntStream;
import static com.wefyx.support.booking.Booking.Status.*;

@Service
@Transactional
public class BookingService {
    static final ZoneId ZONE = ZoneId.of("Asia/Dubai");
    private final BookingRepository bookings;
    private final UserRepository users;
    private final AccessControl access;
    private final AccountNotificationRepository notifications;
    private final ServiceDefinitionRepository definitions;
    private final com.wefyx.support.payment.StripeClient stripe;
    private final String webUrl;
    public BookingService(BookingRepository bookings,UserRepository users,AccessControl access,AccountNotificationRepository notifications,ServiceDefinitionRepository definitions,com.wefyx.support.payment.StripeClient stripe,@Value("${wefyx.web-url:http://127.0.0.1:5174}")String webUrl){this.bookings=bookings;this.users=users;this.access=access;this.notifications=notifications;this.definitions=definitions;this.stripe=stripe;this.webUrl=webUrl.replaceAll("/+$","");}
    @Transactional(readOnly=true)
    public Map<String,Object> catalog(){
        var services=definitions.findByActiveTrueOrderByNameAsc().stream().map(service->Map.of("code",service.code,"name",service.name,"description",service.description,"basePrice",service.basePrice,"vatPercent",service.vatPercent,"vat",service.vat(),"amount",service.total(),"advanceDays",service.advanceDays)).toList();
        boolean available=stripe.configured()&&stripe.webhookConfigured();
        return Map.of("services",services,"currency","AED","timezone",ZONE.getId(),"checkoutAvailable",available,"checkoutMessage",available?"Pay securely with Stripe. Appointment confirmation follows verified payment.":"Online payment is awaiting payment-provider setup. You can save a request for support follow-up.");
    }
    private ServiceDefinition definition(String code){return definitions.findById(code).filter(service->service.active).orElseThrow(()->error(HttpStatus.BAD_REQUEST,"This service is not available."));}
    public List<Map<String,Object>> availability(LocalDate date,String supportType){
        var service=definition(supportType);validateDate(date,service);releaseExpiredHolds(date);
        if(!Arrays.asList(service.workingDays.split(",")).contains(date.getDayOfWeek().name()))return List.of();
        var reserved=bookings.findByDateAndOccupiedSlotIsNotNull(date);var slots=new ArrayList<Map<String,Object>>();
        for(int minute=service.openingHour*60;minute+service.slotMinutes<=service.closingHour*60;minute+=service.slotMinutes){
            String time=LocalTime.of(minute/60,minute%60).toString();String end=minute+service.slotMinutes==1440?"24:00":LocalTime.of((minute+service.slotMinutes)/60,(minute+service.slotMinutes)%60).toString();
            boolean available=reserved.stream().noneMatch(b->overlaps(time,service.slotMinutes,b.time,b.slotMinutes))&&date.atTime(LocalTime.parse(time)).atZone(ZONE).toInstant().isAfter(Instant.now());
            slots.add(Map.of("time",time,"endTime",end,"available",available));
        }
        return slots;
    }
    public List<Map<String,Object>> availability(LocalDate date){return availability(date,"SITE_VISIT");}
    private static boolean overlaps(String time,int duration,String other,int otherDuration){int start=LocalTime.parse(time).toSecondOfDay()/60,otherStart=LocalTime.parse(other).toSecondOfDay()/60;return start<otherStart+(otherDuration>0?otherDuration:60)&&otherStart<start+duration;}
    public BookingDtos.View create(BookingDtos.Create input, Authentication auth) {
        access.require(auth,Role.CUSTOMER);
        var existing=bookings.findByRequestKey(input.requestKey());
        if(existing.isPresent()) { requireVisible(existing.get(),auth); return BookingDtos.View.from(existing.get()); }
        var service=definition(input.supportType());validateSlot(input.date(),input.time(),input.supportType());
        Booking b=new Booking();
        b.reference="WFX-"+UUID.randomUUID().toString().substring(0,12).toUpperCase(Locale.ROOT);
        b.requestKey=input.requestKey(); b.customerEmail=auth.getName(); b.supportType=input.supportType();
        b.company=input.company().trim(); b.contactName=input.contactName().trim();
        b.contactEmail=input.contactEmail().trim(); b.phone=input.phone().trim(); b.category=input.category();
        b.subject=input.subject().trim(); b.description=input.description().trim(); b.date=input.date(); b.time=input.time();
        b.address=input.address().trim(); b.emirate=input.emirate().trim(); b.serviceName=service.name;b.baseAmount=service.basePrice;b.vatAmount=service.vat();b.amount=service.total();b.slotMinutes=service.slotMinutes;
        b.status=AWAITING_PAYMENT; b.createdAt=Instant.now();
        return BookingDtos.View.from(bookings.saveAndFlush(b));
    }
    @Transactional(readOnly = true)
    public List<BookingDtos.View> list(Authentication auth) {
        var role=access.require(auth,Role.CUSTOMER,Role.EMPLOYEE,Role.SUPER_ADMIN);
        var rows=switch(role) {
            case CUSTOMER -> bookings.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(auth.getName());
            case EMPLOYEE -> bookings.findByEmployeeEmailIgnoreCaseOrderByCreatedAtDesc(auth.getName());
            default -> bookings.findAllByOrderByCreatedAtDesc();
        };
        return rows.stream().map(BookingDtos.View::from).toList();
    }
    @Transactional(readOnly = true)
    public BookingDtos.View get(Long id,Authentication auth) { return BookingDtos.View.from(visible(id,auth)); }
    Booking visible(Long id,Authentication auth) {
        Booking b=bookings.findById(id).orElseThrow(()->error(HttpStatus.NOT_FOUND,"Booking not found"));
        requireVisible(b,auth); return b;
    }
    void requireVisible(Booking b,Authentication auth) {
        Role role=access.role(auth);
        if(role==Role.SUPER_ADMIN || role==Role.CUSTOMER && auth.getName().equalsIgnoreCase(b.customerEmail)
            || role==Role.EMPLOYEE && auth.getName().equalsIgnoreCase(b.employeeEmail)) return;
        throw error(HttpStatus.FORBIDDEN,"This booking is not assigned to your account");
    }
    private Booking locked(Long id,Authentication auth) {
        Booking b=bookings.lockById(id).orElseThrow(()->error(HttpStatus.NOT_FOUND,"Booking not found"));
        requireVisible(b,auth); return b;
    }
    public BookingDtos.View assign(Long id,String employeeEmail,Authentication auth) {
        access.require(auth,Role.SUPER_ADMIN); Booking b=locked(id,auth);
        requireState(b,CONFIRMED,ASSIGNED);
        var employee=users.findByEmailIgnoreCase(employeeEmail).filter(u->u.getStatus()==UserStatus.ACTIVE
            && u.getRole()!=null && u.getRole().toUpperCase(Locale.ROOT).contains("EMPLOYEE"))
            .orElseThrow(()->error(HttpStatus.BAD_REQUEST,"Choose an active employee"));
        b.employeeEmail=employee.getEmail();b.employeeName=employee.getName();b.status=ASSIGNED;b.assignedAt=Instant.now();
        notify(b,b.employeeEmail,"New assigned ticket",b.subject,"/service-tasks/"+b.id);
        notify(b,b.customerEmail,"Engineer assigned",b.employeeName+" has been assigned to your service.","/my-tickets/"+b.id);
        return BookingDtos.View.from(b);
    }
    public BookingDtos.View start(Long id,Authentication auth) {
        access.require(auth,Role.EMPLOYEE,Role.SUPER_ADMIN); Booking b=locked(id,auth); requireState(b,ASSIGNED);
        b.status=IN_PROGRESS;b.startedAt=Instant.now();
        notify(b,b.customerEmail,"Service in progress","Your engineer has started the service.","/my-tickets/"+b.id);
        return BookingDtos.View.from(b);
    }
    public BookingDtos.View report(Long id,BookingDtos.Report report,Authentication auth) {
        access.require(auth,Role.EMPLOYEE,Role.SUPER_ADMIN); Booking b=locked(id,auth);requireState(b,IN_PROGRESS);
        if(report.actionsTaken().stream().anyMatch(s->s.contains("\n")||s.contains("\r")))
            throw error(HttpStatus.BAD_REQUEST,"Each action must be a single line");
        b.workSummary=report.workSummary().trim(); b.actionsTaken=String.join("\n",report.actionsTaken());
        b.status=COMPLETED;b.completedAt=Instant.now();
        notify(b,b.customerEmail,"Support Update","Your support request "+b.reference+" has been completed. View the service report for details.","/support-updates/"+b.id);
        return BookingDtos.View.from(b);
    }
    public Map<String,String> checkout(Long id,Authentication auth){
        access.require(auth,Role.CUSTOMER);definitions.lockByCode("SITE_VISIT").orElseThrow();var b=locked(id,auth);requireState(b,AWAITING_PAYMENT);
        if(!stripe.configured()||!stripe.webhookConfigured())throw error(HttpStatus.SERVICE_UNAVAILABLE,"Stripe payment and webhook configuration are required before checkout.");
        if(b.checkoutSessionId!=null){var existing=stripe.get("/checkout/sessions/"+com.wefyx.support.payment.StripeClient.encode(b.checkoutSessionId));if("paid".equals(existing.path("payment_status").asText())){acceptSession(b,existing);return Map.of("status","CONFIRMED");}if("open".equals(existing.path("status").asText()))return Map.of("checkoutUrl",b.checkoutUrl);b.occupiedSlot=null;b.holdUntil=null;bookings.saveAndFlush(b);}
        // The service-definition lock serializes overlapping appointment claims, even when services have different durations.
        definition(b.supportType);
        validateSlot(b.date,b.time,b.supportType);b.occupiedSlot=b.date+"T"+b.time;b.holdUntil=Instant.ofEpochSecond((Instant.now().getEpochSecond()/1800+2)*1800);b.checkoutAttempt++;bookings.saveAndFlush(b);
        var form=new LinkedHashMap<String,String>();form.put("mode","payment");form.put("payment_method_types[0]","card");form.put("customer_email",b.customerEmail);form.put("metadata[bookingId]",String.valueOf(b.id));form.put("client_reference_id",b.reference);form.put("line_items[0][quantity]","1");form.put("line_items[0][price_data][currency]","aed");form.put("line_items[0][price_data][unit_amount]",b.amount.movePointRight(2).toBigIntegerExact().toString());form.put("line_items[0][price_data][product_data][name]",b.serviceName==null?b.supportType:b.serviceName);form.put("expires_at",String.valueOf(b.holdUntil.getEpochSecond()));form.put("success_url",webUrl+"/book-support/confirmation?id="+b.id+"&session_id={CHECKOUT_SESSION_ID}");form.put("cancel_url",webUrl+"/book-support/confirmation?id="+b.id+"&payment=cancelled");
        var session=stripe.post("/checkout/sessions",form,"booking-"+b.id+"-"+b.checkoutAttempt+"-"+b.holdUntil.getEpochSecond());b.checkoutSessionId=session.path("id").asText();b.checkoutUrl=session.path("url").asText();if(b.checkoutSessionId.isBlank()||!b.checkoutUrl.startsWith("https://checkout.stripe.com/"))throw error(HttpStatus.BAD_GATEWAY,"Invalid checkout response.");return Map.of("checkoutUrl",b.checkoutUrl);
    }
    public BookingDtos.View verifyCheckout(Long id,Authentication auth){var b=locked(id,auth);if(b.status!=AWAITING_PAYMENT||b.checkoutSessionId==null)return BookingDtos.View.from(b);acceptSession(b,stripe.get("/checkout/sessions/"+com.wefyx.support.payment.StripeClient.encode(b.checkoutSessionId)));return BookingDtos.View.from(b);}
    public void webhook(com.fasterxml.jackson.databind.JsonNode event){
        String type=event.path("type").asText();if(!Set.of("checkout.session.completed","checkout.session.async_payment_succeeded","checkout.session.expired").contains(type))return;
        var object=event.path("data").path("object");var found=bookings.findByCheckoutSessionId(object.path("id").asText());if(found.isEmpty())return;var b=bookings.lockById(found.get().id).orElseThrow();
        if(type.equals("checkout.session.expired")){if(b.status==AWAITING_PAYMENT){b.occupiedSlot=null;b.holdUntil=null;}return;}acceptSession(b,object);
    }
    private void acceptSession(Booking b,com.fasterxml.jackson.databind.JsonNode session){
        if(!"paid".equals(session.path("payment_status").asText()))return;
        if(!Objects.equals(b.checkoutSessionId,session.path("id").asText())||!String.valueOf(b.id).equals(session.path("metadata").path("bookingId").asText())||!"aed".equals(session.path("currency").asText())||!session.path("amount_total").isIntegralNumber()||session.path("amount_total").asLong()!=b.amount.movePointRight(2).longValueExact())throw error(HttpStatus.CONFLICT,"Payment does not match this booking.");
        confirmVerifiedPayment(b.id,session.path("payment_intent").asText(),b.amount,"AED");
    }
    public BookingDtos.View confirmVerifiedPayment(Long id,String providerReference,BigDecimal paidAmount,String currency){
        var b=bookings.lockById(id).orElseThrow(()->error(HttpStatus.NOT_FOUND,"Booking not found"));
        if(providerReference==null||providerReference.isBlank()||providerReference.length()>200||!"AED".equals(currency)||paidAmount==null||paidAmount.compareTo(b.amount)!=0)throw error(HttpStatus.CONFLICT,"Payment does not match the booking");
        if(providerReference.equals(b.paymentReference))return BookingDtos.View.from(b);requireState(b,AWAITING_PAYMENT);
        if(b.occupiedSlot==null)validateSlot(b.date,b.time,b.supportType);
        b.paymentReference=providerReference;b.occupiedSlot=b.date+"T"+b.time;b.holdUntil=null;b.paidAt=Instant.now();b.status=CONFIRMED;bookings.saveAndFlush(b);notify(b,b.customerEmail,"Support service booked","Your appointment is confirmed.","/book-support/confirmation?id="+b.id);return BookingDtos.View.from(b);
    }
    private void releaseExpiredHolds(LocalDate date){
        for(var b:bookings.findByDateAndStatusAndOccupiedSlotIsNotNull(date,AWAITING_PAYMENT)){
            if(b.holdUntil==null||b.holdUntil.isAfter(Instant.now())||b.checkoutSessionId==null)continue;
            var session=stripe.get("/checkout/sessions/"+com.wefyx.support.payment.StripeClient.encode(b.checkoutSessionId));
            if("paid".equals(session.path("payment_status").asText()))acceptSession(b,session);
            else if("expired".equals(session.path("status").asText())){b.occupiedSlot=null;b.holdUntil=null;bookings.saveAndFlush(b);}
        }
    }
    private void notify(Booking b,String email,String title,String message,String link) {
        var n=new AccountNotification();n.setRecipientEmail(email);n.setType("BOOKING_UPDATE");
        n.setTitle(title);n.setMessage(message);n.setDeepLinkUrl(link);notifications.save(n);
    }
    private void validateDate(LocalDate date,ServiceDefinition service){var today=LocalDate.now(ZONE);if(date==null||date.isBefore(today)||date.isAfter(today.plusDays(service.advanceDays)))throw error(HttpStatus.BAD_REQUEST,"Choose a date within the service booking window.");}
    private void validateSlot(LocalDate date,String time,String type){if(availability(date,type).stream().noneMatch(slot->slot.get("time").equals(time)&&Boolean.TRUE.equals(slot.get("available"))))throw error(HttpStatus.CONFLICT,"This time is no longer available. Select another time.");}
    private void requireState(Booking b,Booking.Status... allowed) {
        if(Arrays.stream(allowed).noneMatch(s->s==b.status)) throw error(HttpStatus.CONFLICT,"This action is not available while the booking is "+b.status);
    }
    static ResponseStatusException error(HttpStatus status,String message) { return new ResponseStatusException(status,message); }
}

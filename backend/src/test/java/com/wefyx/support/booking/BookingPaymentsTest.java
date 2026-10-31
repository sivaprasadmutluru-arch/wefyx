package com.wefyx.support.booking;
import com.fasterxml.jackson.databind.*;
import com.wefyx.support.auth.JwtService;
import com.wefyx.support.payment.StripeClient;
import com.wefyx.support.user.*;
import com.wefyx.support.notification.AccountNotificationRepository;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.*;
import org.springframework.http.MediaType;
import org.junit.jupiter.api.*;
import java.time.*;
import java.util.*;
import java.math.BigDecimal;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:booking-payments;DB_CLOSE_DELAY=-1","spring.datasource.username=sa","spring.datasource.password=","wefyx.seed.enabled=false","wefyx.mail.enabled=false","wefyx.auth.email=qa-admin@example.test"})
@AutoConfigureMockMvc @Transactional
class BookingPaymentsTest {
 @Autowired MockMvc mvc;@Autowired ObjectMapper json;@Autowired JwtService jwt;@Autowired UserRepository users;@Autowired BookingRepository bookings;@Autowired AccountNotificationRepository notifications;
 @MockBean StripeClient stripe;
 String customer,other,admin;String date;
 @BeforeEach void setup()throws Exception{
  for(String name:List.of("pay-customer","pay-other"))users.saveAndFlush(new SupportUser(name,name+"@example.test","CUSTOMER","QA company","Dubai",UserStatus.ACTIVE,null,LocalDateTime.now()));
  customer=jwt.issue("pay-customer@example.test","CUSTOMER");other=jwt.issue("pay-other@example.test","CUSTOMER");admin=jwt.issue("qa-admin@example.test","SUPER_ADMIN");date=LocalDate.now(ZoneId.of("Asia/Dubai")).plusDays(3).toString();
  when(stripe.configured()).thenReturn(true);when(stripe.webhookConfigured()).thenReturn(true);
  when(stripe.event(anyString(),any())).thenAnswer(invocation->new StripeClient(json,"sk_test_qa","whsec_qa","").event(invocation.getArgument(0),invocation.getArgument(1)));
 }
 JsonNode call(String method,String path,String token,Object body,int status)throws Exception{var request=request(org.springframework.http.HttpMethod.valueOf(method),path).contentType(MediaType.APPLICATION_JSON);if(token!=null)request.header("Authorization","Bearer "+token);if(body!=null)request.content(json.writeValueAsBytes(body));var result=mvc.perform(request).andReturn().getResponse();assertEquals(status,result.getStatus(),result.getContentAsString());return result.getContentAsByteArray().length==0?json.nullNode():json.readTree(result.getContentAsByteArray());}
 JsonNode create(String key,String type,String time)throws Exception{return call("POST","/api/bookings",customer,Map.ofEntries(Map.entry("requestKey",key),Map.entry("supportType",type),Map.entry("company","QA company"),Map.entry("contactName","QA customer"),Map.entry("contactEmail","pay-customer@example.test"),Map.entry("phone","+919876543210"),Map.entry("category","Network"),Map.entry("subject","QA service"),Map.entry("description","QA details"),Map.entry("date",date),Map.entry("time",time),Map.entry("address","QA building"),Map.entry("emirate","Dubai")),201);}
 String signature(String payload)throws Exception{long timestamp=Instant.now().getEpochSecond();var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec("whsec_qa".getBytes(java.nio.charset.StandardCharsets.UTF_8),"HmacSHA256"));return "t="+timestamp+",v1="+HexFormat.of().formatHex(mac.doFinal((timestamp+"."+payload).getBytes(java.nio.charset.StandardCharsets.UTF_8)));}
 void webhook(Object event,int status)throws Exception{String payload=json.writeValueAsString(event);assertEquals(status,mvc.perform(post("/api/orders/stripe/webhook").contentType(MediaType.APPLICATION_JSON).content(payload).header("Stripe-Signature",signature(payload))).andReturn().getResponse().getStatus());}
 Map<String,Object> event(long id,String paid,long amount){return Map.of("type","checkout.session.completed","data",Map.of("object",Map.of("id","cs_qa","payment_status",paid,"currency","aed","amount_total",amount,"payment_intent","pi_qa","metadata",Map.of("bookingId",String.valueOf(id)))));}
 @Test void adminServiceChangesControlPublicFeesHoursAndDisabledTypes()throws Exception{
  var service=new HashMap<String,Object>(Map.of("code","QA_SERVICE","name","QA repair","description","QA configured service","basePrice",200,"vatPercent",5,"openingHour",11,"closingHour",13,"slotMinutes",30,"advanceDays",30,"workingDays","MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY"));service.put("active",true);
  call("POST","/api/service-definitions",customer,service,403);call("POST","/api/service-definitions",admin,service,201);
  assertEquals(4,call("GET","/api/bookings/availability?date="+date+"&supportType=QA_SERVICE",null,null,200).size());
  var booking=create("qa-configured-service-123","QA_SERVICE","11:00");assertEquals(210,booking.path("amount").asDouble());assertEquals(10,booking.path("vatAmount").asDouble());assertEquals("QA repair",booking.path("serviceName").asText());
  service.put("active",false);call("PUT","/api/service-definitions/QA_SERVICE",admin,service,200);
  call("GET","/api/bookings/availability?date="+date+"&supportType=QA_SERVICE",null,null,400);
  service.put("active",true);service.put("closingHour",10);call("PUT","/api/service-definitions/QA_SERVICE",admin,service,400);
 }
 @Test void checkoutHoldsSlotAndOnlyVerifiedMatchingPaymentConfirmsOnce()throws Exception{
  var booking=create("qa-stripe-booking-12345","SITE_VISIT","10:00");long id=booking.path("id").asLong();assertEquals(105,booking.path("amount").asDouble());
  when(stripe.post(eq("/checkout/sessions"),anyMap(),anyString())).thenAnswer(invocation->{Map<String,String> form=invocation.getArgument(1);assertEquals("10500",form.get("line_items[0][price_data][unit_amount]"));return json.readTree("{\"id\":\"cs_qa\",\"url\":\"https://checkout.stripe.com/c/pay/cs_qa\"}");});
  call("POST","/api/bookings/"+id+"/checkout",other,Map.of(),403);call("POST","/api/bookings/"+id+"/checkout",customer,Map.of(),200);
  assertTrue(bookings.findById(id).orElseThrow().occupiedSlot!=null);
  assertFalse(java.util.stream.StreamSupport.stream(call("GET","/api/bookings/availability?date="+date,null,null,200).spliterator(),false).filter(slot->slot.path("time").asText().equals("10:00")).findFirst().orElseThrow().path("available").asBoolean());
  webhook(event(id,"unpaid",10500),200);assertEquals(Booking.Status.AWAITING_PAYMENT,bookings.findById(id).orElseThrow().status);
  webhook(event(id,"paid",1),409);assertEquals(Booking.Status.AWAITING_PAYMENT,bookings.findById(id).orElseThrow().status);
  webhook(event(id,"paid",10500),200);assertEquals(Booking.Status.CONFIRMED,bookings.findById(id).orElseThrow().status);long count=notifications.count();webhook(event(id,"paid",10500),200);assertEquals(count,notifications.count());
 }
 @Test void overlappingCheckoutsAreBlockedAndExpiredSessionsReleaseTheHold()throws Exception{
  long first=create("qa-first-hold-1234567","SITE_VISIT","10:00").path("id").asLong();long second=create("qa-second-hold-123456","REMOTE","10:00").path("id").asLong();
  when(stripe.post(eq("/checkout/sessions"),anyMap(),anyString())).thenReturn(json.readTree("{\"id\":\"cs_qa\",\"url\":\"https://checkout.stripe.com/c/pay/cs_qa\"}"));
  call("POST","/api/bookings/"+first+"/checkout",customer,Map.of(),200);
  call("POST","/api/bookings/"+second+"/checkout",customer,Map.of(),409);
  verify(stripe,times(1)).post(eq("/checkout/sessions"),anyMap(),anyString());
  webhook(Map.of("type","checkout.session.expired","data",Map.of("object",Map.of("id","cs_qa","metadata",Map.of("bookingId",String.valueOf(first))))),200);assertNull(bookings.findById(first).orElseThrow().occupiedSlot);
  assertTrue(java.util.stream.StreamSupport.stream(call("GET","/api/bookings/availability?date="+date,null,null,200).spliterator(),false).filter(slot->slot.path("time").asText().equals("10:00")).findFirst().orElseThrow().path("available").asBoolean());
 }
 @Test void providerFailureRollsBackHoldAndMissingConfigurationRejectsCheckout()throws Exception{
  var booking=create("qa-stripe-config-12345","REMOTE","10:00");long id=booking.path("id").asLong();when(stripe.webhookConfigured()).thenReturn(false);call("POST","/api/bookings/"+id+"/checkout",customer,Map.of(),503);assertNull(bookings.findById(id).orElseThrow().occupiedSlot);
 }
}

package com.wefyx.support.flows;

import com.fasterxml.jackson.databind.*;
import com.wefyx.support.auth.JwtService;
import com.wefyx.support.booking.BookingService;
import com.wefyx.support.catalog.*;
import com.wefyx.support.user.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:business-flows;DB_CLOSE_DELAY=-1","spring.datasource.username=sa","spring.datasource.password=","wefyx.seed.enabled=false","wefyx.mail.enabled=false","wefyx.otp.registration-demo-bypass=true","wefyx.payments.stripe.secret-key=","wefyx.payments.stripe.webhook-secret=whsec_qa","wefyx.auth.email=qa-admin@example.test","wefyx.auth.password=QaAdminPassword123"})
@AutoConfigureMockMvc @ActiveProfiles("local-otp") @Transactional
class BusinessFlowsTest {
 @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired JwtService jwt;
 @Autowired com.wefyx.support.order.CustomerOrderRepository orders;
 @Autowired UserRepository users; @Autowired CatalogProductRepository products; @Autowired BookingService bookings;
 String customer,otherCustomer,employee,otherEmployee,vendor,otherVendor,admin; SupportUser vendorAccount;
 @BeforeEach void setup(){
  customer=account("customer","CUSTOMER");otherCustomer=account("other-customer","CUSTOMER");
  employee=account("employee","EMPLOYEE");otherEmployee=account("other-employee","EMPLOYEE");
  vendor=account("vendor","VENDOR");otherVendor=account("other-vendor","VENDOR");vendorAccount=users.findByEmailIgnoreCase("vendor@example.test").orElseThrow();
  admin=jwt.issue("qa-admin@example.test","SUPER_ADMIN");
 }
 String account(String name,String role){var user=new SupportUser(name,name+"@example.test",role,"QA company","Dubai",UserStatus.ACTIVE,null,LocalDateTime.now());user.setPasswordHash(new BCryptPasswordEncoder().encode("QaPassword123"));users.saveAndFlush(user);return jwt.issue(user.getEmail(),role);}
 JsonNode call(String method,String path,String token,Object body,int expected)throws Exception{
  var builder=request(HttpMethod.valueOf(method),path).contentType(MediaType.APPLICATION_JSON);
  if(token!=null)builder.header("Authorization","Bearer "+token);
  if(body!=null)builder.content(json.writeValueAsBytes(body));
  var result=mvc.perform(builder).andReturn();
  assertEquals(expected,result.getResponse().getStatus(),method+" "+path+" => "+result.getResponse().getContentAsString());
  byte[] bytes=result.getResponse().getContentAsByteArray();
  return bytes.length==0?json.nullNode():json.readTree(bytes);
 }
 CatalogProduct product(String code,String buy,String rent){var p=new CatalogProduct();p.setCode(code);p.setName(code);p.setCategory("QA");p.setBuyPrice(new BigDecimal(buy));p.setRentalPrice(new BigDecimal(rent));p.setStockQuantity(20);return products.saveAndFlush(p);}
 JsonNode address()throws Exception{return call("POST","/api/profile/addresses",customer,Map.of("label","Office","contactName","QA customer","phone","+919876543210","addressLine","QA building, office 1","emirate","Dubai","country","United Arab Emirates","defaultAddress",true),200);}
 Map<String,Object> orderBody(long address,List<Map<String,Object>> items,String code){var body=new HashMap<String,Object>();body.put("items",items);body.put("deliveryAddress",Map.of("id",address));body.put("paymentMethod","PAY_ON_DELIVERY");body.put("termsAccepted",true);if(code!=null)body.put("promoCode",code);return body;}
 Map<String,Object> item(String product,String mode,int quantity,int duration){return Map.of("productId",product,"mode",mode,"quantity",quantity,"unitPrice",0.01,"months",duration,"rentalPeriod","MONTH","rentalDuration",duration);}

 @Test void administrativeRecordsAreRestrictedAndModuleIdsCannotBeReused()throws Exception{
  var record=call("POST","/api/resources/permissions",admin,Map.of("name","QA permission","status","ACTIVE"),201);
  String path="/api/resources/permissions/"+record.path("id").asLong();
  for(String token:List.of(customer,employee,vendor)){
   call("GET","/api/resources/permissions",token,null,403);
   call("POST","/api/resources/permissions",token,Map.of("name","Forbidden"),403);
   call("PUT",path,token,Map.of("name","Forbidden"),403);
   call("PATCH",path+"/status",token,Map.of("status","INACTIVE"),403);
   call("DELETE",path,token,null,403);
  }
  String wrong="/api/resources/other-module/"+record.path("id").asLong();
  call("PUT",wrong,admin,Map.of("name","Wrong module"),404);
  call("PATCH",wrong+"/status",admin,Map.of("status","INACTIVE"),404);
  call("DELETE",wrong,admin,null,404);
  call("PUT",path,admin,Map.of("name","Updated QA permission","status","ACTIVE"),200);
  call("DELETE",path,admin,null,204);
 }
 @Test void addressesCanBeEditedAndRemainPrivate()throws Exception{
  long id=address().path("id").asLong();
  var edited=Map.of("label","Home","contactName","QA customer","phone","+919876543210","addressLine","Updated QA address","emirate","Dubai","country","United Arab Emirates","defaultAddress",true);
  call("PUT","/api/profile/addresses/"+id,otherCustomer,edited,404);
  call("DELETE","/api/profile/addresses/"+id,otherCustomer,null,404);
  call("PUT","/api/profile/addresses/"+id,customer,edited,200);
  assertEquals("Updated QA address",call("GET","/api/profile/addresses",customer,null,200).get(0).path("addressLine").asText());
  assertTrue(call("GET","/api/profile/addresses",otherCustomer,null,200).isEmpty());
  call("DELETE","/api/profile/addresses/"+id,customer,null,204);
  assertTrue(call("GET","/api/profile/addresses",customer,null,200).isEmpty());
 }
 @Test void cancellationReviewRestoresInventoryAndNotificationsRemainPrivate()throws Exception{
  product("qa-cancel","100","10");long address=address().path("id").asLong();
  var order=call("POST","/api/orders",customer,orderBody(address,List.of(item("qa-cancel","BUY",1,1)),null),201);
  String path="/api/orders/"+order.path("id").asLong();
  call("PATCH",path+"/cancel-request",otherCustomer,Map.of("reason","Wrong owner"),403);
  call("PATCH",path+"/cancel-request",customer,Map.of("reason","No longer required"),200);
  call("PATCH",path+"/cancel-decision",customer,Map.of("decision","APPROVED"),403);
  assertEquals("CANCELLED",call("PATCH",path+"/cancel-decision",employee,Map.of("decision","APPROVED"),200).path("status").asText());
  assertEquals(20,products.findByCodeIgnoreCase("qa-cancel").orElseThrow().getStockQuantity());
  call("PATCH",path+"/cancel-request",customer,Map.of("reason","Again"),400);
  var updates=call("GET","/api/notifications",customer,null,200);assertFalse(updates.isEmpty());
  String read="/api/notifications/"+updates.get(0).path("id").asLong()+"/read";
  call("PATCH",read,otherCustomer,Map.of(),403);
  assertTrue(call("PATCH",read,customer,Map.of(),200).path("read").asBoolean());
 }
 @Test void publicContactRequestsReachEmployeesButStayPrivateFromOtherRoles()throws Exception{
  var ticket=call("POST","/api/support-requests",null,Map.of("name","QA guest","email","qa-guest@example.test","subject","QA support inquiry","description","Help with network setup"),201);
  assertEquals("OPEN",ticket.path("status").asText());
  call("GET","/api/support-requests",customer,null,403);call("GET","/api/support-requests",vendor,null,403);
  assertFalse(call("GET","/api/support-requests",employee,null,200).isEmpty());
  String path="/api/support-requests/"+ticket.path("id").asLong()+"/reply";
  call("PATCH",path,employee,Map.of("reply",""),400);
  var reply=call("PATCH",path,employee,Map.of("reply","QA employee response"),200);
  assertEquals("ANSWERED",reply.path("status").asText());
  assertFalse(reply.path("emailDelivered").asBoolean());
 }
 @Test void freshCatalogHasNoBundledSampleProducts()throws Exception{assertEquals(0,products.count());assertTrue(call("GET","/api/catalog/products",null,null,200).isEmpty());}
 @Test void administratorCatalogEditsPublishImagesPricesAndStockAndRejectOverselling()throws Exception{
  var input=new HashMap<String,Object>();input.put("code","qa-admin-product");input.put("name","QA managed product");input.put("category","Laptop");input.put("specification","QA specs");input.put("description","QA description");input.put("imageUrl","/images/product-laptop-v2.png");input.put("buyPrice",125.50);input.put("rentalPrice",25.25);input.put("stockQuantity",2);input.put("active",true);input.put("purchasable",true);input.put("rentable",true);
  for(String token:List.of(customer,employee,vendor))call("POST","/api/catalog/products",token,input,403);
  var created=call("POST","/api/catalog/products",admin,input,201);long id=created.path("id").asLong();
  var published=call("GET","/api/catalog/products/qa-admin-product",null,null,200);
  assertEquals(input.get("imageUrl"),published.path("imageUrl").asText());assertEquals(125.50,published.path("buyPrice").asDouble());assertEquals(25.25,published.path("rentalPrice").asDouble());assertEquals(2,published.path("stockQuantity").asInt());
  call("POST","/api/catalog/products",admin,input,409);
  long address=address().path("id").asLong();
  call("POST","/api/orders",customer,orderBody(address,List.of(item("qa-admin-product","BUY",3,1)),null),400);
  assertEquals(2,products.findById(id).orElseThrow().getStockQuantity());
  input.put("name","QA updated product");input.put("buyPrice",150.75);input.put("rentalPrice",30.50);input.put("stockQuantity",0);input.put("imageUrl","/images/product-monitor-v2.png");
  call("PUT","/api/catalog/products/"+id,customer,input,403);call("PUT","/api/catalog/products/"+id,admin,input,200);
  published=call("GET","/api/catalog/products/qa-admin-product",null,null,200);
  assertEquals("QA updated product",published.path("name").asText());assertEquals(150.75,published.path("buyPrice").asDouble());assertEquals(30.50,published.path("rentalPrice").asDouble());assertEquals(input.get("imageUrl"),published.path("imageUrl").asText());assertEquals(0,published.path("stockQuantity").asInt());
  call("POST","/api/orders",customer,orderBody(address,List.of(item("qa-admin-product","RENT",1,1)),null),400);
  call("DELETE","/api/catalog/products/"+id,admin,null,204);
  call("GET","/api/catalog/products/qa-admin-product",null,null,404);
  assertFalse(java.util.stream.StreamSupport.stream(call("GET","/api/catalog/products",null,null,200).spliterator(),false).anyMatch(row->row.path("code").asText().equals("qa-admin-product")));
 }
 @Test void orderWebhookRequiresPaidStatusMatchingAmountAndDoesNotRepeatNotifications()throws Exception{
  product("qa-stripe-order","100","10");long address=address().path("id").asLong();
  long id=call("POST","/api/orders",customer,orderBody(address,List.of(item("qa-stripe-order","BUY",1,1)),null),201).path("id").asLong();
  var order=orders.findById(id).orElseThrow();order.setPaymentReference("cs_order_qa");orders.saveAndFlush(order);
  var object=new HashMap<String,Object>();object.put("id","cs_order_qa");object.put("currency","aed");object.put("amount_total",10500);object.put("payment_status","unpaid");object.put("metadata",Map.of("orderId",String.valueOf(id)));
  orderWebhook(object,200);assertEquals("PENDING",orders.findById(id).orElseThrow().getPaymentStatus());
  object.put("payment_status","paid");object.put("amount_total",1);orderWebhook(object,409);assertEquals("PENDING",orders.findById(id).orElseThrow().getPaymentStatus());
  object.put("amount_total",10500);object.put("currency","usd");orderWebhook(object,409);
  object.put("currency","aed");orderWebhook(object,200);assertEquals("PAID",orders.findById(id).orElseThrow().getPaymentStatus());
  var updates=call("GET","/api/notifications",customer,null,200).size();orderWebhook(object,200);assertEquals(updates,call("GET","/api/notifications",customer,null,200).size());
 }
 void orderWebhook(Map<String,Object> object,int expected)throws Exception{
  String payload=json.writeValueAsString(Map.of("type","checkout.session.completed","data",Map.of("object",object)));long timestamp=java.time.Instant.now().getEpochSecond();var mac=javax.crypto.Mac.getInstance("HmacSHA256");mac.init(new javax.crypto.spec.SecretKeySpec("whsec_qa".getBytes(java.nio.charset.StandardCharsets.UTF_8),"HmacSHA256"));String signature="t="+timestamp+",v1="+HexFormat.of().formatHex(mac.doFinal((timestamp+"."+payload).getBytes(java.nio.charset.StandardCharsets.UTF_8)));
  assertEquals(expected,mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/orders/stripe/webhook").contentType(MediaType.APPLICATION_JSON).header("Stripe-Signature",signature).content(payload)).andReturn().getResponse().getStatus());
 }
 @Test void customerEmployeeVendorAndAdministratorCanSignInAndStayWithinTheirPermissions()throws Exception{
  for(String role:List.of("customer","employee","vendor")){
   var login=call("POST","/api/auth/login",null,Map.of("email",role+"@example.test","password","QaPassword123"),200);
   assertEquals(role.toUpperCase(),login.path("user").path("role").asText());
   call("GET","/api/auth/me",login.path("token").asText(),null,200);
  }
  call("POST","/api/auth/login",null,Map.of("email","customer@example.test","password","wrong"),401);
  call("GET","/api/employee-registrations",employee,null,403);
  call("GET","/api/offers?all=true",customer,null,403);
  call("GET","/api/vendor-registrations",admin,null,200);
 }
 @Test void vendorAndEmployeeRequireAdminApprovalBeforeLogin()throws Exception{
  int index=0;
  for(String role:List.of("EMPLOYEE","VENDOR")){
   var registered=call("POST","/api/auth/register",null,Map.of("name","QA pending","email",role.toLowerCase()+"-pending@example.test","phone",index++==0?"+971501234560":"+971501234561","password","QaPassword123","role",role,"otp","123456"),201);
   var user=users.findByEmailIgnoreCase(role.toLowerCase()+"-pending@example.test").orElseThrow();assertEquals(UserStatus.PENDING,user.getStatus());
   call("POST","/api/auth/login",null,Map.of("email",user.getEmail(),"password","QaPassword123"),403);
   call("PATCH","/api/"+(role.equals("VENDOR")?"vendor":"employee")+"-registrations/"+user.getId()+"/approve",admin,Map.of(),200);
   call("POST","/api/auth/login",null,Map.of("email",user.getEmail(),"password","QaPassword123"),200);
  }
 }
 @Test void websiteLoginIsCustomerOnlyAndStaffLoginPreservesRoles() throws Exception {
  for (String role : List.of("employee", "vendor")) {
   call("POST", "/api/auth/customer/login", null, Map.of("email", role+"@example.test", "password", "QaPassword123"), 403);
   var signedIn = call("POST", "/api/auth/staff/login", null, Map.of("email", role+"@example.test", "password", "QaPassword123"), 200);
   assertEquals(role.toUpperCase(), signedIn.path("user").path("role").asText());
  }
  call("POST", "/api/auth/customer/login", null, Map.of("email", "qa-admin@example.test", "password", "QaAdminPassword123"), 403);
  call("POST", "/api/auth/staff/login", null, Map.of("email", "qa-admin@example.test", "password", "QaAdminPassword123"), 200);
  call("POST", "/api/auth/staff/login", null, Map.of("email", "customer@example.test", "password", "QaPassword123"), 403);
  call("POST", "/api/auth/customer/login", null, Map.of("email", "customer@example.test", "password", "QaPassword123"), 200);
  var user = users.findByEmailIgnoreCase("employee@example.test").orElseThrow();
  user.setPhone("+919876543210"); users.saveAndFlush(user);
  call("POST", "/api/auth/customer/login/send-otp", null, Map.of("phone", user.getPhone()), 403);
  call("POST", "/api/auth/customer/login/verify", null, Map.of("phone", user.getPhone(), "otp", "123456"), 403);
 }
 @Test void employeeAndVendorRegistrationPagesArePublicDeepLinks() throws Exception {
  for (String path : List.of("/register/employee", "/register/vendor", "/careers", "/become-a-vendor")) {
   var response = mvc.perform(request(HttpMethod.GET, path)).andReturn().getResponse();
   assertEquals(200, response.getStatus(), path);
   assertEquals("/index.html", response.getForwardedUrl(), path);
  }
 }
 @Test void purchasesUseServerPricesDiscountsAndRestoreStockOnCancellation()throws Exception{
  product("qa-buy","100","10");long address=address().path("id").asLong();
  var offer=Map.of("code","QASAVE10","title","QA offer","discountType","PERCENT","discountValue",10,"minimumSubtotal",100,"mode","BUY","active",true,"productCodes",List.of("qa-buy"));
  call("POST","/api/offers",customer,offer,403);call("POST","/api/offers",admin,offer,201);
  var order=call("POST","/api/orders",customer,orderBody(address,List.of(item("qa-buy","BUY",2,1)),"QASAVE10"),201);
  assertEquals(200,order.path("subtotal").asDouble());assertEquals(20,order.path("discountAmount").asDouble());assertEquals(9,order.path("vat").asDouble());assertEquals(189,order.path("amountDue").asDouble());assertEquals(18,products.findByCodeIgnoreCase("qa-buy").orElseThrow().getStockQuantity());
  long id=order.path("id").asLong();call("GET","/api/orders/"+id,otherCustomer,null,403);call("GET","/api/orders/"+id,vendor,null,403);
  call("PATCH","/api/orders/"+id+"/status",customer,Map.of("status","CANCELLED"),403);
  call("PATCH","/api/orders/"+id+"/status",employee,Map.of("status","CANCELLED"),200);
  call("PATCH","/api/orders/"+id+"/status",employee,Map.of("status","CANCELLED"),200);
  assertEquals(20,products.findByCodeIgnoreCase("qa-buy").orElseThrow().getStockQuantity());
 }
 @Test void mixedRentalAndPurchaseChargesDepositOnlyOnRentalItems()throws Exception{
  product("qa-sale","100","10");product("qa-rent","900","50");long address=address().path("id").asLong();
  var order=call("POST","/api/orders",customer,orderBody(address,List.of(item("qa-sale","BUY",2,1),item("qa-rent","RENT",1,2)),null),201);
  assertEquals(300,order.path("subtotal").asDouble());assertEquals(20,order.path("securityDeposit").asDouble());assertEquals(335,order.path("amountDue").asDouble());
  assertEquals(18,products.findByCodeIgnoreCase("qa-sale").orElseThrow().getStockQuantity());assertEquals(19,products.findByCodeIgnoreCase("qa-rent").orElseThrow().getStockQuantity());
 }
 @Test void serviceRequirementFlowsFromCustomerThroughEmployeeAndVendorToCompletion()throws Exception{
  var requirement=call("POST","/api/requirements",customer,Map.of("title","QA network setup","description","Configure a small office network","category","Networking","priority","High","quotationRequested",true),201);
  long id=requirement.path("id").asLong();String path="/api/requirements/"+id;
  call("GET",path,otherCustomer,null,403);call("GET",path,vendor,null,403);
  call("PATCH",path+"/accept",employee,Map.of("employeeName","QA employee"),200);
  call("PATCH",path+"/review",otherEmployee,Map.of(),403);
  var invited=call("POST",path+"/quotations/invite",employee,Map.of("vendorIds",List.of(vendorAccount.getId())),200);
  call("PATCH",path+"/vendor-decision",vendor,Map.of("accepted",true),200);
  var quote=call("POST",path+"/quotations/submit",vendor,Map.of("grandTotal",105,"subtotal",100,"taxAmount",5,"leadTimeDays",2,"paymentTerms","On delivery"),201);
  long quoteId=quote.path("id").asLong();
  call("POST",path+"/quotations/submit",otherVendor,Map.of("grandTotal",1),403);
  call("GET",path+"/quotations/comparison",otherEmployee,null,403);
  call("PATCH",path+"/quotations/"+quoteId+"/review",otherEmployee,Map.of("action","APPROVE"),403);
  call("PATCH",path+"/quotations/"+quoteId+"/review",employee,Map.of("action","APPROVE"),200);
  call("PATCH",path+"/quotations/"+quoteId+"/confirm",customer,Map.of("decision","CONFIRM"),200);
  call("PATCH",path+"/start",otherVendor,Map.of(),403);
  call("PATCH",path+"/start",vendor,Map.of(),200);
  call("PATCH",path+"/resolve",vendor,Map.of("resolution","Network installed and verified"),200);
  call("PATCH",path+"/close",employee,Map.of(),200);
 }
 @Test void supportTicketCanBeAssignedDiscussedResolvedAndReopened()throws Exception{
  var ticket=call("POST","/api/tickets",customer,Map.of("subject","QA device issue","description","Unable to connect","category","Hardware","priority","HIGH"),201);
  String path="/api/tickets/"+ticket.path("id").asLong();
  call("PATCH",path+"/assign",employee,Map.of("assigneeEmail","employee@example.test"),200);
  call("POST",path+"/messages",customer,Map.of("message","QA customer update"),201);
  call("POST",path+"/messages",employee,Map.of("message","QA employee reply"),201);
  call("GET",path+"/messages",otherCustomer,null,403);call("GET",path+"/messages",otherEmployee,null,403);call("GET",path+"/messages",vendor,null,403);
  assertEquals(2,call("GET",path+"/messages",customer,null,200).size());
  call("PATCH",path+"/status",employee,Map.of("status","RESOLVED","resolution","Connection restored"),200);
  call("PATCH",path+"/reopen",customer,Map.of(),200);
 }
 @Test void bookingPaymentBoundaryAndEmployeeServiceReportWorkWithoutExternalPayment()throws Exception{
  String date=LocalDate.now(ZoneId.of("Asia/Dubai")).plusDays(3).toString();
  var body=new HashMap<String,Object>();body.put("requestKey","qa-booking-12345678");body.put("supportType","SITE_VISIT");body.put("company","QA company");body.put("contactName","QA customer");body.put("contactEmail","customer@example.test");body.put("phone","+971501234567");body.put("category","Networking");body.put("subject","QA network visit");body.put("description","Inspect office network");body.put("date",date);body.put("time","10:00");body.put("address","QA building");body.put("emirate","Dubai");
  var booking=call("POST","/api/bookings",customer,body,201);long id=booking.path("id").asLong();
  assertEquals(id,call("POST","/api/bookings",customer,body,201).path("id").asLong());
  call("POST","/api/bookings/"+id+"/checkout",customer,Map.of(),503);
  assertFalse(call("GET","/api/bookings/catalog",null,null,200).path("checkoutAvailable").asBoolean());
  // Exercise the internal verified-payment boundary only in this in-memory test.
  bookings.confirmVerifiedPayment(id,"qa-provider-reference",new BigDecimal("105.00"),"AED");
  call("PATCH","/api/bookings/"+id+"/assign",admin,Map.of("employeeEmail","employee@example.test"),200);
  call("PATCH","/api/bookings/"+id+"/start",otherEmployee,Map.of(),403);
  call("PATCH","/api/bookings/"+id+"/start",employee,Map.of(),200);
  var report=call("POST","/api/bookings/"+id+"/report",employee,Map.of("workSummary","Network checked","actionsTaken",List.of("Checked cables","Verified connectivity")),200);
  assertEquals("COMPLETED",report.path("status").asText());
  call("GET","/api/bookings/"+id,customer,null,200);call("GET","/api/bookings/"+id,otherCustomer,null,403);
 }
}

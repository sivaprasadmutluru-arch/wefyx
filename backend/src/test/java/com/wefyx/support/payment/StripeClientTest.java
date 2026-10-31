package com.wefyx.support.payment;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.*;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import static org.junit.jupiter.api.Assertions.*;
class StripeClientTest {
 static String sign(String payload,long timestamp)throws Exception{var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec("whsec_qa".getBytes(StandardCharsets.UTF_8),"HmacSHA256"));return "t="+timestamp+",v1="+HexFormat.of().formatHex(mac.doFinal((timestamp+"."+payload).getBytes(StandardCharsets.UTF_8)));}
 @Test void signatureRequiresUnchangedRecentPayloadAndAcceptsAnyValidV1()throws Exception{
  var stripe=new StripeClient(new ObjectMapper(),"sk_test_qa","whsec_qa","http://127.0.0.1");String payload="{\"id\":\"evt_qa\"}";long now=Instant.now().getEpochSecond();
  assertEquals("evt_qa",stripe.event(payload,sign(payload,now)+",v1=bad").path("id").asText());
  assertThrows(org.springframework.web.server.ResponseStatusException.class,()->stripe.event(payload+" ",sign(payload,now)));
  assertThrows(org.springframework.web.server.ResponseStatusException.class,()->stripe.event(payload,sign(payload,now-301)));
  assertThrows(org.springframework.web.server.ResponseStatusException.class,()->stripe.event(payload,sign(payload,now+301)));
  assertThrows(org.springframework.web.server.ResponseStatusException.class,()->stripe.event(payload,null));
 }
 @Test void transportSendsServerAmountAndIdempotencyAndPreservesResponse()throws Exception{
  var server=com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/payment_intents",exchange->{try{
   assertEquals("POST",exchange.getRequestMethod());assertEquals("qa-idempotency",exchange.getRequestHeaders().getFirst("Idempotency-Key"));assertEquals("Bearer sk_test_qa",exchange.getRequestHeaders().getFirst("Authorization"));String form=new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8);assertTrue(form.contains("amount=10500"));
   byte[] response="{\"id\":\"pi_qa\",\"amount\":10500}".getBytes(StandardCharsets.UTF_8);exchange.sendResponseHeaders(200,response.length);exchange.getResponseBody().write(response);
  }finally{exchange.close();}});server.start();
  try{var stripe=new StripeClient(new ObjectMapper(),"sk_test_qa","whsec_qa","http://127.0.0.1:"+server.getAddress().getPort());assertEquals(10500,stripe.post("/payment_intents",Map.of("amount","10500"),"qa-idempotency").path("amount").asInt());}finally{server.stop(0);}
 }
}

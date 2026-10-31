package com.wefyx.support.payment;

import com.fasterxml.jackson.databind.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;

@Service
public class StripeClient {
 private final String key,webhookSecret,base;private final ObjectMapper json;
 private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
 public StripeClient(ObjectMapper json,@Value("${wefyx.payments.stripe.secret-key:}")String key,@Value("${wefyx.payments.stripe.webhook-secret:}")String webhookSecret,@Value("${wefyx.payments.stripe.api-base:https://api.stripe.com/v1}")String base){this.json=json;this.key=key.trim();this.webhookSecret=webhookSecret.trim();this.base=base;}
 public boolean configured(){return !key.isBlank();}public boolean webhookConfigured(){return !webhookSecret.isBlank();}
 public boolean live(){return key.startsWith("sk_live_")||key.startsWith("rk_live_");}
 public JsonNode post(String path,Map<String,String> form,String idempotency){return request(path,form,idempotency);}
 public JsonNode get(String path){return request(path,null,null);}
 private JsonNode request(String path,Map<String,String> form,String idempotency){
  if(!configured())throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Stripe payment is not configured.");
  try{
   var request=HttpRequest.newBuilder(URI.create(base+path)).timeout(Duration.ofSeconds(20)).header("Authorization","Bearer "+key);
   if(form!=null){request.header("Content-Type","application/x-www-form-urlencoded").header("Idempotency-Key",idempotency);request.POST(HttpRequest.BodyPublishers.ofString(form.entrySet().stream().map(e->encode(e.getKey())+"="+encode(e.getValue())).collect(java.util.stream.Collectors.joining("&"))));}else request.GET();
   var response=http.send(request.build(),HttpResponse.BodyHandlers.ofString());var body=json.readTree(response.body());
   if(response.statusCode()<200||response.statusCode()>299)throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Stripe: "+body.path("error").path("message").asText("Payment provider rejected this request.").replaceAll("(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+","[redacted]"));
   return body;
  }catch(ResponseStatusException error){throw error;}catch(InterruptedException error){Thread.currentThread().interrupt();throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Payment provider request interrupted.");}catch(Exception error){throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Unable to contact Stripe. Please retry.");}
 }
 public JsonNode event(String payload,String header){
  if(!webhookConfigured()||header==null)throw invalid();
  try{
   long timestamp=0;var signatures=new ArrayList<String>();
   for(String part:header.split(",")){String[] pair=part.trim().split("=",2);if(pair.length==2){if(pair[0].equals("t"))timestamp=Long.parseLong(pair[1]);if(pair[0].equals("v1"))signatures.add(pair[1]);}}
   if(Math.abs(Instant.now().getEpochSecond()-timestamp)>300)throw invalid();
   var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));byte[] expected=mac.doFinal((timestamp+"."+payload).getBytes(StandardCharsets.UTF_8));
   boolean verified=false;for(String signature:signatures){try{verified|=MessageDigest.isEqual(expected,HexFormat.of().parseHex(signature));}catch(IllegalArgumentException ignored){}}
   if(!verified)throw invalid();return json.readTree(payload);
  }catch(ResponseStatusException error){throw error;}catch(Exception error){throw invalid();}
 }
 private static ResponseStatusException invalid(){return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid Stripe signature or event.");}
 public static String encode(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);}
}

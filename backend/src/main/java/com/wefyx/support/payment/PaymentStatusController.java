package com.wefyx.support.payment;
import com.wefyx.support.config.AccessControl;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
@RestController @RequestMapping("/api/payments/stripe")
public class PaymentStatusController {
 private final StripeClient stripe;private final AccessControl access;
 public PaymentStatusController(StripeClient stripe,AccessControl access){this.stripe=stripe;this.access=access;}
 @GetMapping("/status") public Map<String,Object> status(Authentication auth){access.require(auth,AccessControl.Role.SUPER_ADMIN);var result=new LinkedHashMap<String,Object>();result.put("configured",stripe.configured());result.put("live",stripe.live());result.put("webhookConfigured",stripe.webhookConfigured());if(stripe.configured())try{var account=stripe.get("/account");result.put("chargesEnabled",account.path("charges_enabled").asBoolean());result.put("cardPayments",account.path("capabilities").path("card_payments").asText("inactive"));}catch(ResponseStatusException error){result.put("error",error.getReason());}return result;}
}

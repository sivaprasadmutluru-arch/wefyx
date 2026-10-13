package com.wefyx.support.auth;

import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OtpService {
    private final RestClient client;
    private final String serviceSid;
    private final boolean configured;
    private final boolean registrationDemoBypass;
    private LocalOtpStore local;

    @org.springframework.beans.factory.annotation.Autowired(required=false)
    void useLocalStore(LocalOtpStore local) { this.local = local; }

    public boolean isLocal() { return local != null; }
    public boolean isRegistrationDemo() { return registrationDemoBypass; }

    @org.springframework.beans.factory.annotation.Autowired
    public OtpService(@Value("${wefyx.otp.account-sid:}") String accountSid,
                      @Value("${wefyx.otp.auth-token:}") String authToken,
                      @Value("${wefyx.otp.service-sid:}") String serviceSid,
                      @Value("${wefyx.otp.registration-demo-bypass:false}") boolean registrationDemoBypass) {
        this.serviceSid = serviceSid;
        this.registrationDemoBypass = registrationDemoBypass;
        configured = !accountSid.isBlank() && !authToken.isBlank() && !serviceSid.isBlank();
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));
        client = RestClient.builder().baseUrl("https://verify.twilio.com/v2")
            .requestFactory(factory).defaultHeaders(h -> h.setBasicAuth(accountSid, authToken)).build();
    }

    OtpService(String accountSid, String authToken, String serviceSid) {
        this(accountSid, authToken, serviceSid, false);
    }

    OtpService(RestClient client) {
        this.client = client;
        this.serviceSid = "test-service";
        this.configured = true;
        this.registrationDemoBypass = false;
    }

    public static String normalize(String raw) {
        String phone = raw == null ? "" : raw.trim().replaceAll("[\\s()\\-]", "");
        if (phone.startsWith("00971") || phone.startsWith("0091")) phone = "+" + phone.substring(2);
        if (!phone.matches("(\\+9715[024568][0-9]{7}|\\+91[6-9][0-9]{9})"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Enter a valid UAE or India mobile number with country code, for example +971501234567 or +919618810386");
        return phone;
    }

    public String send(String raw) {
        String phone = normalize(raw);
        if (local != null) { local.send(phone); return phone; }
        Map<?, ?> response = request("Verifications", phone, "Channel", "sms");
        if (!"pending".equals(response.get("status")))
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "SMS provider did not accept the OTP request");
        return phone;
    }

    public String sendRegistration(String raw) {
        String phone = normalize(raw);
        if (registrationDemoBypass) return phone;
        return send(phone);
    }

    public String verify(String raw, String code) {
        String phone = normalize(raw);
        if (code == null || !code.matches("[0-9]{6}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a valid 6-digit OTP");
        if (local != null) { local.verify(phone, code); return phone; }
        Map<?, ?> response = request("VerificationCheck", phone, "Code", code);
        if (!"approved".equals(response.get("status")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        return phone;
    }

    public String verifyRegistration(String raw, String code) {
        String phone = normalize(raw);
        if (code == null || !code.matches("[0-9]{6}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a valid 6-digit OTP");
        if (registrationDemoBypass) return phone;
        return verify(phone, code);
    }

    private Map<?, ?> request(String operation, String phone, String key, String value) {
        if (!configured) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
            "SMS verification is not configured. Please contact support.");
        var body = new LinkedMultiValueMap<String, String>();
        body.add("To", phone);
        body.add(key, value);
        try {
            Map<?, ?> response = client.post().uri("/Services/{sid}/{operation}", serviceSid, operation)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(body).retrieve().body(Map.class);
            if (response == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty SMS provider response");
            return response;
        } catch (RestClientResponseException ex) {
            String providerBody = ex.getResponseBodyAsString();
            if (ex.getStatusCode().value() == 429)
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many OTP attempts. Please try again later.");
            if (providerBody != null && providerBody.contains("\"code\":21608"))
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Twilio trial account can send OTP only to verified tester numbers. Add this mobile number in Twilio Verify testers or upgrade Twilio.");
            if (operation.equals("VerificationCheck") && (ex.getStatusCode().value() == 404 || ex.getStatusCode().value() == 400))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP. Please request a new code.");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "SMS verification failed. Please try again or contact support.");
        } catch (ResourceAccessException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMS provider is unavailable. Please try again later.");
        }
    }
}

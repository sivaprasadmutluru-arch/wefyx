package com.wefyx.support.auth;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class OtpServiceTest {
    @Test void normalizesUaeAndIndiaNumbersAndRejectsInvalidNumbers() {
        assertEquals("+971502234567", OtpService.normalize("+971 50 223 4567"));
        assertEquals("+971501234567", OtpService.normalize("00971 (50) 123-4567"));
        assertEquals("+919876543210", OtpService.normalize("0091 98765 43210"));
        for (String phone : new String[]{"+12025550123", "9876543210", "+915123456789", "+97141234567", "+9715022345600", "+12025550123"})
            assertThrows(ResponseStatusException.class, () -> OtpService.normalize(phone));
    }

    @Test void missingCredentialsNeverPretendToSendSms() {
        var service = new OtpService("", "", "");
        var ex = assertThrows(ResponseStatusException.class, () -> service.send("+971502234560"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
    }

    @Test void registrationDemoAcceptsAnySixDigitCodeButDoesNotBypassPasswordResetOtp() {
        var service = new OtpService("", "", "", true);
        assertEquals("+971502234560", service.sendRegistration("+971502234560"));
        assertEquals("+971502234560", service.verifyRegistration("+971502234560", "987654"));
        assertThrows(ResponseStatusException.class,
            () -> service.verifyRegistration("+971502234560", "12345"));
        assertThrows(ResponseStatusException.class,
            () -> service.send("+971502234560"));
    }

    @Test void sendsAndChecksUaeNumbersWithoutReturningCode() {
        for (String phone : new String[]{"+971502234560", "+971501234567"}) {
            var builder = RestClient.builder().baseUrl("https://verify.twilio.com/v2");
            var server = MockRestServiceServer.bindTo(builder).build();
            var service = new OtpService(builder.build());
            server.expect(requestTo("https://verify.twilio.com/v2/Services/test-service/Verifications"))
                .andExpect(content().string("To=%2B" + phone.substring(1) + "&Channel=sms"))
                .andRespond(withSuccess("{\"status\":\"pending\"}", MediaType.APPLICATION_JSON));
            server.expect(requestTo("https://verify.twilio.com/v2/Services/test-service/VerificationCheck"))
                .andRespond(withSuccess("{\"status\":\"approved\"}", MediaType.APPLICATION_JSON));
            assertEquals(phone, service.send(phone));
            assertEquals(phone, service.verify(phone, "123456"));
            server.verify();
        }
    }

    @Test void rejectsWrongExpiredAndReusedCodesAndRateLimits() {
        var builder = RestClient.builder().baseUrl("https://verify.twilio.com/v2");
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new OtpService(builder.build());
        server.expect(anything()).andRespond(withSuccess("{\"status\":\"pending\"}", MediaType.APPLICATION_JSON));
        server.expect(anything()).andRespond(withStatus(HttpStatus.NOT_FOUND));
        server.expect(anything()).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        assertThrows(ResponseStatusException.class, () -> service.verify("+971502234560", "abcdef"));
        assertThrows(ResponseStatusException.class, () -> service.verify("+971502234560", "123456"));
        assertThrows(ResponseStatusException.class, () -> service.verify("+971502234560", "123456"));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, assertThrows(ResponseStatusException.class,
            () -> service.send("+971502234560")).getStatusCode());
        server.verify();
    }
}

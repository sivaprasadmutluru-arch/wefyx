package com.wefyx.support.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:identity-tests;DB_CLOSE_DELAY=-1", "spring.datasource.username=sa", "spring.datasource.password=", "wefyx.seed.enabled=false", "wefyx.otp.registration-demo-bypass=true"})
@AutoConfigureMockMvc
@ActiveProfiles("local-otp")
class UserIdentityTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired UserIdentityService identities;
    @Autowired JdbcTemplate jdbc;
    @Autowired com.wefyx.support.auth.JwtService jwt;

    private Map<String,String> registration(String email, String phone) {
        return Map.of("name", "Test User", "email", email, "phone", phone, "password", "TestPassword123", "role", "CUSTOMER", "otp", "123456");
    }

    @Test void registrationRejectsDuplicateEmailAndFormattedMobileWithoutChangingAccount() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(registration("unique@example.com", "+971 50 223 4567"))))
            .andExpect(status().isCreated());
        var original = users.findByEmailIgnoreCase("unique@example.com").orElseThrow();
        String hash = original.getPasswordHash();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(registration(" UNIQUE@example.com ", "+971501234567"))))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Email address")));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(registration("different@example.com", "00971 (50) 2234567"))))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Mobile number")));
        assertEquals(hash, users.findById(original.getId()).orElseThrow().getPasswordHash());
        assertTrue(users.findByEmailIgnoreCase("different@example.com").isEmpty());
    }

    @Test void rejectsInvalidOrMissingEmailAndMobile() throws Exception {
        for (var entry : new String[][]{{"bad-email", "+971502234560"}, {"", "+971502234560"}, {"valid@example.com", ""}, {"valid@example.com", "+911234"}}) {
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(registration(entry[0], entry[1])))).andExpect(status().isBadRequest());
        }
    }

    @Test void loginRequiresTheRegisteredPasswordForEmailAndMobile() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(registration("password-check@example.com", "+971509876543"))))
            .andExpect(status().isCreated());
        for (String identifier : new String[]{"PASSWORD-CHECK@example.com", "+971 50 987 6543"}) {
            String key = identifier.contains("@") ? "email" : "phone";
            if (identifier.contains("@")) {
                mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(key, identifier, "password", "TestPassword123"))))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
            } else {
                mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(key, identifier, "password", "TestPassword123"))))
                    .andExpect(status().isPreconditionRequired());
                mvc.perform(post("/api/auth/login/send-otp").contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(key, identifier, "password", "TestPassword123"))))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.phone").value("+971509876543"));
                mvc.perform(post("/api/auth/login/verify").contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(key, identifier, "password", "TestPassword123", "otp", "123456"))))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
            }
            for (String wrong : new String[]{"incorrect", "Password@123", "admin@123", "customer@123", "vendor@123", "employee@123"})
                mvc.perform(post(identifier.contains("@") ? "/api/auth/login" : "/api/auth/login/send-otp").contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(key, identifier, "password", wrong))))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/auth/send-otp").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("phone", "+971509876543", "purpose", "registration"))))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Mobile number is already registered")));
    }

    @Test void rejectsForeignMobileAndMissingPassword() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(registration("foreign@example.com", "+919876543210"))))
            .andExpect(status().isBadRequest());
        var payload = new java.util.HashMap<>(registration("no-password@example.com", "+971509876544"));
        payload.remove("password");
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(payload))).andExpect(status().isBadRequest());
    }

    private SupportUser account(String email, String phone) {
        var user = new SupportUser("Test", email, "CUSTOMER", "Test Org", "Dubai", UserStatus.ACTIVE, null, LocalDateTime.now());
        user.setPhone(phone);
        return users.saveAndFlush(user);
    }

    @Test void updatesAllowOwnIdentityButRejectAnotherUsersIdentity() {
        var first = account("first-edit@example.com", "+971551234567");
        var second = account("second-edit@example.com", "+971502234561");
        assertDoesNotThrow(() -> identities.check(first.getEmail(), first.getPhone(), first.getId()));
        assertThrows(ResponseStatusException.class, () -> identities.check(second.getEmail(), first.getPhone(), first.getId()));
        assertThrows(ResponseStatusException.class, () -> identities.check(first.getEmail(), second.getPhone(), first.getId()));
    }

    @Test void databaseRejectsDuplicatesEvenWithoutPreflightChecks() {
        account("db-unique@example.com", "+971561234567");
        assertThrows(DataIntegrityViolationException.class, () -> account("DB-UNIQUE@example.com", "+971502234562"));
        assertThrows(DataIntegrityViolationException.class, () -> account("db-other@example.com", "+971 56 123 4567"));
        assertDoesNotThrow(() -> account("no-phone-one@example.com", null));
        assertDoesNotThrow(() -> account("no-phone-two@example.com", ""));
    }

    @Test void adminApiValidatesCreateAndUpdateAndPersistsMobileChanges() throws Exception {
        var first = account("admin-edit@example.com", "+971502234563");
        var second = account("admin-other@example.com", "+971581234567");
        String token = "Bearer " + jwt.issue("admin@wefyx.pro", "SUPER_ADMIN");
        var payload = new java.util.HashMap<>(registration(first.getEmail(), second.getPhone()));
        payload.put("organization", "Test Org");
        mvc.perform(put("/api/users/" + first.getId()).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(payload))).andExpect(status().isConflict());
        assertEquals(first.getPhone(), users.findById(first.getId()).orElseThrow().getPhone());
        payload.put("phone", "+971 50 223 4564");
        mvc.perform(put("/api/users/" + first.getId()).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(payload))).andExpect(status().isOk()).andExpect(jsonPath("$.phone").value("+971502234564"));
        mvc.perform(post("/api/users").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(payload))).andExpect(status().isConflict());
    }

    @Test void migrationDetectsLegacyConflictsBeforeChangingRows() {
        var first = account("legacy@example.com", null);
        var second = account("legacy-other@example.com", null);
        jdbc.update("UPDATE support_users SET email = ? WHERE id = ?", "LEGACY@example.com", second.getId());
        try {
            assertThrows(IllegalStateException.class, () -> new UserIdentityMigration(jdbc).run(null));
            assertEquals("LEGACY@example.com", jdbc.queryForObject("SELECT email FROM support_users WHERE id = ?", String.class, second.getId()));
        } finally {
            users.deleteById(second.getId());
            users.deleteById(first.getId());
        }
    }

    @Test void legacyPhoneDoesNotPreventStartupOrUnrelatedAccountUpdates() {
        var user = account("legacy-phone@example.com", null);
        jdbc.update("UPDATE support_users SET phone = ? WHERE id = ?", "12345", user.getId());
        assertDoesNotThrow(() -> new UserIdentityMigration(jdbc).run(null));
        var loaded = users.findById(user.getId()).orElseThrow();
        assertEquals("12345", loaded.getPhone());
        loaded.setLastLogin(LocalDateTime.now());
        assertDoesNotThrow(() -> users.saveAndFlush(loaded));
        assertThrows(ResponseStatusException.class, () -> UserIdentity.phone("12345", true));
        users.deleteById(user.getId());
    }

    @Test void legacyDuplicateMobilesArePreservedAndReserved() {
        var first = account("legacy-duplicate-a@example.com", null);
        var second = account("legacy-duplicate-b@example.com", null);
        jdbc.update("UPDATE support_users SET phone = ? WHERE id IN (?, ?)", "+971502234569", first.getId(), second.getId());
        assertDoesNotThrow(() -> new UserIdentityMigration(jdbc).run(null));
        assertEquals("+971502234569", users.findById(first.getId()).orElseThrow().getPhone());
        assertEquals("+971502234569", users.findById(second.getId()).orElseThrow().getPhone());
        assertThrows(ResponseStatusException.class, () -> identities.check("third@example.com", "+971502234569", null));
        assertThrows(DataIntegrityViolationException.class, () -> account("third@example.com", "+971502234569"));
        users.deleteById(second.getId());
        users.deleteById(first.getId());
    }
}

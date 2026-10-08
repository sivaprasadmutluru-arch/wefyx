package com.wefyx.support.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import com.wefyx.support.user.SupportUser;
import org.springframework.web.server.ResponseStatusException;
import com.wefyx.support.user.UserRepository;
import com.wefyx.support.user.UserStatus;
import com.wefyx.support.user.UserIdentity;
import com.wefyx.support.user.UserIdentityService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.core.Authentication;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final JwtService jwt;
    private final OtpService otpService;
    private final UserIdentityService identities;
    private final String adminEmail, adminPassword, vendorEmail, vendorPassword, vendorName;
    private final UserRepository users;
    private final BCryptPasswordEncoder passwords=new BCryptPasswordEncoder();
    public AuthController(JwtService jwt,
                          @Value("${wefyx.auth.email}") String email,
                          @Value("${wefyx.auth.password}") String password,
                          @Value("${wefyx.auth.vendor-email}") String vendorEmail,
                          @Value("${wefyx.auth.vendor-password}") String vendorPassword,
                          @Value("${wefyx.auth.vendor-name}") String vendorName,
                          UserRepository users, OtpService otpService, UserIdentityService identities) {
        this.jwt=jwt; this.adminEmail=email; this.adminPassword=password;
        this.vendorEmail=vendorEmail; this.vendorPassword=vendorPassword; this.vendorName=vendorName;
        this.users=users; this.otpService=otpService; this.identities=identities;
    }

    @PostMapping("/send-otp")
    public Map<String, Object> sendOtp(@RequestBody Map<String, String> body) {
        String phone = OtpService.normalize(body.getOrDefault("phone", body.getOrDefault("mobile", "")));
        boolean registration = "registration".equals(body.get("purpose"));
        if (registration && users.existsByPhone(phone))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mobile number is already registered. Please sign in or use a different number.");
        phone = registration ? otpService.sendRegistration(phone) : otpService.send(phone);
        boolean demo = registration && otpService.isRegistrationDemo();
        String message = demo ? "Demo verification enabled. Enter any 6-digit code to continue."
            : otpService.isLocal() ? "Development OTP is in the backend terminal. No SMS was sent."
            : "OTP requested for " + phone;
        return Map.of("success", true, "message", message, "phone", phone,
            "delivery", demo ? "demo" : otpService.isLocal() ? "console" : "sms");
    }

    @PostMapping("/verify-otp")
    public Map<String, Object> verifyOtp(@RequestBody Map<String, String> body) {
        String phone = otpService.verifyRegistration(body.get("phone"), body.get("otp"));
        return Map.of("valid", true, "message", "Mobile number verified successfully", "phone", phone);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String phone = OtpService.normalize(body.get("phone"));
        String password = body.getOrDefault("password", "");
        if (password.length() < 8) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        var user = users.findByPhone(phone).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account associated with this mobile number"));
        otpService.verify(phone, body.get("otp"));
        user.setPasswordHash(passwords.encode(password));
        users.save(user);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now login with your new password."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request){
        String identifier=String.valueOf(request.email()!=null?request.email():request.phone()!=null?request.phone():"").trim();
        String suppliedPassword=String.valueOf(request.password());

        if (request.password() == null || request.password().isBlank())
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Email/mobile and password are required."));
        if(matches(adminEmail,adminPassword,identifier,suppliedPassword))
            return session(adminEmail,"System Administrator","SUPER_ADMIN");
        if(!vendorEmail.isBlank() && !vendorPassword.isBlank() && matches(vendorEmail,vendorPassword,identifier,suppliedPassword))
            return session(vendorEmail,vendorName,"VENDOR");

        String normalizedIdentifier = identifier;
        if (!identifier.contains("@")) {
            try { normalizedIdentifier = OtpService.normalize(identifier); }
            catch (ResponseStatusException ex) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email/mobile or password."));
            }
        }
        var user = identifier.contains("@") ? users.findByEmailIgnoreCase(identifier).orElse(null)
            : users.findByPhone(normalizedIdentifier).orElse(null);
        if(user!=null) {
            boolean validPassword = user.getPasswordHash()!=null && passwords.matches(suppliedPassword,user.getPasswordHash());
            if(validPassword) {
                if(!identifier.contains("@"))
                    return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(Map.of("message","Mobile login requires SMS verification."));
                if(user.getStatus()==UserStatus.PENDING) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message","Your "+loginRole(user.getRole()).toLowerCase()+" registration is pending admin approval."));
                }
                if(user.getStatus()==UserStatus.ACTIVE) {
                    user.setLastLogin(java.time.LocalDateTime.now());
                    users.save(user);
                    return session(user);
                }
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message","Invalid credentials. Please check your role, email/phone, and password."));
    }

    @PostMapping("/login/send-otp")
    public Map<String, Object> sendLoginOtp(@RequestBody LoginRequest request) {
        var user = requirePhoneUser(request == null ? null : request.phone());
        String phone = otpService.send(user.getPhone());
        return Map.of("success", true, "message", otpMessage(phone), "phone", phone,
            "delivery", otpService.isLocal() ? "console" : "sms");
    }

    @PostMapping("/login/verify")
    public ResponseEntity<?> verifyPhoneLogin(@RequestBody PhoneLoginRequest request) {
        var user = requirePhoneUser(request == null ? null : request.phone());
        otpService.verify(user.getPhone(), request.otp());
        user.setLastLogin(java.time.LocalDateTime.now());
        users.save(user);
        return session(user);
    }

    private SupportUser requirePhoneUser(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank())
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mobile number is required.");
        String phone = OtpService.normalize(rawPhone);
        var user = users.findByPhone(phone)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No active account found for this mobile number."));
        if (user.getStatus() == UserStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your " + loginRole(user.getRole()).toLowerCase() + " registration is pending admin approval.");
        if (user.getStatus() != UserStatus.ACTIVE)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is not active.");
        return user;
    }

    private String otpMessage(String phone) {
        return otpService.isLocal() ? "Development OTP is in the backend terminal. No SMS was sent." : "OTP requested for " + phone;
    }

    private boolean matches(String expectedEmail,String expectedPassword,String email,String password){
        return MessageDigest.isEqual(expectedEmail.toLowerCase().getBytes(StandardCharsets.UTF_8),email.toLowerCase().getBytes(StandardCharsets.UTF_8))
            && MessageDigest.isEqual(expectedPassword.getBytes(StandardCharsets.UTF_8),password.getBytes(StandardCharsets.UTF_8));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest request){
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Password must be no more than 72 bytes");
        String email=UserIdentity.email(request.email());
        String role=request.role()!=null?request.role():"CUSTOMER";
        if(!java.util.Set.of("CUSTOMER","VENDOR","EMPLOYEE").contains(role))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid registration role");
        if(email.equalsIgnoreCase(adminEmail)||email.equalsIgnoreCase(vendorEmail))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"An administrative account already exists with this email address. Please sign in.");
        
        var now=java.time.LocalDateTime.now();
        boolean pending=java.util.Set.of("EMPLOYEE","VENDOR").contains(role);
        String org = request.organization() != null && !request.organization().isBlank() ? request.organization().trim() : request.companyName() != null ? request.companyName().trim() : "Business Client";
        String loc = request.address() != null ? request.address().trim() : "";
        String phoneStr = UserIdentity.phone(request.phone(), true);
        identities.check(email, phoneStr, null);
        otpService.verifyRegistration(phoneStr, request.otp());

        var user=new SupportUser(request.name().trim(),email,role,org,loc,pending?UserStatus.PENDING:UserStatus.ACTIVE,null,now);
        user.setPhone(phoneStr);
        user.setTradeLicense(request.tradeLicense()==null?"":request.tradeLicense().trim());
        user.setIndustry(request.industry()==null?"":request.industry().trim());
        user.setJobTitle(request.jobTitle()==null?"":request.jobTitle().trim());
        user.setWebsite(request.website()==null?"":request.website().trim());
        user.setEmirate(request.emirate()==null?"Dubai":request.emirate().trim());
        user.setAddress(loc);
        user.setCountry(request.country()==null?"United Arab Emirates":request.country().trim());
        user.setPasswordHash(passwords.encode(request.password()));
        
        SupportUser saved = users.save(user);
        
        if (!pending) {
            String issuedRole = loginRole(saved.getRole());
            Map<String, Object> profile = userProfile(saved, issuedRole);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Account created successfully.",
                "token", jwt.issue(saved.getEmail(), issuedRole),
                "user", profile,
                "email", email,
                "role", role,
                "status", "ACTIVE"
            ));
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "message", "Registration submitted. A Wefyx administrator must approve your " + role.toLowerCase() + " account before sign in.",
            "email", email,
            "role", role,
            "status", "PENDING"
        ));
    }

    private ResponseEntity<?> session(String email,String name,String role){
        return ResponseEntity.ok(Map.of("token",jwt.issue(email,role),"user",Map.of("email",email,"name",name,"role",role)));
    }

    private ResponseEntity<?> session(SupportUser user){
        String role=loginRole(user.getRole());
        return ResponseEntity.ok(Map.of("token",jwt.issue(user.getEmail(),role),"user",userProfile(user, role)));
    }

    private Map<String, Object> userProfile(SupportUser user, String role) {
        Map<String,Object> profile=new java.util.LinkedHashMap<>();
        profile.put("email",user.getEmail());
        profile.put("name",user.getName());
        profile.put("role",role);
        profile.put("organization",user.getOrganization());
        profile.put("phone",user.getPhone()==null?"":user.getPhone());
        profile.put("tradeLicense",user.getTradeLicense()==null?"":user.getTradeLicense());
        profile.put("industry",user.getIndustry()==null?"":user.getIndustry());
        profile.put("jobTitle",user.getJobTitle()==null?"":user.getJobTitle());
        profile.put("website",user.getWebsite()==null?"":user.getWebsite());
        profile.put("emirate",user.getEmirate()==null?"":user.getEmirate());
        profile.put("address",user.getAddress()==null?"":user.getAddress());
        profile.put("country",user.getCountry()==null?"":user.getCountry());
        profile.put("location",user.getLocation()==null?"":user.getLocation());
        return profile;
    }

    private String loginRole(String configuredRole){
        String role=configuredRole==null?"":configuredRole.toUpperCase();
        if(role.contains("SUPER")||role.contains("ADMINISTRATOR"))return "SUPER_ADMIN";
        if(role.contains("CUSTOMER")||role.contains("CLIENT"))return "CUSTOMER";
        if(role.contains("VENDOR")||role.contains("PARTNER"))return "VENDOR";
        return "EMPLOYEE";
    }

    @GetMapping("/me")
    public Map<String,Object> me(Authentication authentication){
        if(authentication==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Session is not valid");
        String email=authentication.getName();
        if(email.equalsIgnoreCase(adminEmail))return Map.of("email",adminEmail,"name","System Administrator","role","SUPER_ADMIN");
        if(!vendorEmail.isBlank()&&email.equalsIgnoreCase(vendorEmail))return Map.of("email",vendorEmail,"name",vendorName,"role","VENDOR");
        var user=users.findByEmailIgnoreCase(email).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Account no longer exists"));
        if(user.getStatus()!=UserStatus.ACTIVE)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Account is not active");
        return userProfile(user, loginRole(user.getRole()));
    }

    public record LoginRequest(String email, String phone, String password){}
    public record PhoneLoginRequest(String phone, String otp){}
    public record RegistrationRequest(
        @NotBlank @Size(max=120) String name,
        @NotBlank @Email @Size(max=254) String email,
        @NotBlank @Size(min=8,max=72) String password,
        String organization,
        String companyName,
        @NotBlank @Size(max=25) String phone,
        String role,
        String tradeLicense,
        String industry,
        String jobTitle,
        String website,
        String emirate,
        String address,
        String country,
        @NotBlank @Pattern(regexp="[0-9]{6}") String otp
    ){
        public RegistrationRequest {
            email = email == null ? null : email.trim();
        }
    }
}

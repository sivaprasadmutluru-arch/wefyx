package com.wefyx.support.config;

import com.wefyx.support.auth.JwtService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Configuration
public class SecurityConfig {
    @Bean SecurityFilterChain security(HttpSecurity http,JwtFilter jwt)throws Exception{return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).exceptionHandling(e->e.authenticationEntryPoint((request,response,error)->response.sendError(HttpServletResponse.SC_UNAUTHORIZED))).authorizeHttpRequests(a->a
        .requestMatchers(HttpMethod.GET,"/api/bookings/catalog","/api/bookings/availability","/api/catalog/products","/api/catalog/products/**","/book-support/**","/my-tickets/**","/service-tasks/**","/support-updates/**","/portal").permitAll()
        .requestMatchers(HttpMethod.POST,"/api/support-requests","/api/orders/stripe/webhook").permitAll()
        .requestMatchers(HttpMethod.GET,"/register","/signup","/join","/login","/signin","/forgot-password","/reset-password","/careers","/become-a-vendor","/rent/**","/rent-equipment","/cart","/account/**","/services","/it-services","/managed-services","/data-center","/amc","/solutions","/business-solutions","/industries","/about","/contact","/support","/shop","/privacy-policy","/terms","/rental-terms","/refund-policy").permitAll()
        .requestMatchers("/","/index.html","/assets/**","/images/**","/payment-icons/**","/favicon.ico","/api","/api/","/api/auth/**","/error").permitAll()
        .requestMatchers(HttpMethod.GET,"/api/users/**").hasAnyRole("SUPER_ADMIN","EMPLOYEE")
        .requestMatchers("/api/users/**","/api/roles/**","/api/dashboard/**","/api/organizations/**","/api/employee-registrations/**","/api/vendor-registrations/**").hasRole("SUPER_ADMIN")
        .requestMatchers("/api/support-requests/**").hasAnyRole("SUPER_ADMIN","EMPLOYEE")
        .anyRequest().authenticated()).addFilterBefore(jwt,UsernamePasswordAuthenticationFilter.class).build();}
}
@Component class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwt; JwtFilter(JwtService jwt){this.jwt=jwt;}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{String auth=request.getHeader("Authorization");if(auth!=null&&auth.startsWith("Bearer ")){var identity=jwt.validateIdentity(auth.substring(7));if(identity!=null){String role=String.valueOf(identity.role()).toUpperCase(java.util.Locale.ROOT).replaceAll("[^A-Z0-9_]","");SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(identity.email(),null,List.of(new SimpleGrantedAuthority("ROLE_"+role))));}}chain.doFilter(request,response);}
}

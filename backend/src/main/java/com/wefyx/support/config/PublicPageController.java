package com.wefyx.support.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Serve the React entry point for public website deep links. */
@Controller
public class PublicPageController {
    @GetMapping({
        "/portal", "/admin", "/admin/{section}", "/admin/{section}/{id}", "/account", "/account/{section}", "/book-support", "/book-support/{step}", "/my-tickets", "/my-tickets/{id}",
        "/service-tasks", "/service-tasks/{id}", "/service-tasks/{id}/report", "/support-updates/{id}",
        "/register", "/signup", "/join", "/login", "/signin", "/forgot-password", "/reset-password",
        "/careers", "/become-a-vendor", "/rent", "/rent/{product}", "/rent-equipment",
        "/cart", "/services", "/it-services", "/managed-services", "/data-center", "/amc",
        "/solutions", "/business-solutions", "/industries", "/about", "/contact",
        "/support", "/shop", "/privacy-policy"
    })
    public String website() {
        return "forward:/index.html";
    }
}

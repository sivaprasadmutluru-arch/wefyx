package com.wefyx.support.user;

import com.wefyx.support.config.AccessControl;
import com.wefyx.support.config.AccessControl.Role;
import com.wefyx.support.order.CustomerOrder;
import com.wefyx.support.order.CustomerOrderRepository;
import com.wefyx.support.requirement.Requirement;
import com.wefyx.support.requirement.RequirementRepository;
import com.wefyx.support.requirement.VendorQuotation;
import com.wefyx.support.requirement.VendorQuotationRepository;
import com.wefyx.support.resource.ResourceRecord;
import com.wefyx.support.resource.ResourceRepository;
import com.wefyx.support.ticket.SupportTicket;
import com.wefyx.support.ticket.TicketRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/admin/users")
public class UserInsightsController {
    private final UserRepository users;
    private final CustomerOrderRepository orders;
    private final RequirementRepository requirements;
    private final TicketRepository tickets;
    private final VendorQuotationRepository quotations;
    private final ResourceRepository resources;
    private final AccessControl access;

    public UserInsightsController(UserRepository users,CustomerOrderRepository orders,RequirementRepository requirements,TicketRepository tickets,VendorQuotationRepository quotations,ResourceRepository resources,AccessControl access){
        this.users=users;this.orders=orders;this.requirements=requirements;this.tickets=tickets;this.quotations=quotations;this.resources=resources;this.access=access;
    }

    @GetMapping("/{id}/insights")
    public Insights insights(@PathVariable Long id, Authentication auth){
        access.require(auth,Role.SUPER_ADMIN,Role.EMPLOYEE);
        var user=users.findById(id).orElseThrow();
        String email=clean(user.getEmail()), name=clean(user.getName()), org=clean(user.getOrganization()), role=String.valueOf(user.getRole()).toUpperCase(Locale.ROOT);
        var customerOrders=orders.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().limit(50).toList();
        var customerRequirements=requirements.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().limit(50).toList();
        var employeeRequirements=requirements.findAll().stream().filter(r->same(r.getEmployeeEmail(),email)||same(r.getEmployeeName(),name)).sorted(byCreatedRequirement()).limit(50).toList();
        var vendorQuotes=quotations.findByVendorEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().limit(50).toList();
        var vendorRequirementIds=vendorQuotes.stream().map(VendorQuotation::getRequirementId).filter(Objects::nonNull).collect(java.util.stream.Collectors.toSet());
        var vendorRequirements=requirements.findAll().stream().filter(r->vendorRequirementIds.contains(r.getId())||same(r.getVendorName(),email)||same(r.getVendorName(),name)||contains(r.getVendorName(),org)).sorted(byCreatedRequirement()).limit(50).toList();
        var customerTickets=tickets.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().limit(50).toList();
        var employeeTickets=tickets.findByAssigneeEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().limit(50).toList();
        var audit=resources.findByModuleKeyOrderByCreatedAtDesc("audit-logs").stream().filter(row->contains(row.getDetails(),email)||contains(row.getDetails(),name)||contains(row.getDetails(),org)||contains(row.getOwner(),name)).limit(50).toList();
        BigDecimal orderValue=customerOrders.stream().map(CustomerOrder::getTotal).filter(Objects::nonNull).reduce(BigDecimal.ZERO,BigDecimal::add);
        long completedTickets=employeeTickets.stream().filter(t->Set.of("RESOLVED","CLOSED").contains(String.valueOf(t.getStatus()))).count();
        long completedOrders=customerOrders.stream().filter(o->"COMPLETED".equals(o.getStatus())).count();
        long submittedQuotes=vendorQuotes.stream().filter(q->q.getAmount()!=null).count();
        Map<String,Object> metrics=new LinkedHashMap<>();
        metrics.put("accountType",accountType(role));metrics.put("orders",customerOrders.size());metrics.put("orderValue",orderValue);metrics.put("completedOrders",completedOrders);
        metrics.put("customerRequirements",customerRequirements.size());metrics.put("employeeRequirements",employeeRequirements.size());metrics.put("vendorRequirements",vendorRequirements.size());
        metrics.put("customerTickets",customerTickets.size());metrics.put("employeeTickets",employeeTickets.size());metrics.put("resolvedEmployeeTickets",completedTickets);metrics.put("vendorQuotes",vendorQuotes.size());metrics.put("submittedQuotes",submittedQuotes);metrics.put("auditEvents",audit.size());
        return new Insights(metrics,customerOrders,customerRequirements,employeeRequirements,vendorRequirements,customerTickets,employeeTickets,vendorQuotes,audit);
    }

    private static Comparator<Requirement> byCreatedRequirement(){return Comparator.comparing(Requirement::getCreatedAt,Comparator.nullsLast(Comparator.naturalOrder())).reversed();}
    private static String accountType(String role){if(role.contains("VENDOR")||role.contains("PARTNER"))return "vendor";if(role.contains("TECH")||role.contains("ENGINEER")||role.contains("NOC")||role.contains("AGENT")||role.contains("OPERATIONS")||role.contains("SERVICE DELIVERY"))return "employee";if(role.contains("SUPER")||role.contains("ADMIN"))return "admin";return "customer";}
    private static String clean(String value){return value==null?"":value.trim();}
    private static boolean same(String a,String b){return !clean(a).isBlank()&&clean(a).equalsIgnoreCase(clean(b));}
    private static boolean contains(String value,String needle){return !clean(value).isBlank()&&!clean(needle).isBlank()&&clean(value).toLowerCase(Locale.ROOT).contains(clean(needle).toLowerCase(Locale.ROOT));}
    public record Insights(Map<String,Object> metrics,List<CustomerOrder> orders,List<Requirement> customerRequirements,List<Requirement> employeeRequirements,List<Requirement> vendorRequirements,List<SupportTicket> customerTickets,List<SupportTicket> employeeTickets,List<VendorQuotation> vendorQuotes,List<ResourceRecord> auditEvents){}
}

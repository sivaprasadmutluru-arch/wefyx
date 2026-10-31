package com.wefyx.support.requirement;

import com.wefyx.support.config.AccessControl;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;

/** Strict procurement workflow endpoints. Legacy quotation endpoints remain available for existing clients. */
@RestController
@RequestMapping("/api/requirements/{requestId}/quotations")
public class QuotationWorkflowController {
    private final QuotationWorkflowService workflow; private final VendorQuotationRepository quotations; private final RequirementRepository requirements; private final AgreedPricingRepository snapshots; private final AccessControl access;
    public QuotationWorkflowController(QuotationWorkflowService w,VendorQuotationRepository q,RequirementRepository r,AgreedPricingRepository s,AccessControl a){workflow=w;quotations=q;requirements=r;snapshots=s;access=a;}
    @PostMapping("/submit") @ResponseStatus(HttpStatus.CREATED)
    public VendorQuotation submit(@PathVariable Long requestId,@RequestBody Map<String,Object> body,Authentication auth){return workflow.submit(requestId,body,auth);}
    @GetMapping("/comparison")
    public List<VendorQuotation> comparison(@PathVariable Long requestId,Authentication auth){workflow.requireStaffAccess(requirements.findById(requestId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Requirement not found")),auth);return quotations.findByRequirementIdOrderByAmountAsc(requestId);}
    @PatchMapping("/{quotationId}/review")
    public VendorQuotation review(@PathVariable Long requestId,@PathVariable Long quotationId,@RequestBody Map<String,String> body,Authentication auth){return workflow.review(requestId,quotationId,body.get("action"),body.get("notes"),auth);}
    @PatchMapping("/{quotationId}/confirm")
    public Object confirm(@PathVariable Long requestId,@PathVariable Long quotationId,@RequestBody Map<String,String> body,Authentication auth,HttpServletRequest request){String decision=body.getOrDefault("decision",body.getOrDefault("action","CONFIRM"));return workflow.confirm(requestId,quotationId,"CONFIRM".equalsIgnoreCase(decision)||"ACCEPT".equalsIgnoreCase(decision),body.get("reason"),auth,request);}
    @GetMapping("/agreed-pricing")
    public AgreedPricing agreed(@PathVariable Long requestId,Authentication auth){Requirement requirement=requirements.findById(requestId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Requirement not found"));AccessControl.Role role=access.role(auth);if(role==AccessControl.Role.EMPLOYEE)workflow.requireStaffAccess(requirement,auth);if(role==AccessControl.Role.VENDOR){var snapshot=snapshots.findByRequirementId(requestId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"No agreed pricing record"));if(!auth.getName().equalsIgnoreCase(snapshot.getVendorEmail()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Not your quotation");return snapshot;}if(role==AccessControl.Role.CUSTOMER&&!auth.getName().equalsIgnoreCase(requirement.getCustomerEmail()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Not your requirement");return snapshots.findByRequirementId(requestId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"No agreed pricing record"));}
}

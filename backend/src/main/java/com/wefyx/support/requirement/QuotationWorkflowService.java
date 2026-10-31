package com.wefyx.support.requirement;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wefyx.support.config.AccessControl;
import com.wefyx.support.notification.NotificationService;
import com.wefyx.support.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class QuotationWorkflowService {
    private final RequirementRepository requirements; private final VendorQuotationRepository quotations; private final AgreedPricingRepository snapshots;
    private final AccessControl access; private final UserRepository users; private final NotificationService notifications; private final ObjectMapper json;
    public QuotationWorkflowService(RequirementRepository r, VendorQuotationRepository q, AgreedPricingRepository s, AccessControl a, UserRepository u, NotificationService n, ObjectMapper j){requirements=r;quotations=q;snapshots=s;access=a;users=u;notifications=n;json=j;}

    @Transactional public VendorQuotation submit(Long requestId, Map<String,Object> body, Authentication auth){
        access.require(auth, AccessControl.Role.VENDOR); Requirement request=lockedRequest(requestId); String email=auth.getName();
        List<VendorQuotation> mine=quotations.findByRequirementIdAndVendorEmailIgnoreCaseOrderByVersionDesc(requestId,email);
        if(mine.isEmpty()) forbidden("Vendor was not invited"); VendorQuotation latest=mine.get(0);
        if(latest.getStatus()!=VendorQuotationStatus.INVITED && latest.getStatus()!=VendorQuotationStatus.ACCEPTED && latest.getStatus()!=VendorQuotationStatus.REVISION_REQUESTED) invalid("This quotation cannot be edited");
        VendorQuotation quote;
        if(latest.getStatus()==VendorQuotationStatus.REVISION_REQUESTED){ quote=copyForRevision(latest); } else quote=latest;
        quote.setAmount(decimal(body,"grandTotal","amount")); quote.setGrandTotal(decimal(body,"grandTotal","amount")); quote.setSubtotal(decimalOptional(body,"subtotal")); quote.setTaxAmount(decimalOptional(body,"taxAmount","tax")); quote.setDiscountAmount(decimalOptional(body,"discountAmount","discount"));
        quote.setLeadTimeDays(integer(body,"leadTimeDays")); quote.setDeliveryDate(date(body,"deliveryDate")); quote.setValidUntil(date(body,"validUntil","validityExpirationDate")); quote.setPaymentTerms(text(body,"paymentTerms","serviceTerms")); quote.setAttachmentUrl(text(body,"attachmentUrl","attachment")); quote.setNotes(text(body,"notes","terms")); quote.setLineItemsJson(asJson(body.getOrDefault("lineItems",List.of()))); quote.setStatus(VendorQuotationStatus.SUBMITTED); quote.setSubmittedAt(LocalDateTime.now());
        VendorQuotation saved=quotations.save(quote); request.setQuotationStatus(QuotationStatus.QUOTES_RECEIVED); if(request.getStatus()==RequirementStatus.SENT_TO_VENDOR || request.getStatus()==RequirementStatus.REQUEST_CREATED) request.setStatus(RequirementStatus.QUOTATIONS_RECEIVED); requirements.save(request);
        notifyStaff(request,"QUOTATION_SUBMITTED","Vendor quotation submitted",request.getReference()+" · "+saved.getVendorName()+" submitted v"+saved.getVersion()); return saved;
    }
    @Transactional public VendorQuotation review(Long requestId,Long quoteId,String action,String notes,Authentication auth){
        Requirement request=lockedRequest(requestId); requireStaffAccess(request,auth); VendorQuotation quote=lockedQuote(quoteId,requestId);
        if(quote.getStatus()!=VendorQuotationStatus.SUBMITTED && quote.getStatus()!=VendorQuotationStatus.UNDER_REVIEW) invalid("Only submitted quotations can be reviewed");
        if("REQUEST_REVISION".equals(action)){ if(blank(notes)) bad("feedback notes are required"); quote.setStatus(VendorQuotationStatus.REVISION_REQUESTED); quote.setReviewNotes(notes); quotations.save(quote); notifyVendor(quote,request,"QUOTATION_REVISION_REQUESTED","Quotation revision requested",notes); return quote; }
        if("REJECT".equals(action)){ if(blank(notes)) bad("review notes are required"); quote.setStatus(VendorQuotationStatus.REJECTED); quote.setReviewNotes(notes); quotations.save(quote); notifyVendor(quote,request,"QUOTATION_REJECTED","Quotation rejected",notes); return quote; }
        if(!"APPROVE".equals(action)) bad("action must be REQUEST_REVISION, REJECT, or APPROVE");
        if(!quotations.findByRequirementIdAndStatus(requestId,VendorQuotationStatus.STAFF_APPROVED).isEmpty()) invalid("Only one quotation may be staff-approved");
        quote.setStatus(VendorQuotationStatus.STAFF_APPROVED); quote.setReviewNotes(notes); quote.setApprovedByStaffId(users.findByEmailIgnoreCase(auth.getName()).map(x->x.getId()).orElse(null)); quotations.save(quote);
        request.setSelectedQuotationId(quoteId); request.setStatus(RequirementStatus.AWAITING_EMPLOYEE_CONFIRMATION); requirements.save(request);
        notifications.send(request.getCustomerEmail(),requestId,"QUOTATION_STAFF_APPROVED","Quotation ready for confirmation",request.getReference()+" · Please confirm the approved quotation."); return quote;
    }
    @Transactional public Object confirm(Long requestId,Long quoteId,boolean accepted,String reason,Authentication auth,HttpServletRequest http){
        Requirement request=lockedRequest(requestId); requireRequester(request,auth); VendorQuotation quote=lockedQuote(quoteId,requestId);
        if(quote.getStatus()!=VendorQuotationStatus.STAFF_APPROVED || request.getStatus()!=RequirementStatus.AWAITING_EMPLOYEE_CONFIRMATION) invalid("Quotation is not awaiting employee confirmation");
        if(!accepted){if(blank(reason)) bad("decline reason is required"); quote.setStatus(VendorQuotationStatus.REJECTED);quote.setReviewNotes(reason);quotations.save(quote);request.setStatus(RequirementStatus.EMPLOYEE_DECLINED);requirements.save(request);notifyStaff(request,"QUOTATION_EMPLOYEE_DECLINED","Employee declined approved quotation",reason);notifyVendor(quote,request,"QUOTATION_EMPLOYEE_DECLINED","Approved quotation declined",reason);return quote;}
        Optional<AgreedPricing> existing=snapshots.findByRequirementId(requestId); if(existing.isPresent()) return existing.get();
        AgreedPricing snapshot=new AgreedPricing(); snapshot.setRequirementId(requestId);snapshot.setQuotationId(quoteId);snapshot.setVendorEmail(quote.getVendorEmail());snapshot.setEmployeeEmail(auth.getName());snapshot.setApprovedByStaffId(quote.getApprovedByStaffId());snapshot.setSubtotal(value(quote.getSubtotal(),quote.getAmount()));snapshot.setTaxAmount(value(quote.getTaxAmount(),BigDecimal.ZERO));snapshot.setDiscountAmount(value(quote.getDiscountAmount(),BigDecimal.ZERO));snapshot.setTotalCost(value(quote.getGrandTotal(),quote.getAmount()));snapshot.setFrozenSnapshot(asJson(frozen(request,quote)));snapshot.setPurchaseOrderReference("PO-"+request.getReference()+"-"+UUID.randomUUID().toString().substring(0,8).toUpperCase(Locale.ROOT));snapshot.setConfirmedIp(http.getRemoteAddr()); snapshots.save(snapshot);
        quote.setStatus(VendorQuotationStatus.FINAL_CONFIRMED);quotations.save(quote);request.setAgreedAmount(snapshot.getTotalCost());request.setVendorName(quote.getVendorEmail());request.setQuotationStatus(QuotationStatus.CUSTOMER_SELECTED);request.setStatus(RequirementStatus.AGREED_PRICING_RECORDED);requirements.save(request); notifyStaff(request,"QUOTATION_CONFIRMED","Employee confirmed quotation",snapshot.getPurchaseOrderReference());notifyVendor(quote,request,"QUOTATION_CONFIRMED","Quotation confirmed",snapshot.getPurchaseOrderReference());return snapshot;
    }
    private Requirement lockedRequest(Long id){return requirements.findWithLockById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Requirement not found"));} private VendorQuotation lockedQuote(Long id,Long requestId){VendorQuotation q=quotations.findWithLockById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Quotation not found"));if(!requestId.equals(q.getRequirementId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Quotation not found");return q;}
    private VendorQuotation copyForRevision(VendorQuotation old){VendorQuotation n=new VendorQuotation();n.setRequirementId(old.getRequirementId());n.setVendorEmail(old.getVendorEmail());n.setVendorName(old.getVendorName());n.setParentQuotationId(old.getId());n.setVersion(old.getVersion()+1);return n;}
    public void requireStaffAccess(Requirement request,Authentication auth){
        var role=access.require(auth,AccessControl.Role.SUPER_ADMIN,AccessControl.Role.EMPLOYEE);
        if(role==AccessControl.Role.EMPLOYEE&&request.getEmployeeEmail()!=null&&!request.getEmployeeEmail().isBlank()&&!auth.getName().equalsIgnoreCase(request.getEmployeeEmail()))forbidden("This requirement is assigned to another employee");
    }
    private void requireRequester(Requirement r,Authentication a){AccessControl.Role role=access.role(a);if(role==AccessControl.Role.SUPER_ADMIN)return;if((role==AccessControl.Role.CUSTOMER||role==AccessControl.Role.EMPLOYEE)&&a.getName().equalsIgnoreCase(r.getCustomerEmail()))return;throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Only the requesting employee can confirm this quotation");}
    private void notifyStaff(Requirement r,String type,String title,String msg){users.findAll().stream().filter(u->u.getStatus()==com.wefyx.support.user.UserStatus.ACTIVE&&u.getRole()!=null&&(u.getRole().toUpperCase().contains("EMPLOYEE")||u.getRole().toUpperCase().contains("ADMIN"))).forEach(u->notifications.send(u.getEmail(),r.getId(),type,title,msg));} private void notifyVendor(VendorQuotation q,Requirement r,String type,String title,String msg){notifications.send(q.getVendorEmail(),r.getId(),type,title,msg);}
    private Map<String,Object> frozen(Requirement r,VendorQuotation q){Map<String,Object> m=new LinkedHashMap<>();m.put("requestReference",r.getReference());m.put("quotationId",q.getId());m.put("version",q.getVersion());m.put("lineItems",readJson(q.getLineItemsJson()));m.put("subtotal",q.getSubtotal());m.put("taxAmount",q.getTaxAmount());m.put("discountAmount",q.getDiscountAmount());m.put("grandTotal",q.getGrandTotal());m.put("deliveryDate",q.getDeliveryDate());m.put("leadTimeDays",q.getLeadTimeDays());m.put("validUntil",q.getValidUntil());m.put("paymentTerms",q.getPaymentTerms());m.put("attachmentUrl",q.getAttachmentUrl());return m;}
    private Object readJson(String v){try{return v==null?List.of():json.readValue(v,Object.class);}catch(Exception e){return List.of();}} private String asJson(Object o){try{return json.writeValueAsString(o);}catch(JsonProcessingException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid line items");}}
    private static BigDecimal decimal(Map<String,Object>b,String...keys){BigDecimal v=decimalOptional(b,keys);if(v==null||v.signum()<0) bad("A non-negative total is required");return v;} private static BigDecimal decimalOptional(Map<String,Object>b,String...keys){for(String k:keys){Object x=b.get(k);if(x!=null&&!String.valueOf(x).isBlank())try{return new BigDecimal(String.valueOf(x));}catch(NumberFormatException e){bad("Invalid "+k);}}return null;} private static Integer integer(Map<String,Object>b,String k){Object x=b.get(k);if(x==null||String.valueOf(x).isBlank())return null;try{return Integer.valueOf(String.valueOf(x));}catch(NumberFormatException e){bad("Invalid "+k);return null;}} private static LocalDate date(Map<String,Object>b,String...keys){for(String k:keys){Object x=b.get(k);if(x!=null&&!String.valueOf(x).isBlank())try{return LocalDate.parse(String.valueOf(x));}catch(Exception e){bad("Invalid "+k);}}return null;} private static String text(Map<String,Object>b,String...keys){for(String k:keys)if(b.get(k)!=null)return String.valueOf(b.get(k));return null;}private static BigDecimal value(BigDecimal a,BigDecimal b){return a==null?b:a;}private static boolean blank(String s){return s==null||s.isBlank();}private static void bad(String s){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}private static void invalid(String s){throw new ResponseStatusException(HttpStatus.CONFLICT,s);}private static void forbidden(String s){throw new ResponseStatusException(HttpStatus.FORBIDDEN,s);}
}

package com.wefyx.support.offer;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;

@Service
public class ShopOfferService {
    private final ShopOfferRepository offers;
    public ShopOfferService(ShopOfferRepository offers){this.offers=offers;}
    public LocalDate today(){return LocalDate.now(ZoneId.of("Asia/Dubai"));}
    public boolean available(ShopOffer offer){return offer.active&&(offer.startsOn==null||!today().isBefore(offer.startsOn))&&(offer.endsOn==null||!today().isAfter(offer.endsOn));}
    public Discount apply(String raw,java.util.List<Line> lines){
        if(raw==null||raw.isBlank())return new Discount(null,BigDecimal.ZERO.setScale(2));
        String code=raw.trim().toUpperCase(Locale.ROOT);
        if(code.length()>40)throw invalid("Invalid promo code");
        ShopOffer offer=offers.findByCodeIgnoreCase(code).orElseThrow(()->invalid("Promo code not found"));
        if(!available(offer))throw invalid("This offer is inactive, expired, or has not started yet");
        BigDecimal eligible=lines.stream().filter(line->("ALL".equals(offer.mode)||offer.mode.equals(line.mode()))&&(offer.productCodes==null||offer.productCodes.isEmpty()||offer.productCodes.contains(line.productCode()))).map(Line::total).reduce(BigDecimal.ZERO,BigDecimal::add);
        if(eligible.signum()<=0)throw invalid("This promo code does not apply to the selected items");
        if(eligible.compareTo(offer.minimumSubtotal)<0)throw invalid("This offer requires AED "+offer.minimumSubtotal+" in eligible items before VAT");
        BigDecimal amount="PERCENT".equals(offer.discountType)?eligible.multiply(offer.discountValue).divide(new BigDecimal("100"),2,RoundingMode.HALF_UP):offer.discountValue;
        if(offer.maximumDiscount!=null)amount=amount.min(offer.maximumDiscount);
        return new Discount(offer.code,amount.min(eligible).setScale(2,RoundingMode.HALF_UP));
    }
    public void validate(ShopOffer offer){
        offer.code=offer.code==null?"":offer.code.trim().toUpperCase(Locale.ROOT);
        if(!offer.code.matches("[A-Z0-9][A-Z0-9_-]{1,39}"))throw invalid("Use a promo code of 2–40 letters, numbers, hyphens or underscores");
        offer.title=offer.title==null?"":offer.title.trim();
        if(offer.title.isBlank()||offer.title.length()>160)throw invalid("Offer title must be 1–160 characters");
        if(!java.util.Set.of("PERCENT","FIXED").contains(String.valueOf(offer.discountType)))throw invalid("Choose percentage or fixed discount");
        if(!java.util.Set.of("BUY","RENT","ALL").contains(String.valueOf(offer.mode)))throw invalid("Choose eligible purchase or rental items");
        if(offer.discountValue==null||offer.discountValue.signum()<=0||offer.discountValue.scale()>2||offer.discountValue.compareTo(new BigDecimal("999999999999.99"))>0)throw invalid("Enter a positive discount with at most two decimal places");
        if("PERCENT".equals(offer.discountType)&&offer.discountValue.compareTo(new BigDecimal("100"))>0)throw invalid("Percentage must not exceed 100");
        if(offer.minimumSubtotal==null)offer.minimumSubtotal=BigDecimal.ZERO;
        if(offer.minimumSubtotal.signum()<0||offer.minimumSubtotal.scale()>2||offer.minimumSubtotal.compareTo(new BigDecimal("999999999999.99"))>0)throw invalid("Enter a valid minimum order amount");
        if(offer.maximumDiscount!=null&&(offer.maximumDiscount.signum()<=0||offer.maximumDiscount.scale()>2||offer.maximumDiscount.compareTo(new BigDecimal("999999999999.99"))>0))throw invalid("Maximum savings must be positive");
        if(offer.startsOn!=null&&offer.endsOn!=null&&offer.endsOn.isBefore(offer.startsOn))throw invalid("Expiry cannot be before the start date");
        if(offer.productCodes==null)offer.productCodes=new java.util.LinkedHashSet<>();
        if(offer.productCodes.size()>500)throw invalid("Select at most 500 products");
        if(offer.productCodes.stream().anyMatch(code->code==null||!code.matches("[a-z0-9-]{1,255}")))throw invalid("Invalid product code");
        if(offers.existsByCodeIgnoreCaseAndIdNot(offer.code,offer.id==null?-1L:offer.id))throw new ResponseStatusException(HttpStatus.CONFLICT,"Promo code already exists");
    }
    private ResponseStatusException invalid(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    public record Line(String productCode,String mode,BigDecimal total){}
    public record Discount(String code,BigDecimal amount){}
}

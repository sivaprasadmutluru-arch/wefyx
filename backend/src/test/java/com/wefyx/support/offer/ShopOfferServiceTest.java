package com.wefyx.support.offer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ShopOfferServiceTest {
    ShopOfferRepository repository;ShopOfferService service;ShopOffer offer;
    @BeforeEach void setup(){repository=mock(ShopOfferRepository.class);service=new ShopOfferService(repository);offer=new ShopOffer();offer.code="SAVE10";offer.title="Product discount";offer.active=true;offer.discountValue=new BigDecimal("10");when(repository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(offer));}
    List<ShopOfferService.Line> lines(){return List.of(new ShopOfferService.Line("laptop","BUY",new BigDecimal("1000")),new ShopOfferService.Line("monitor","BUY",new BigDecimal("500")),new ShopOfferService.Line("laptop","RENT",new BigDecimal("200")));}
    @Test void percentageUsesEligiblePurchaseSubtotalOnly(){assertEquals(new BigDecimal("150.00"),service.apply(" save10 ",lines()).amount());}
    @Test void productTargetingAndRentalScopeAreBothEnforced(){offer.productCodes=Set.of("laptop");offer.mode="RENT";assertEquals(new BigDecimal("20.00"),service.apply("SAVE10",lines()).amount());}
    @Test void selectedProductMinimumCannotBeMetWithOtherProducts(){offer.productCodes=Set.of("monitor");offer.minimumSubtotal=new BigDecimal("600");assertThrows(ResponseStatusException.class,()->service.apply("SAVE10",lines()));}
    @Test void capsSavingsAndRoundsCurrency(){offer.discountValue=new BigDecimal("33.33");offer.maximumDiscount=new BigDecimal("40");assertEquals(new BigDecimal("40.00"),service.apply("SAVE10",lines()).amount());}
    @Test void fixedDiscountCannotExceedEligibleItems(){offer.discountType="FIXED";offer.discountValue=new BigDecimal("2000");offer.productCodes=Set.of("monitor");assertEquals(new BigDecimal("500.00"),service.apply("SAVE10",lines()).amount());}
    @Test void inactiveExpiredAndFutureOffersAreRejected(){offer.active=false;assertThrows(ResponseStatusException.class,()->service.apply("SAVE10",lines()));offer.active=true;offer.endsOn=service.today().minusDays(1);assertThrows(ResponseStatusException.class,()->service.apply("SAVE10",lines()));offer.endsOn=null;offer.startsOn=service.today().plusDays(1);assertThrows(ResponseStatusException.class,()->service.apply("SAVE10",lines()));}
    @Test void inclusiveDatesAndUnknownCodes(){offer.startsOn=service.today();offer.endsOn=service.today();assertEquals(new BigDecimal("150.00"),service.apply("SAVE10",lines()).amount());assertThrows(ResponseStatusException.class,()->service.apply("INVALID",lines()));}
    @Test void noCodeDoesNotDiscountOrQueryRepository(){assertEquals(new BigDecimal("0.00"),service.apply("",lines()).amount());verify(repository,never()).findByCodeIgnoreCase(anyString());}
    @Test void invalidAdminDiscountsAndDatesAreRejected(){offer.discountValue=new BigDecimal("101");assertThrows(ResponseStatusException.class,()->service.validate(offer));offer.discountValue=new BigDecimal("10");offer.startsOn=service.today();offer.endsOn=service.today().minusDays(1);assertThrows(ResponseStatusException.class,()->service.validate(offer));}
    @Test void promoIsRevalidatedAfterBeingDisabled(){service.apply("SAVE10",lines());offer.active=false;assertThrows(ResponseStatusException.class,()->service.apply("SAVE10",lines()));}
}

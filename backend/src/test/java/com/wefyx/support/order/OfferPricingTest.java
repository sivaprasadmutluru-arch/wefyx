package com.wefyx.support.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wefyx.support.catalog.*;
import com.wefyx.support.offer.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OfferPricingTest {
    CatalogProductRepository products=mock(CatalogProductRepository.class);
    ShopOfferRepository offers=mock(ShopOfferRepository.class);
    CustomerOrderController controller=new CustomerOrderController(null,products,null,null,null,null,null,new ObjectMapper(),new ShopOfferService(offers),null,null);
    CatalogProduct product(){CatalogProduct p=new CatalogProduct();p.setCode("laptop");p.setName("Laptop");p.setBuyPrice(new BigDecimal("1000.00"));p.setRentalPrice(new BigDecimal("100.00"));p.setStockQuantity(10);when(products.findByCodeIgnoreCase("laptop")).thenReturn(Optional.of(p));return p;}
    CustomerOrderController.Create request(String mode,int quantity,String code){return new CustomerOrderController.Create(List.of(new CustomerOrderController.Item("laptop","Fake name",mode,new BigDecimal("0.01"),quantity,1,new BigDecimal("0.01"),"MONTH",1,null)),null,null,null,false,null,code);}
    @Test void previewUsesTrustedPricesAndDiscountedVatWithoutReservingInventory(){CatalogProduct product=product();ShopOffer o=new ShopOffer();o.code="SAVE10";o.active=true;o.discountValue=new BigDecimal("10");when(offers.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(o));var quote=controller.preview(request("BUY",2,"SAVE10"));assertEquals(new BigDecimal("2000.00"),quote.subtotal());assertEquals(new BigDecimal("200.00"),quote.discountAmount());assertEquals(new BigDecimal("90.00"),quote.vat());assertEquals(new BigDecimal("1890.00"),quote.amountDue());assertEquals(10,product.getStockQuantity());verify(products,never()).save(any());}
    @Test void changedQuantityRecalculatesDiscountAndTotal(){product();ShopOffer o=new ShopOffer();o.code="SAVE10";o.active=true;o.discountValue=new BigDecimal("10");when(offers.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(o));assertEquals(new BigDecimal("945.00"),controller.preview(request("BUY",1,"SAVE10")).amountDue());assertEquals(new BigDecimal("2835.00"),controller.preview(request("BUY",3,"SAVE10")).amountDue());}
    @Test void invalidProductOrStockCannotReceivePreview(){product();assertThrows(ResponseStatusException.class,()->controller.preview(request("BUY",11,null)));}
    @Test void rentalDepositIsNotDiscounted(){product();ShopOffer o=new ShopOffer();o.code="SAVE10";o.active=true;o.mode="RENT";o.discountValue=new BigDecimal("10");when(offers.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(o));var quote=controller.preview(request("RENT",1,"SAVE10"));assertEquals(new BigDecimal("20.00"),quote.securityDeposit());assertEquals(new BigDecimal("114.50"),quote.amountDue());}
}

package com.wefyx.support.offer;

import com.wefyx.support.config.AccessControl;
import com.wefyx.support.config.AccessControl.Role;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Comparator;
import java.util.List;

@RestController @RequestMapping("/api/offers")
public class ShopOfferController {
    private final ShopOfferRepository offers;
    private final ShopOfferService service;
    private final AccessControl access;
    public ShopOfferController(ShopOfferRepository offers,ShopOfferService service,AccessControl access){this.offers=offers;this.service=service;this.access=access;}
    @GetMapping public List<ShopOffer> list(@RequestParam(defaultValue="false") boolean all,Authentication auth){if(all)access.require(auth,Role.SUPER_ADMIN);return offers.findAll().stream().filter(o->all||service.available(o)).sorted(Comparator.comparing(o->o.code)).toList();}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ShopOffer create(@RequestBody ShopOffer offer,Authentication auth){access.require(auth,Role.SUPER_ADMIN);offer.id=null;service.validate(offer);return offers.save(offer);}
    @PutMapping("/{id}") public ShopOffer update(@PathVariable Long id,@RequestBody ShopOffer input,Authentication auth){access.require(auth,Role.SUPER_ADMIN);var offer=offers.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Offer not found"));input.id=id;service.validate(input);offer.code=input.code;offer.title=input.title;offer.discountType=input.discountType;offer.discountValue=input.discountValue;offer.minimumSubtotal=input.minimumSubtotal;offer.maximumDiscount=input.maximumDiscount;offer.mode=input.mode;offer.startsOn=input.startsOn;offer.endsOn=input.endsOn;offer.active=input.active;offer.productCodes=new java.util.LinkedHashSet<>(input.productCodes);return offers.save(offer);}
}

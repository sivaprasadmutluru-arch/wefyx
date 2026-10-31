package com.wefyx.support.offer;

import com.wefyx.support.order.CustomerOrderController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestControllerAdvice(assignableTypes={ShopOfferController.class,CustomerOrderController.class})
public class OfferErrors {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException error){return ResponseEntity.status(error.getStatusCode()).body(Map.of("message",error.getReason()==null?"Unable to complete this request":error.getReason()));}
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    ResponseEntity<?> conflict(){return ResponseEntity.status(409).body(Map.of("message","This record changed or its code already exists. Refresh and try again."));}
}

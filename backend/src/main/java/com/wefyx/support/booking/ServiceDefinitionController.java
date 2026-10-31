package com.wefyx.support.booking;
import com.wefyx.support.config.AccessControl;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.DayOfWeek;
import java.util.*;

@RestController @RequestMapping("/api/service-definitions")
public class ServiceDefinitionController {
 private final ServiceDefinitionRepository services;private final AccessControl access;
 public ServiceDefinitionController(ServiceDefinitionRepository services,AccessControl access){this.services=services;this.access=access;}
 @GetMapping public List<ServiceDefinition> list(Authentication auth){access.require(auth,AccessControl.Role.SUPER_ADMIN);return services.findAll().stream().sorted(Comparator.comparing(s->s.name)).toList();}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public ServiceDefinition create(@Valid @RequestBody ServiceDefinition input,Authentication auth){access.require(auth,AccessControl.Role.SUPER_ADMIN);if(services.existsById(input.code))throw new ResponseStatusException(HttpStatus.CONFLICT,"Service code already exists.");validate(input);return services.save(input);}
 @PutMapping("/{code}") public ServiceDefinition update(@PathVariable String code,@Valid @RequestBody ServiceDefinition input,Authentication auth){access.require(auth,AccessControl.Role.SUPER_ADMIN);if(!services.existsById(code))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Service not found.");if(!code.equals(input.code))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Service code cannot be changed.");validate(input);return services.save(input);}
 private void validate(ServiceDefinition input){if(input.closingHour<=input.openingHour||input.slotMinutes>(input.closingHour-input.openingHour)*60)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Closing time must follow opening time and fit a complete appointment.");try{input.workingDays=Arrays.stream(input.workingDays.split(",")).map(String::trim).map(String::toUpperCase).map(DayOfWeek::valueOf).distinct().map(Enum::name).collect(java.util.stream.Collectors.joining(","));}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose valid working days.");}}
}

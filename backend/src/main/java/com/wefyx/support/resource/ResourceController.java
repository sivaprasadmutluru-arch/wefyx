package com.wefyx.support.resource;
import jakarta.validation.Valid;import org.springframework.http.HttpStatus;import org.springframework.web.bind.annotation.*;import java.util.List;
@RestController @RequestMapping("/api/resources") public class ResourceController{
 private final ResourceRepository repository; private final AuditService audit; public ResourceController(ResourceRepository r,AuditService a){repository=r;audit=a;}
 @GetMapping("/{module}") public List<ResourceRecord> all(@PathVariable String module){return repository.findByModuleKeyOrderByCreatedAtDesc(module);}
 @PostMapping("/{module}") @ResponseStatus(HttpStatus.CREATED) public ResourceRecord create(@PathVariable String module,@Valid @RequestBody ResourceRecord record){record.setModuleKey(module);ResourceRecord saved=repository.save(record);if(!module.equals("audit-logs"))audit.log("Create Record",module,saved.getName());return saved;}
 @PutMapping("/{module}/{id}") public ResourceRecord update(@PathVariable String module,@PathVariable Long id,@Valid @RequestBody ResourceRecord input){var r=find(module,id);r.setName(input.getName());r.setOwner(input.getOwner());r.setDetails(input.getDetails());r.setStatus(input.getStatus());ResourceRecord saved=repository.save(r);if(!module.equals("audit-logs"))audit.log("Update Record",module,saved.getName());return saved;}
 @PatchMapping("/{module}/{id}/status") public ResourceRecord status(@PathVariable String module,@PathVariable Long id,@RequestBody ResourceRecord input){var r=find(module,id);r.setStatus(input.getStatus());return repository.save(r);}
 @DeleteMapping("/{module}/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable String module,@PathVariable Long id){ResourceRecord record=find(module,id);repository.delete(record);if(!module.equals("audit-logs"))audit.log("Delete Record",module,record.getName());}
 private ResourceRecord find(String module,Long id){return repository.findById(id).filter(record->module.equals(record.getModuleKey())).orElseThrow(()->new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND,"Record not found"));}
}

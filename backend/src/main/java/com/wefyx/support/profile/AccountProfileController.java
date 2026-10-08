package com.wefyx.support.profile;

import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.LinkedHashMap;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wefyx.support.user.UserRepository;
import com.wefyx.support.user.UserIdentity;

@RestController
@RequestMapping("/api/profile")
public class AccountProfileController {
    private static final long MAX_SIZE=3L*1024*1024;
    private static final Set<String> TYPES=Set.of("image/jpeg","image/png","image/webp");
    private final AccountProfilePhotoRepository photos;
    private final CustomerAddressRepository addresses;
    private final ObjectMapper json;
    private final UserRepository users;
    public AccountProfileController(AccountProfilePhotoRepository photos,CustomerAddressRepository addresses,ObjectMapper json,UserRepository users){this.photos=photos;this.addresses=addresses;this.json=json;this.users=users;}

    @GetMapping
    public Map<String,Object> profile(Authentication auth){return view(account(auth));}

    @PutMapping
    public Map<String,Object> update(@RequestBody Map<String,String> body,Authentication auth){
        var user=account(auth);
        String name=required(body.get("name"),"Name");
        String organization=required(body.get("organization"),"Company / organization");
        String phone=UserIdentity.phone(body.get("phone"),true);
        if(users.existsByPhoneAndIdNot(phone,user.getId()))throw new ResponseStatusException(HttpStatus.CONFLICT,"This mobile number is already registered");
        user.setName(name);user.setOrganization(organization);user.setPhone(phone);
        user.setJobTitle(clean(body.get("jobTitle")));user.setWebsite(clean(body.get("website")));user.setEmirate(clean(body.get("emirate")));
        user.setAddress(clean(body.get("address")));user.setCountry(clean(body.get("country")));user.setLocation(clean(body.get("address")));
        return view(users.save(user));
    }

    @GetMapping("/addresses")
    public java.util.List<Map<String,Object>> addresses(Authentication auth){
        var user=account(auth);
        var rows=addresses.findByCustomerEmailIgnoreCaseOrderByDefaultAddressDescUpdatedAtDesc(auth.getName());
        if(rows.isEmpty()&&user.getAddress()!=null&&!user.getAddress().isBlank()){
            var item=new CustomerAddress();
            item.setCustomerEmail(user.getEmail());
            item.setLabel("Primary");
            item.setContactName(user.getName());
            item.setPhone(clean(user.getPhone()));
            item.setAddressLine(user.getAddress());
            item.setEmirate(clean(user.getEmirate()));
            item.setCountry(clean(user.getCountry()).isBlank()?"United Arab Emirates":clean(user.getCountry()));
            item.setDefaultAddress(true);
            rows=java.util.List.of(addresses.save(item));
        }
        return rows.stream().map(this::addressView).toList();
    }

    @PostMapping("/addresses")
    public Map<String,Object> createAddress(@RequestBody Map<String,Object> body,Authentication auth){
        var account=account(auth);
        var item=new CustomerAddress();
        item.setCustomerEmail(auth.getName().toLowerCase());
        applyAddress(item,body,account);
        var current=addresses.findByCustomerEmailIgnoreCaseOrderByDefaultAddressDescUpdatedAtDesc(auth.getName());
        if(item.isDefaultAddress()||current.isEmpty()) current.forEach(row->{row.setDefaultAddress(false);addresses.save(row);});
        if(current.isEmpty()) item.setDefaultAddress(true);
        return addressView(addresses.save(item));
    }

    @PutMapping("/addresses/{id}")
    public Map<String,Object> updateAddress(@PathVariable Long id,@RequestBody Map<String,Object> body,Authentication auth){
        var item=addresses.findByIdAndCustomerEmailIgnoreCase(id,auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Address not found"));
        applyAddress(item,body,account(auth));
        if(item.isDefaultAddress()) addresses.findByCustomerEmailIgnoreCaseOrderByDefaultAddressDescUpdatedAtDesc(auth.getName()).stream().filter(row->!row.getId().equals(id)).forEach(row->{row.setDefaultAddress(false);addresses.save(row);});
        return addressView(addresses.save(item));
    }

    @DeleteMapping("/addresses/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAddress(@PathVariable Long id,Authentication auth){
        var item=addresses.findByIdAndCustomerEmailIgnoreCase(id,auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Address not found"));
        addresses.delete(item);
    }

    @GetMapping("/reverse-geocode")
    public Map<String,Object> reverseGeocode(@RequestParam double latitude,@RequestParam double longitude,Authentication auth){
        account(auth);
        if(latitude<-90||latitude>90||longitude<-180||longitude>180)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Location coordinates are invalid");
        try{
            var uri=java.net.URI.create("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+latitude+"&lon="+longitude+"&zoom=18&addressdetails=1");
            var request=java.net.http.HttpRequest.newBuilder(uri)
                .header("User-Agent","Wefyx.pro customer checkout location lookup")
                .header("Accept","application/json")
                .GET().build();
            var response=java.net.http.HttpClient.newHttpClient().send(request,java.net.http.HttpResponse.BodyHandlers.ofString());
            if(response.statusCode()<200||response.statusCode()>=300)throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Unable to resolve current location address");
            Map<?,?> payload=json.readValue(response.body(),Map.class);
            Map<?,?> address=payload.get("address") instanceof Map<?,?> map?map:Map.of();
            String line=string(payload.get("display_name"));
            if(line.isBlank())line=latitude+", "+longitude;
            String emirate=value(string(address.get("city")),value(string(address.get("state")),value(string(address.get("county")),"Dubai")));
            String country=value(string(address.get("country")),"United Arab Emirates");
            Map<String,Object> result=new LinkedHashMap<>();
            result.put("addressLine",line);
            result.put("emirate",emirate);
            result.put("country",country);
            result.put("latitude",latitude);
            result.put("longitude",longitude);
            return result;
        }catch(ResponseStatusException error){throw error;}
        catch(Exception error){throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Unable to resolve current location address");}
    }

    @GetMapping("/photo")
    public ResponseEntity<byte[]> photo(Authentication auth){
        var item=photos.findByEmailIgnoreCase(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Profile photo not set"));
        return ResponseEntity.ok().cacheControl(CacheControl.noCache()).contentType(MediaType.parseMediaType(item.getContentType())).contentLength(item.getContent().length).body(item.getContent());
    }

    @PutMapping(value="/photo",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String,Object> upload(@RequestParam("file") MultipartFile file,Authentication auth)throws IOException{
        if(file.isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a profile image");
        if(file.getSize()>MAX_SIZE)throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"Profile image must be 3 MB or smaller");
        String type=String.valueOf(file.getContentType()).toLowerCase();
        if(!TYPES.contains(type))throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,"Use a PNG, JPEG or WebP image");
        var item=photos.findByEmailIgnoreCase(auth.getName()).orElseGet(AccountProfilePhoto::new);
        item.setEmail(auth.getName().toLowerCase());item.setContentType(type);item.setContent(file.getBytes());photos.save(item);
        return Map.of("message","Profile photo updated","contentType",type,"size",file.getSize());
    }

    @DeleteMapping("/photo") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void remove(Authentication auth){photos.deleteByEmailIgnoreCase(auth.getName());}

    private com.wefyx.support.user.SupportUser account(Authentication auth){return users.findByEmailIgnoreCase(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Account not found"));}
    private Map<String,Object> view(com.wefyx.support.user.SupportUser user){Map<String,Object> result=new LinkedHashMap<>();result.put("name",user.getName());result.put("email",user.getEmail());result.put("organization",user.getOrganization());result.put("phone",clean(user.getPhone()));result.put("jobTitle",clean(user.getJobTitle()));result.put("website",clean(user.getWebsite()));result.put("emirate",clean(user.getEmirate()));result.put("address",clean(user.getAddress()));result.put("country",clean(user.getCountry()));result.put("role",user.getRole());return result;}
    private void applyAddress(CustomerAddress item,Map<String,Object> body,com.wefyx.support.user.SupportUser account){
        item.setLabel(required(string(body.get("label")).isBlank()?"Delivery address":string(body.get("label")),"Address label"));
        item.setContactName(required(string(body.get("contactName")).isBlank()?account.getName():string(body.get("contactName")),"Contact name"));
        item.setPhone(cleanText(string(body.get("phone")).isBlank()?account.getPhone():string(body.get("phone")),40));
        item.setAddressLine(required(string(body.get("addressLine")),"Address"));
        item.setEmirate(clean(string(body.get("emirate"))).isBlank()?"Dubai":clean(string(body.get("emirate"))));
        item.setCountry(clean(string(body.get("country"))).isBlank()?"United Arab Emirates":clean(string(body.get("country"))));
        item.setLatitude(number(body.get("latitude")));
        item.setLongitude(number(body.get("longitude")));
        item.setDefaultAddress(Boolean.TRUE.equals(body.get("defaultAddress")));
    }
    private Map<String,Object> addressView(CustomerAddress item){Map<String,Object> result=new LinkedHashMap<>();result.put("id",item.getId());result.put("label",item.getLabel());result.put("contactName",item.getContactName());result.put("phone",item.getPhone());result.put("addressLine",item.getAddressLine());result.put("emirate",clean(item.getEmirate()));result.put("country",clean(item.getCountry()));result.put("latitude",item.getLatitude());result.put("longitude",item.getLongitude());result.put("defaultAddress",item.isDefaultAddress());return result;}
    private static String string(Object value){return value==null?"":String.valueOf(value).trim();}
    private static Double number(Object value){if(value==null||String.valueOf(value).isBlank())return null;try{return Double.valueOf(String.valueOf(value));}catch(NumberFormatException error){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Location coordinates are invalid");}}
    private static String value(String value,String fallback){return value==null||value.isBlank()?fallback:value.trim();}
    private static String required(String value,String label){if(value==null||value.isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,label+" is required");return value.trim();}
    private static String clean(String value){return value==null?"":value.trim();}
    private static String cleanText(String value,int max){String clean=clean(value);return clean.length()>max?clean.substring(0,max):clean;}
}

package com.wefyx.support.catalog;
import com.wefyx.support.config.AccessControl;
import org.springframework.security.core.Authentication;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.security.*;
import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;

@RestController @RequestMapping("/api/catalog/images")
public class ProductImageController {
 private final ProductImageRepository images;private final AccessControl access;
 public ProductImageController(ProductImageRepository images,AccessControl access){this.images=images;this.access=access;}
 @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> upload(@RequestParam("file")MultipartFile file,Authentication auth)throws Exception{
  access.require(auth,AccessControl.Role.SUPER_ADMIN);
  if(file.isEmpty()||file.getSize()>5L*1024*1024)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a product image up to 5 MB.");
  byte[] bytes=file.getBytes();String type;
  if(bytes.length>=30&&new String(bytes,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")&&new String(bytes,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP")){if(java.nio.ByteBuffer.wrap(bytes,4,4).order(java.nio.ByteOrder.LITTLE_ENDIAN).getInt()!=bytes.length-8||!Set.of("VP8 ","VP8L","VP8X").contains(new String(bytes,12,4,java.nio.charset.StandardCharsets.US_ASCII)))throw unsupported();type="image/webp";}
  else {
   try(var stream=ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))){
    var readers=ImageIO.getImageReaders(stream);if(!readers.hasNext())throw unsupported();var reader=readers.next();
    try{String format=reader.getFormatName().toLowerCase(Locale.ROOT);type=switch(format){case "png"->"image/png";case "jpeg","jpg"->"image/jpeg";default->throw unsupported();};reader.setInput(stream);if(reader.getWidth(0)>10000||reader.getHeight(0)>10000||(long)reader.getWidth(0)*reader.getHeight(0)>25000000||reader.read(0)==null)throw unsupported();}finally{reader.dispose();}
   }
  }
  var image=new ProductImage();image.content=bytes;image.contentType=type;image.checksum=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));images.save(image);
  return Map.of("id",image.id,"url","/api/catalog/images/"+image.id,"contentType",type,"size",bytes.length);
 }
 @GetMapping("/{id}") public ResponseEntity<byte[]> read(@PathVariable Long id){var image=images.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Image not found"));return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.contentType)).header("X-Content-Type-Options","nosniff").cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(365)).cachePublic().immutable()).eTag(image.checksum).body(image.content);}
 @ExceptionHandler(javax.imageio.IIOException.class) @ResponseStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE) public Map<String,String> corruptImage(){return Map.of("message","The selected image is damaged or invalid.");}
 private static ResponseStatusException unsupported(){return new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,"Choose a valid PNG, JPEG or WebP image.");}
}

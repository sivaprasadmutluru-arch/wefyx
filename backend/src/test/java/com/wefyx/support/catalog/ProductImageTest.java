package com.wefyx.support.catalog;
import com.wefyx.support.auth.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayOutputStream;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:image-upload;DB_CLOSE_DELAY=-1","spring.datasource.username=sa","spring.datasource.password=","wefyx.seed.enabled=false","wefyx.auth.email=qa-admin@example.test"})
@AutoConfigureMockMvc @Transactional
class ProductImageTest {
 @Autowired MockMvc mvc;@Autowired JwtService jwt;@Autowired ObjectMapper json;
 @Test void adminUploadPersistsRealImageAndPublicDownloadHasCorrectType()throws Exception{
  var bytes=new ByteArrayOutputStream();javax.imageio.ImageIO.write(new java.awt.image.BufferedImage(2,2,java.awt.image.BufferedImage.TYPE_INT_RGB),"png",bytes);
  var file=new MockMultipartFile("file","product.png","image/png",bytes.toByteArray());String admin=jwt.issue("qa-admin@example.test","SUPER_ADMIN");
  var uploaded=mvc.perform(multipart("/api/catalog/images").file(file).header("Authorization","Bearer "+admin)).andReturn().getResponse();assertEquals(201,uploaded.getStatus());String url=json.readTree(uploaded.getContentAsByteArray()).path("url").asText();
  var response=mvc.perform(get(url)).andReturn().getResponse();assertEquals(200,response.getStatus());assertEquals("image/png",response.getContentType());assertArrayEquals(bytes.toByteArray(),response.getContentAsByteArray());assertEquals("nosniff",response.getHeader("X-Content-Type-Options"));assertNotNull(response.getHeader("ETag"));
 }
 @Test void customerUploadAndFakeImagesAreRejected()throws Exception{
  var fake=new MockMultipartFile("file","image.png","image/png","not an image".getBytes());
  assertEquals(403,mvc.perform(multipart("/api/catalog/images").file(fake).header("Authorization","Bearer "+jwt.issue("qa-customer@example.test","CUSTOMER"))).andReturn().getResponse().getStatus());
  assertEquals(415,mvc.perform(multipart("/api/catalog/images").file(fake).header("Authorization","Bearer "+jwt.issue("qa-admin@example.test","SUPER_ADMIN"))).andReturn().getResponse().getStatus());
 }
 @Test void oversizedImageIsRejectedBeforeSaving()throws Exception{
  var file=new MockMultipartFile("file","large.png","image/png",new byte[5*1024*1024+1]);assertEquals(400,mvc.perform(multipart("/api/catalog/images").file(file).header("Authorization","Bearer "+jwt.issue("qa-admin@example.test","SUPER_ADMIN"))).andReturn().getResponse().getStatus());
 }
}

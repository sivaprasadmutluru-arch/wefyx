package com.wefyx.support.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import java.sql.DriverManager;
import static org.junit.jupiter.api.Assertions.*;

class CatalogRetirementTest {
 @Test void migrationRetiresSamplesAndPreservesAdminProductsAndHistory()throws Exception{
  try(var connection=DriverManager.getConnection("jdbc:h2:mem:catalog-retirement;DB_CLOSE_DELAY=-1","sa","")){
   var migration=new ClassPathResource("db/migration/V3__retire_sample_catalog.sql");
   ScriptUtils.executeSqlScript(connection,migration);
   try(var sql=connection.createStatement()){
    sql.execute("INSERT INTO catalog_products(code,name,active) VALUES ('dell-latitude-5550','Sample',TRUE),('admin-created-sku','Admin product',TRUE)");
    ScriptUtils.executeSqlScript(connection,migration);
    try(var rows=sql.executeQuery("SELECT code,active FROM catalog_products ORDER BY code")){
     assertTrue(rows.next());assertEquals("admin-created-sku",rows.getString(1));assertTrue(rows.getBoolean(2));
     assertTrue(rows.next());assertEquals("dell-latitude-5550",rows.getString(1));assertFalse(rows.getBoolean(2));assertFalse(rows.next());
    }
   }
  }
 }
}

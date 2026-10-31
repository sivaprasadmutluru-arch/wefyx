package com.wefyx.support.booking;
import org.junit.jupiter.api.Test;
import org.flywaydb.core.api.migration.Context;
import java.sql.DriverManager;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class BookingUpgradeTest {
 @Test void upgradePreservesOldBookingsAndAllowsCustomServiceCodes()throws Exception{
  try(var connection=DriverManager.getConnection("jdbc:h2:mem:booking-upgrade","sa","")){
   var context=mock(Context.class);when(context.getConnection()).thenReturn(connection);
   try(var sql=connection.createStatement()){
    sql.execute("CREATE TABLE service_bookings(id BIGINT PRIMARY KEY,support_type VARCHAR(255) CHECK(support_type IN ('SITE_VISIT','REMOTE','GENERAL')),amount NUMERIC(10,2))");sql.execute("INSERT INTO service_bookings VALUES(1,'SITE_VISIT',100)");
    new db.migration.V5__custom_service_types().migrate(context);new db.migration.V6__booking_payment_fields().migrate(context);
    sql.execute("INSERT INTO service_bookings(id,support_type,amount) VALUES(2,'CUSTOM_SERVICE',210)");
    try(var rows=sql.executeQuery("SELECT amount,slot_minutes,checkout_attempt FROM service_bookings WHERE id=1")){assertTrue(rows.next());assertEquals(100,rows.getBigDecimal(1).intValueExact());assertEquals(60,rows.getInt(2));assertEquals(0,rows.getInt(3));}
   }
  }
 }
}

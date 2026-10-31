package db.migration;
import org.flywaydb.core.api.migration.*;
import java.util.*;
/** Populate defaults for existing bookings before Hibernate adds primitive payment/slot fields. */
public class V6__booking_payment_fields extends BaseJavaMigration {
 @Override public void migrate(Context context)throws Exception{
  var connection=context.getConnection();String table=null;
  try(var tables=connection.getMetaData().getTables(null,null,"%",new String[]{"TABLE"})){while(tables.next())if("service_bookings".equalsIgnoreCase(tables.getString("TABLE_NAME")))table=tables.getString("TABLE_NAME");}
  if(table==null)return;var columns=new HashSet<String>();try(var rows=connection.getMetaData().getColumns(null,null,table,"%")){while(rows.next())columns.add(rows.getString("COLUMN_NAME").toLowerCase(Locale.ROOT));}
  var additions=new LinkedHashMap<String,String>();additions.put("service_name","VARCHAR(255)");additions.put("base_amount","NUMERIC(10,2)");additions.put("vat_amount","NUMERIC(10,2)");additions.put("checkout_session_id","VARCHAR(255)");additions.put("checkout_url","VARCHAR(2000)");additions.put("hold_until","TIMESTAMP WITH TIME ZONE");additions.put("checkout_attempt","INTEGER NOT NULL DEFAULT 0");additions.put("slot_minutes","INTEGER NOT NULL DEFAULT 60");
  try(var statement=connection.createStatement()){for(var entry:additions.entrySet())if(!columns.contains(entry.getKey()))statement.execute("ALTER TABLE service_bookings ADD COLUMN "+entry.getKey()+" "+entry.getValue());}
 }
}

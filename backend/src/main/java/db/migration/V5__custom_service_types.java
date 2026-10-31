package db.migration;
import org.flywaydb.core.api.migration.*;
import java.sql.*;
import java.util.*;
/** Earlier Hibernate versions created an enum check; custom administrator service codes replace it. */
public class V5__custom_service_types extends BaseJavaMigration {
 @Override public void migrate(Context context)throws Exception{
  var connection=context.getConnection();String database=connection.getMetaData().getDatabaseProductName().toLowerCase(Locale.ROOT);
  String query=database.contains("postgres")?"SELECT c.conname AS constraint_name FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE t.relname='service_bookings' AND n.nspname=current_schema() AND c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%support_type%'":"SELECT cc.CONSTRAINT_NAME FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ON cc.CONSTRAINT_CATALOG=tc.CONSTRAINT_CATALOG AND cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME WHERE UPPER(tc.TABLE_NAME)='SERVICE_BOOKINGS' AND UPPER(cc.CHECK_CLAUSE) LIKE '%SUPPORT_TYPE%'";
  var constraints=new ArrayList<String>();try(var statement=connection.createStatement();var rows=statement.executeQuery(query)){while(rows.next())constraints.add(rows.getString(1));}
  try(var statement=connection.createStatement()){for(String name:constraints)statement.execute("ALTER TABLE service_bookings DROP CONSTRAINT \""+name.replace("\"","\"\"")+"\"");}
 }
}

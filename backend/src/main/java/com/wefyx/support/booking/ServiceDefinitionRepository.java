package com.wefyx.support.booking;
import java.util.List;
public interface ServiceDefinitionRepository extends org.springframework.data.jpa.repository.JpaRepository<ServiceDefinition,String>{@org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
 @org.springframework.data.jpa.repository.Query("select s from ServiceDefinition s where s.code = :code") java.util.Optional<ServiceDefinition> lockByCode(@org.springframework.data.repository.query.Param("code")String code);
 List<ServiceDefinition> findByActiveTrueOrderByNameAsc();}

package com.wefyx.support.offer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface ShopOfferRepository extends JpaRepository<ShopOffer,Long>{
    Optional<ShopOffer> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code,Long id);
}

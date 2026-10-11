package aoms.pm.cast.mapper;
import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;
@Mapper
public interface CastResultInboxMapper {
    void receive(@Param("hash") String hash, @Param("payload") String payload);
    void failed(@Param("hash") String hash, @Param("reason") String reason);
}

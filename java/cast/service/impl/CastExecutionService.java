package aoms.pm.cast.service.impl;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.UserSmltCurrentDto;
import aoms.pm.cast.mapper.CastExecutionMapper;
import aoms.pm.utils.SessionUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastExecutionService {
    private final CastExecutionMapper mapper;
    private final SessionService sessionService;
    private final ObjectMapper objectMapper;

    public void lock() {
        if (!"EXECUTION".equals(mapper.lockAllocator())) throw new IllegalStateException("실행 채번 잠금 행이 없습니다.");
    }
    public void scope(UserSmltCurrentDto dto) {
        SessionUtils.setUserContext(dto, sessionService);
        if (dto.getLoginUserId() == null || dto.getLoginUserId().isBlank()) throw new IllegalStateException("로그인을 진행해주세요.");
        if (dto.getTmnlId() == null) throw new IllegalStateException("터미널을 지정해주세요.");
        validateYmd(dto.getYmd());
        dto.setFcltTmnlId(dto.getTmnlId().getFcltTmnlId());
    }
    public void validateYmd(String ymd) {
        if (ymd == null || !ymd.matches("[0-9]{8}")) throw new IllegalStateException("대상 일자를 확인해주세요.");
        LocalDate.parse(ymd, DateTimeFormatter.ofPattern("uuuuMMdd").withResolverStyle(ResolverStyle.STRICT));
    }
    public String nextId() {
        String id = mapper.nextSmltId();
        if (id == null || !id.matches("[0-9]{1,8}") || Long.parseLong(id) < 1) throw new IllegalStateException("시뮬레이션 ID 범위를 초과했습니다.");
        return "0".repeat(8 - id.length()) + id;
    }
    public String baseId(String ymd) { return mapper.retrieveBaseSmltId(ymd); }
    public boolean hasSaved(UserSmltCurrentDto dto, String area) { return mapper.hasSaved(dto, area) > 0; }
    public void saved(UserSmltCurrentDto dto, String area) { mapper.markSaved(dto, area); }
    public String saveDt(UserSmltCurrentDto dto) { String value = mapper.retrieveSaveDt(dto); return value == null ? "" : value; }
    public <T> T frozen(String id, String terminal, String area, Class<T> type) {
        String payload = mapper.retrieveCondition(id, terminal, area);
        if (payload == null) throw new IllegalStateException("실행 당시 확정 조건이 없습니다.");
        try { return objectMapper.readValue(payload, type); }
        catch (Exception error) { throw new IllegalStateException("확정 조건을 읽지 못했습니다.", error); }
    }
    public void freeze(String id, String terminal, String area, Object value) {
        try { mapper.storeCondition(id, terminal, area, objectMapper.writeValueAsString(value)); }
        catch (Exception error) { throw new IllegalStateException("확정 조건을 보존하지 못했습니다.", error); }
    }
}

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
import aoms.pm.cast.dto.SmltStngDto;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastExecutionService {
    private final CastExecutionMapper mapper;
    private final SessionService sessionService;

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
    public boolean hasCurrentConditions(UserSmltCurrentDto dto, String area) { return mapper.hasCurrentConditions(dto, area) > 0; }
    public String saveDt(UserSmltCurrentDto dto) { String value = mapper.retrieveSaveDt(dto); return value == null ? "" : value; }
    public SmltStngDto resources(String id, String terminal) {
        if (terminal == null || !("P01".equals(terminal) || "P03".equals(terminal))) throw new IllegalStateException("터미널을 지정해주세요.");
        SmltStngDto result = mapper.retrieveExecutionResources(id, terminal);
        if (result == null) throw new IllegalStateException("실행의 리소스 참조가 없습니다.");
        return result;
    }
}

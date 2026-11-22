package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import aoms.pm.cast.dto.ChknBoothAltmntDto;
import aoms.pm.cast.dto.ChknBoothDto;
import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.UserChknBoothAltmntRawDto;
import aoms.pm.cast.mapper.CastResourceConditionMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CastResourceConditionService {
    private final CastResourceConditionMapper mapper;

    public List<ChknIslandDto> islands(SmltStngDto refs, String terminal) {
        List<ChknIslandDto> result = mapper.retrieveIslands(refs.getCknctAlctnRsrcId(), refs.getSbdCntrlAlctnId(), terminal);
        for (ChknIslandDto island : result) {
            island.setBoothList(toBoothList(mapper.retrieveBooths(refs.getCknctAlctnRsrcId(), terminal, island.getIsland())));
        }
        return result;
    }

    private List<ChknBoothDto> toBoothList(List<UserChknBoothAltmntRawDto> rows) {
        Map<Integer, List<ChknBoothAltmntDto>> boothMap = new TreeMap<>();
        for (UserChknBoothAltmntRawDto row : rows) {
            boothMap.computeIfAbsent(row.getBoothNo(), boothNo -> new ArrayList<>()).add(new ChknBoothAltmntDto()
                    .withAlnCd(row.getAlnCd()).withOperBgngHour(row.getOperBgngHour()).withOperEndHour(row.getOperEndHour()));
        }
        List<ChknBoothDto> result = new ArrayList<>();
        boothMap.forEach((boothNo, altmntList) -> result.add(new ChknBoothDto().withBoothNo(boothNo).withAltmntList(altmntList)));
        return result;
    }

    public List<DepGateDto> gates(SmltStngDto refs, String terminal) {
        List<DepGateDto> result = mapper.retrieveGates(refs.getFcltyOpngDptcnySrngRsrcId(), refs.getFcltyOpngScrtyCntrlRsrcId(), terminal);
        for (DepGateDto gate : result) gate.setOprTimeList(mapper.retrieveDepartureHours(refs.getFcltyOpngDptcnySrngRsrcId(), terminal, gate.getDptgtNo()));
        return result;
    }
}

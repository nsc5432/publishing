package aoms.pm.cast.service.impl;

import java.util.List;
import org.springframework.stereotype.Service;
import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.mapper.CastResourceConditionMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CastResourceConditionService {
    private final CastResourceConditionMapper mapper;

    public List<ChknIslandDto> islands(SmltStngDto refs, String terminal) {
        List<ChknIslandDto> result = mapper.retrieveIslands(refs.getCknctAlctnRsrcId(), refs.getSbdCntrlAlctnId(), terminal);
        for (ChknIslandDto island : result) {
            island.setBoothList(mapper.retrieveBooths(refs.getCknctAlctnRsrcId(), terminal, island.getIsland()));
            island.setOprTimeList(mapper.retrieveCheckinHours(refs.getCknctAlctnRsrcId(), refs.getSbdCntrlAlctnId(), terminal, island.getIsland()));
        }
        return result;
    }

    public List<DepGateDto> gates(SmltStngDto refs, String terminal) {
        List<DepGateDto> result = mapper.retrieveGates(refs.getFcltyOpngDptcnySrngRsrcId(), refs.getFcltyOpngScrtyCntrlRsrcId(), terminal);
        for (DepGateDto gate : result) gate.setOprTimeList(mapper.retrieveDepartureHours(refs.getFcltyOpngDptcnySrngRsrcId(), terminal, gate.getDptgtNo()));
        return result;
    }
}

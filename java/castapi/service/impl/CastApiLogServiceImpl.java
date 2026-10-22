package aoms.pm.castapi.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.castapi.log.CastApiLogEntry;
import aoms.pm.castapi.log.CastApiLogSettings;
import aoms.pm.castapi.mapper.CastApiLogMapper;
import aoms.pm.castapi.service.CastApiLogService;

import lombok.RequiredArgsConstructor;

@Service("castApiLogService")
@RequiredArgsConstructor
public class CastApiLogServiceImpl implements CastApiLogService {
    private final CastApiLogMapper castApiLogMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public CastApiLogSettings retrieveSettings(String castApiTypeCd) {
        return new CastApiLogSettings(castApiLogMapper.retrieveSettings(castApiTypeCd));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public void saveLog(CastApiLogEntry entry) {
        castApiLogMapper.insertLog(entry);
    }
}

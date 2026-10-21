package aoms.pm.castrest.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.castrest.log.CastRestLogEntry;
import aoms.pm.castrest.log.CastRestLogSettings;
import aoms.pm.castrest.mapper.CastRestLogMapper;
import aoms.pm.castrest.service.CastRestLogService;

import lombok.RequiredArgsConstructor;

@Service("castRestLogService")
@RequiredArgsConstructor
public class CastRestLogServiceImpl implements CastRestLogService {
    private final CastRestLogMapper castRestLogMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public CastRestLogSettings retrieveSettings(String apiTypeCd) {
        return new CastRestLogSettings(castRestLogMapper.retrieveSettings(apiTypeCd));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public void saveLog(CastRestLogEntry entry) {
        castRestLogMapper.insertLog(entry);
    }
}

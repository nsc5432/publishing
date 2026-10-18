package aoms.pm.castrest.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.castrest.mapper.CastRestMapper;
import aoms.pm.castrest.service.CastRestDebugService;

import lombok.RequiredArgsConstructor;

@Service("castRestDebugService")
@RequiredArgsConstructor
public class CastRestDebugServiceImpl implements CastRestDebugService {
    private final CastRestMapper castRestMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public void saveRequest(String payload) {
        castRestMapper.insertSetResourceRequest(payload);
    }
}

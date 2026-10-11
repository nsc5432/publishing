package aoms.pm.castrest.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import aoms.pm.cast.mapper.CastResultInboxMapper;
import org.apache.commons.codec.digest.DigestUtils;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CastResultInboxService {
    private final CastResultInboxMapper mapper;
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public String receive(String payload) {
        String hash = DigestUtils.sha256Hex(payload);
        mapper.receive(hash, payload);
        return hash;
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public void failed(String hash, String reason) { mapper.failed(hash, reason); }
}

package aoms.pm.castapi.service;

import aoms.pm.castapi.log.CastApiContext;
import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.cmmn.dto.CastReqGetResourceInformationDto;

public interface CastApiService {
    public String retrieveResourceInformation(String param);
    public String retrieveResourceInformation(String param, CastApiContext context);
    public String retrieveResourceInformation(CastReqGetResourceInformationDto infoDto);
    public String retrieveResource(String param);
    public String retrieveResource(String param, CastApiContext context);
    public String retrieveResource(CastReqGetResourceDto resourceDto);
    public String saveResult(String param);
    public String saveResult(String param, CastApiContext context);
}

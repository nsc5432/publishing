package aoms.pm.castrest.service;

import aoms.pm.castrest.log.CastRestApiContext;
import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.cmmn.dto.CastReqGetResourceInformationDto;

public interface CastRestService {
    public String retrieveResourceInformation(String param);
    public String retrieveResourceInformation(String param, CastRestApiContext context);
    public String retrieveResourceInformation(CastReqGetResourceInformationDto infoDto);
    public String retrieveResource(String param);
    public String retrieveResource(String param, CastRestApiContext context);
    public String retrieveResource(CastReqGetResourceDto resourceDto);
    public String saveResult(String param);
    public String saveResult(String param, CastRestApiContext context);
    public String deleteResult(String param);
}

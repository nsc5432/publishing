package aoms.pm.castrest.service;

import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.cmmn.dto.CastReqGetResourceInformationDto;

public interface CastRestService {
    String captureResource(String type, String resourceId, String baseYmd);
    public String retrieveResourceInformation(String param);
    public String retrieveResourceInformation(CastReqGetResourceInformationDto infoDto);
    public String retrieveResource(String param);
    public String retrieveResource(CastReqGetResourceDto resourceDto);
    public String saveResult(String param);
    public String deleteResult(String param);
}

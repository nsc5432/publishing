package aoms.pm.castrest.service;

public interface CastRestService {
    String captureResource(String type, String resourceId, String baseYmd);
    public String retrieveResourceInformation(String param);
    public String retrieveResource(String param);
    public String saveResult(String param);
    public String deleteResult(String param);
}
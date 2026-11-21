package aoms.pm.castapi.service.impl;

import static aoms.pm.castapi.service.statics.CastApiConstants.*;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import javax.xml.parsers.ParserConfigurationException;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import aoms.pm.cast.dto.UserSmltReqDto;
import aoms.pm.cast.mapper.CastExecutionMapper;
import aoms.pm.castapi.log.CastApiContext;
import aoms.pm.castapi.mapper.CastApiMapper;
import aoms.pm.castapi.service.CastApiService;
import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.cmmn.dto.CastReqGetResourceInformationDto;

import lombok.RequiredArgsConstructor;

@Service("castApiService")
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastApiServiceImpl extends EgovAbstractServiceImpl implements CastApiService {
    @FunctionalInterface
    private interface ResourceRequestParser<T> {
        T parse() throws ParserConfigurationException, SAXException, IOException;
    }

    private final CastApiMapper castApiMapper;
    private final CastExecutionMapper executionMapper;
    private final CastResourceRenderer resourceRenderer;
    private final CastPropertySetRenderer propertySetRenderer;
    private final CastSetResourceHandler setResourceHandler;

    private String resolveBaseYmd() {
        return castApiMapper.selectBaseYmdForCalibration();
    }

    // ---- REQ_GetResourceInformation ----

    @Override
    public String retrieveResourceInformation(String param){
        return retrieveResourceInformation(param, new CastApiContext());
    }

    @Override
    public String retrieveResourceInformation(String param, CastApiContext context) {
        return retrieveResourceInformation(() -> {
            Element root = CastApiXml.parseRootElement(param);
            CastReqGetResourceInformationDto infoDto = new CastReqGetResourceInformationDto();
            resourceInfoList(root, null, infoDto);
            return infoDto;
        }, context);
    }

    @Override
    public String retrieveResourceInformation(CastReqGetResourceInformationDto infoDto) {
        return retrieveResourceInformation(() -> infoDto, new CastApiContext());
    }

    private String retrieveResourceInformation(
        ResourceRequestParser<CastReqGetResourceInformationDto> requestParser,
        CastApiContext context
    ) {
        List<Object> dbResults = null;
        try {

            CastReqGetResourceInformationDto infoDto = requestParser.parse();
            infoDto.setBaseYmd(resolveBaseYmd());

            dbResults = castApiMapper.retrieveResourceInformation(infoDto);

            return resourceRenderer.renderResourceInformation(dbResults, true);
        } catch (IllegalStateException | ParserConfigurationException | SAXException | IOException e) {
            context.addException(e);
            return resourceRenderer.renderResourceInformation(dbResults, false);
        }
    }


    private void resourceInfoList(Node node, String str, CastReqGetResourceInformationDto sDto) {
        String pStr = str;
        if (PARAMETER.equals(str)) {
            NamedNodeMap attributeMap = node.getAttributes();
            pStr = "m:" + CastApiXml.getAttributeValue(attributeMap, "id").orElse("");
        }

        if (RESOURCE_TYPES.equals(pStr)) {
            sDto.setResourceTypes(node.getTextContent());
        }

        forEachElementChild(node, child -> resourceInfoList(child, child.getNodeName(), sDto));
    }

    // ---- REQ_GetResource ----

    @Override
    public String retrieveResource(String param){
        return retrieveResource(param, new CastApiContext());
    }

    @Override
    public String retrieveResource(String param, CastApiContext context) {
        return retrieveResource(() -> {
            Element root = CastApiXml.parseRootElement(param);
            CastReqGetResourceDto resourceDto = new CastReqGetResourceDto();
            resourceList(root, null, resourceDto);
            return resourceDto;
        }, context);
    }

    @Override
    public String retrieveResource(CastReqGetResourceDto resourceDto) {
        return retrieveResource(() -> resourceDto, new CastApiContext());
    }

    private String retrieveResource(
        ResourceRequestParser<CastReqGetResourceDto> requestParser,
        CastApiContext context
    ) {
        try {

            CastReqGetResourceDto resourceDto = requestParser.parse();
            resourceDto.setBaseYmd(resolveBaseYmd());

            if (PROPERTY_SET.equals(resourceDto.getResourceType())) {
                UserSmltReqDto request = executionMapper.retrievePropertySetRequest(resourceDto.getResourceID());
                if (request != null)
                    return propertySetRenderer.renderUserPropertySet(request); // PS 사용자 시뮬레이션 처리

                String id = resourceDto.getResourceID();
                if (
                    id != null &&
                    id.matches("PS[0-9]{3}") &&
                    id.substring(2).compareTo("500") >= 0 &&
                    id.substring(2).compareTo("998") <= 0
                )
                    throw new IllegalStateException("등록되지 않은 사용자 PropertySet입니다.");
            }

            return renderResource(resourceDto, context);
        } catch (IllegalStateException | ParserConfigurationException | SAXException | IOException e) {
            context.addException(e);
        }

        return INVALID_REQUEST;
    }

    private String renderResource(CastReqGetResourceDto idto, CastApiContext context) {
        String type = idto.getResourceType();
        switch (type) {
            case FLIGHT_SCHEDULE:
            case COUNTER_ALLOCATION:
            case GENERIC_TABLE:
                Optional<String> table = resourceRenderer.renderTable(type, idto);
                if (table.isPresent()) {
                    return table.get();
                }
                break;
            case PROPERTY_SET:
                return propertySetRenderer.render(idto);
            case CAST_MODEL:
            case CAST_EXPRESS_MODEL:
                return resourceRenderer.renderModel(type, idto);
            default:
                break;
        }
        context.addFailure("지원하지 않는 리소스 유형입니다.");
        return RESOURCE_ERROR;
    }

    private void resourceList(Node node, String str, CastReqGetResourceDto sDto) {
        NamedNodeMap attributeMap = node.getAttributes();
        if (PARAMETER.equals(str)) {
            String paramId = CastApiXml.getAttributeValue(attributeMap, "id").orElse("");
            if (RESOURCE_TYPE.equals(paramId)) {
                sDto.setResourceType(node.getTextContent());
            } else if (RESOURCE_ID.equals(paramId)) {
                sDto.setResourceID(node.getTextContent());
            }
        } else if (RESOURCE_DESCRIPTION.equals(str)) {
            sDto.setResourceType(CastApiXml.getAttributeValue(attributeMap, RESOURCE_TYPE).orElse(""));
            sDto.setResourceID(CastApiXml.getAttributeValue(attributeMap, RESOURCE_ID).orElse(""));
        }

        forEachElementChild(node, child -> resourceList(child, child.getNodeName(), sDto));
    }

    // ---- REQ_SetResource ----

    @Override
    public String saveResult(String param){
        return saveResult(param, new CastApiContext());
    }

    @Override
    public String saveResult(String param, CastApiContext context) {
        try {
            Element root = CastApiXml.parseRootElement(param);
            boolean saved = setResourceHandler.handle(root, context, this::resolveBaseYmd);
            return CastApiXml.setResourceResponse(saved);
        } catch (IllegalStateException | NumberFormatException | DataAccessException | ParserConfigurationException | SAXException | IOException e) {
            context.addException(e);
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return CastApiXml.setResourceResponse(false);
        }
    }

    private static void forEachElementChild(Node node, Consumer<Node> action) {
        if (!node.hasChildNodes()) {
            return;
        }

        NodeList nodeList = node.getChildNodes();
        for (int i = 0; i < nodeList.getLength(); i++) {
            Node childNode = nodeList.item(i);

            if (childNode.getNodeType() == Node.TEXT_NODE) {
                continue;
            }

            action.accept(childNode);
        }
    }
}

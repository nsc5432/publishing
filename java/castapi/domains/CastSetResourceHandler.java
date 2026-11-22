package aoms.pm.castapi.domains;

import static aoms.pm.castapi.service.statics.CastApiConstants.*;
import static aoms.pm.castapi.service.statics.CastApiFieldMaps.*;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.commons.codec.digest.DigestUtils;
import org.egovframe.rte.fdl.string.EgovDateUtil;
import org.springframework.stereotype.Component;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import aoms.framework.cmmn.config.CoreYamlRead;
import aoms.framework.cmmn.service.SessionService;
import aoms.framework.cmmn.util.FileUtil;
import aoms.pm.cast.dto.UserSmltReqDto;
import aoms.pm.cast.enums.UserSmltReqStatus;
import aoms.pm.cast.mapper.CastExecutionMapper;
import aoms.pm.cast.service.CastFcltWtngRsltCreateService;
import aoms.pm.cast.service.impl.CastExecutionService;
import aoms.pm.castapi.log.CastApiContext;
import aoms.pm.castapi.mapper.CastApiMapper;
import aoms.pm.cmmn.dto.CastModelDto;
import aoms.pm.cmmn.dto.CastResReqDto;
import aoms.pm.cmmn.dto.CastRsltFcltCdDto;
import aoms.pm.cmmn.dto.CastRsltRunDto;
import aoms.pm.cmmn.dto.CastWhatIfCntrlDto;
import aoms.pm.cmmn.dto.PmAtchFileDto;
import aoms.pm.cmmn.dto.SmltMdlDto;
import aoms.pm.cmmn.dto.SmltRsltDtlDto;
import aoms.pm.utils.SessionUtils;

import lombok.RequiredArgsConstructor;

// 트랜잭션과 실패 시 롤백은 호출하는 CastApiServiceImpl 이 맡는다
@Component
@RequiredArgsConstructor
public class CastSetResourceHandler {
    private static final class ResultMessage {
        private final CastResReqDto result = new CastResReqDto();
        private final List<CastRsltRunDto> runs = new ArrayList<>();
        private final CastRsltRunDto run = new CastRsltRunDto();
        private final CastWhatIfCntrlDto whatIf = new CastWhatIfCntrlDto();
    }

    private static final Pattern WHAT_IF_REQ_ID = Pattern.compile("(?<![A-Za-z0-9])WI[0-9]{8}(?![A-Za-z0-9])");

    private final CastApiMapper castApiMapper;
    private final CastExecutionMapper executionMapper;
    private final CastExecutionService executionService;
    private final SessionService sessionService;
    private final CastFcltWtngRsltCreateService castFcltWtngRsltCreateService;

    public boolean handle(Element root, CastApiContext context, Supplier<String> baseYmd) throws IOException {
        ResultMessage message = new ResultMessage();
        SessionUtils.setUserContext(message.result, sessionService);
        SessionUtils.setUserContext(message.run, sessionService);

        parseMessage(root, RUN, "", message);
        String resourceType = message.result.getResourceType();

        if (CAST_MODEL.equals(resourceType) || CAST_EXPRESS_MODEL.equals(resourceType)) {
            CastModelDto model = new CastModelDto();
            CastApiXml.applyRemoteAddr(model::setLoginIpAddr);
            parseModel(root, model);
            saveModel(model);
            return true;
        }

        if (GENERIC_TABLE.equals(resourceType)) {
            updateWhatIf(message.whatIf);
            return true;
        }

        CastResReqDto result = message.result;
        CastApiXml.applyRemoteAddr(result::setLoginIpAddr);
        if (insertResult(result, baseYmd) < 1) {
            context.addFailure("시뮬레이션 결과가 저장되지 않았습니다.");
            return false;
        }

        castFcltWtngRsltCreateService.createInitialResult(result.getSimId(), Integer.parseInt(result.getSmltMdlSn()), result.getLoginIpAddr());
        return true;
    }

    // ---- 시뮬레이션 결과 저장 ----

    private int insertResult(CastResReqDto dto, Supplier<String> baseYmd) {
        UserSmltReqDto userReq = resolveResultRequest(dto);
        int relatedEventCd = userReq == null ? 2 : 0;
        String simId;

        if (userReq != null) {
            if ("Failed".equals(userReq.getSmltStts()))
                throw new IllegalStateException("실패 종료한 요청의 결과입니다.");
            if (UserSmltReqStatus.CANCELLED.getValue().equals(userReq.getSmltStts()))
                throw new IllegalStateException("취소 종료한 요청의 결과입니다.");

            validateUserResult(dto, userReq);
            simId = userReq.getSmltId();
            // StartTime 은 CAST 실행 시각이라 대상일이 아니다
            dto.setExcnYmd(userReq.getExcnYmd());
            if (isBlankResource(dto.getCheckInAllocationResourceID()))
                dto.setCheckInAllocationResourceID(userReq.getCknctAlctnRsrcId());
        } else {
            simId = executionService.nextId();
            dto.setExcnYmd(baseYmd.get());
        }

        dto.setSimId(simId);
        SmltMdlDto modelDto = castApiMapper.retrieveModelInfo(dto);

        if (modelDto == null || modelDto.getSmltMdlSn() == null)
            throw new IllegalStateException("CAST 모델 정보를 찾을 수 없습니다.");

        String sno = modelDto.getSmltMdlSn();
        dto.setSmltMdlSn(sno);

        if (executionMapper.hasModel(simId, sno) > 0)
            throw new IllegalStateException("동일 실행/모델에 다른 결과가 이미 저장되어 있습니다.");

        List<SmltRsltDtlDto> details = processDetailList(dto, simId, sno, relatedEventCd);
        castApiMapper.insertSimSet(dto);

        if (!details.isEmpty())
            executeBatchInsert(details);

        if (userReq != null) {
            userReq.setLoginIpAddr(dto.getLoginIpAddr());
            castApiMapper.updateUserReqFinished(userReq);
        }
        return 1;
    }

    private void validateUserResult(CastResReqDto dto, UserSmltReqDto request) {
        requireResource(request.getMdlRsrcId(), dto.getModelResourceID());
        requireResource(request.getFltSchdlRsrcId(), dto.getFlightScheduleResourceID());
        // CAST 는 Run 의 CheckInAllocationResourceID 를 "" 로 보낸다
        if (!isBlankResource(dto.getCheckInAllocationResourceID()))
            requireResource(request.getCknctAlctnRsrcId(), dto.getCheckInAllocationResourceID());
        requireResource(request.getSbdCntrlAlctnId(), dto.getSbdCounterAllocationResourceID());
        requireResource(request.getPrptStngRsrcId(), dto.getPropertySetResourceID());
        requireResource(request.getFcltyOpngDptcnySrngRsrcId(), dto.getFacilityOpeningTableDepartureGateResourceID());
        requireResource(request.getFcltyOpngScrtyCntrlRsrcId(), dto.getFacilityOpeningTableSecurityControlResourceID());
        requireResource(request.getCknctSrvcHrRsrcId(), dto.getCheckinCounterServiceTimeResourceID());
        requireResource(request.getChknTypeRsrcId(), dto.getCheckinTypeResourceID());
        requireResource(request.getFcltyOpngDptcnyRsrcId(), dto.getFacilityOpeningTableEmigrationResourceID());
        requireResource(request.getFcltyOpngEntcnyRsrcId(), dto.getFacilityOpeningTableImmigrationResourceID());
        requireResource(request.getFcltyOpngTrScrtyCntrlRsrcId(), dto.getFacilityOpeningTableTransferSecurityControlResourceID());
    }

    private static void requireResource(String expected, String actual) {
        // CAST 는 CheckInCounterServiceTime001 처럼 발행한 ID 와 대소문자를 다르게 돌려보낸다
        if (expected != null && !expected.isBlank() && !expected.equalsIgnoreCase(actual))
            throw new IllegalStateException("결과 입력 리소스가 요청과 다릅니다: " + expected);
    }

    private static boolean isBlankResource(String value) {
        return value == null || value.replace("\"", "").isBlank();
    }

    private UserSmltReqDto resolveResultRequest(CastResReqDto dto) {
        String resourceId = dto.getResourceID() == null ? "" : dto.getResourceID();
        if (resourceId.contains(" Auto")) {
            dto.setSmltType(AUTO);
            return null;
        }

        List<UserSmltReqDto> candidates = castApiMapper.retrieveUserReqByFsRsrcId(dto.getFlightScheduleResourceID());
        Matcher token = WHAT_IF_REQ_ID.matcher(resourceId);
        String reqId = token.find() ? token.group() : null;

        if (token.find())
            throw new IllegalStateException("결과에 요청 식별자가 둘 이상 있습니다.");

        if (reqId != null) {
            candidates = candidates.stream().filter(req -> reqId.equals(req.getSmltReqId())).collect(Collectors.toList());
        }

        if (candidates.size() != 1)
            throw new IllegalStateException("사용자 결과의 요청을 유일하게 식별할 수 없습니다.");

        dto.setSmltType(WHAT_IF);
        return candidates.get(0);
    }

    private List<SmltRsltDtlDto> processDetailList(CastResReqDto dto, String simId, String sno, int eventCd) {
        List<SmltRsltDtlDto> collector = new ArrayList<>();
        List<CastRsltRunDto> runList = dto.getResourceContent();

        if (runList == null) return collector;

        Map<String, String> psgFcltCdByName = new HashMap<>();
        for (CastRsltFcltCdDto fclt : castApiMapper.checkFcltCdList(dto)) {
            psgFcltCdByName.putIfAbsent(fclt.getSmltFcltNm(), fclt.getPsgFcltCd());
        }
        Optional<String> remoteAddr = CastApiXml.remoteAddr();
        // 매핑되지 않은 시설코드는 결과마다 한 번만 남긴다. 시각 행마다 넣으면 같은 코드가 하루 144건 쌓인다.
        Set<String> unmappedFcltCds = new LinkedHashSet<>();

        for (CastRsltRunDto run : runList) {
            processSingleRun(collector, unmappedFcltCds, dto, run, simId, sno, eventCd, psgFcltCdByName, remoteAddr);
        }

        for (String fcltCd : unmappedFcltCds) {
            SmltRsltDtlDto excl = new SmltRsltDtlDto();
            remoteAddr.ifPresent(excl::setLoginIpAddr);
            excl.setSmltId(simId);
            excl.setPsgFcltDesc(fcltCd);
            castApiMapper.insertSimResultDtlRegExcl(excl);
        }
        return collector;
    }

    private static void processSingleRun(List<SmltRsltDtlDto> collector, Set<String> unmappedFcltCds, CastResReqDto dto,
            CastRsltRunDto run, String simId, String sno, int eventCd, Map<String, String> psgFcltCdByName,
            Optional<String> remoteAddr) {
        String[] sIDs = run.getSelfID().split(",");
        String[] fcltCdArr = run.getBlockResourceID().split(",");
        String[] pID = run.getParentID().split(",");
        String[] t2 = run.getT2().split(",");
        String[] wtngPaxCnt = run.getQueueLengthCurrent().split(",");
        String[] passPaxCnt = run.getFinishedClientsAbs().split(",");
        String[] avgDealTime = run.getTransactionTimeAvg().split(",");
        String[] minDealTime = run.getTransactionTimeMin().split(",");
        String[] maxDealTime = run.getTransactionTimeMax().split(",");
        String[] avgWtngTime = run.getWaitingTimeAvg().split(",");
        String[] minWtngTime = run.getWaitingTimeMin().split(",");
        String[] maxWtngTime = run.getWaitingTimeMax().split(",");
        String[] avgWtngLen = run.getWaitingClientsAvg().split(",");
        String[] minWtngLen = run.getWaitingClientsMin().split(",");
        String[] maxWtngLen = run.getWaitingClientsMax().split(",");
        String runDttm = dto.getStartTime().replace("T", " ").substring(0, 19);

        for (int j = 0; j < sIDs.length; j++) {
            String parentId = j < pID.length ? pID[j] : "";
            if (sIDs[j] == null || sIDs[j].isBlank() || parentId.isEmpty()) {
                continue;
            }

            String fcltCd = cell(fcltCdArr, Integer.parseInt(parentId) - 1, BLOCK_RESOURCE_ID);
            String psgFcltCd = fcltCd == null || fcltCd.isBlank() ? null : psgFcltCdByName.get(fcltCd);

            if (psgFcltCd == null || psgFcltCd.isEmpty()) {
                unmappedFcltCds.add(fcltCd);
                continue;
            }

            SmltRsltDtlDto dtl = new SmltRsltDtlDto();
            remoteAddr.ifPresent(dtl::setLoginIpAddr);
            dtl.setSmltId(simId);
            dtl.setSmltMdlSn(sno);
            dtl.setSmltRsltSn(String.valueOf(j));
            dtl.setRelEventCd(eventCd);
            dtl.setPsgFcltCd(psgFcltCd);
            dtl.setSmltExcnDt(runDttm);
            dtl.setSmltActlDt(cell(t2, j, "T2").replace("T", " ").substring(0, 19));
            dtl.setWtngPsgCnt(Integer.parseInt(cell(wtngPaxCnt, j, QUEUE_LENGTH_CURRENT)));
            dtl.setTrnstPsgCnt(Integer.parseInt(cell(passPaxCnt, j, "FinishedClients_Abs")));
            dtl.setMinPrcsHr(calResultTime(cell(minDealTime, j, "TransactionTime_Min")));
            dtl.setAvgPrcsHr(calResultTime(cell(avgDealTime, j, "TransactionTime_Avg")));
            dtl.setMaxPrcsHr(calResultTime(cell(maxDealTime, j, "TransactionTime_Max")));
            dtl.setMinWtngHr(calResultTime(cell(minWtngTime, j, "WaitingTime_Min")));
            dtl.setAvgWtngHr(calResultTime(cell(avgWtngTime, j, "WaitingTime_Avg")));
            dtl.setMaxWtngHr(calResultTime(cell(maxWtngTime, j, "WaitingTime_Max")));
            dtl.setMinWtngLen(Float.parseFloat(cell(minWtngLen, j, "WaitingClients_Min")));
            dtl.setAvgWtngLen(Float.parseFloat(cell(avgWtngLen, j, "WaitingClients_Avg")));
            dtl.setMaxWtngLen(Float.parseFloat(cell(maxWtngLen, j, "WaitingClients_Max")));
            collector.add(dtl);
        }
    }

    private static String cell(String[] column, int index, String columnName) {
        if (index < 0 || index >= column.length) {
            throw new IllegalStateException("CAST 결과 " + columnName + " 열의 길이가 다른 열과 맞지 않습니다.");
        }
        return column[index];
    }

    private void executeBatchInsert(List<SmltRsltDtlDto> list) {
        int batchSize = 1000;
        for (int i = 0; i < list.size(); i += batchSize) {
            int end = Math.min(i + batchSize, list.size());
            List<SmltRsltDtlDto> batchList = list.subList(i, end);

            Map<String, Object> paramMap = new HashMap<>();
            paramMap.put(LIST, batchList);
            castApiMapper.insertSimResultDtl(paramMap);
        }
    }

    private static int calResultTime(String str) {
        if (str == null || str.length() < 19) return 0;

        String hourStr = str.substring(11, 13);
        String minuteStr = str.substring(14, 16);
        String secondStr = str.substring(17, 19);
        return Integer.parseInt(hourStr) * 3600 + Integer.parseInt(minuteStr) * 60 + Integer.parseInt(secondStr);
    }

    // ---- SetResource 메시지 파싱 ----

    private void parseMessage(Node node, String str, String tableId, ResultMessage message) {
        String id = CastApiXml.getAttributeValue(node.getAttributes(), ID).orElse("");
        String curTableId = id.isEmpty() ? tableId : id;
        NamedNodeMap attributeMap = node.getAttributes();

        if (RESOURCE_INFO.equals(str)) {
            parseResourceInfo(attributeMap, message);
        } else if (M_COL.equals(str)) {
            parseColumn(curTableId, attributeMap, message);
        }

        if (node.hasChildNodes()) {
            NodeList nodeList = node.getChildNodes();
            for (int i = 0; i < nodeList.getLength(); i++) {
                Node childNode = nodeList.item(i);

                if (childNode.getNodeType() == Node.TEXT_NODE) {
                    continue;
                }

                parseMessage(childNode, childNode.getNodeName(), curTableId, message);
            }
        }
    }

    private static void parseResourceInfo(NamedNodeMap attributeMap, ResultMessage message) {
        message.result.setResourceContent(message.runs);

        for (int i = 0; i < attributeMap.getLength(); i++) {
            Node attNode = attributeMap.item(i);
            BiConsumer<CastResReqDto, String> setter = RESOURCE_INFO_MAP.get(attNode.getNodeName());
            if (setter != null) {
                setter.accept(message.result, attNode.getNodeValue());
            }
        }
    }

    private static void parseColumn(String tableId, NamedNodeMap attributeMap, ResultMessage message) {
        if (RESOURCE.equals(tableId)) {
            String colName = attributeOf(attributeMap, S_P_NAME);
            if (BLOCK_RESOURCE_ID.equals(colName)) {
                for (int i = 0; i < attributeMap.getLength(); i++) {
                    Node attNode = attributeMap.item(i);
                    if (S_VALUES.equals(attNode.getNodeName())) {
                        message.run.setBlockResourceID(attNode.getNodeValue());
                    }
                }
            }
            return;
        }

        String[] column = columnOf(attributeMap);
        String colName = column[0];
        String colValue = column[1];
        if (colName.isEmpty()) {
            return;
        }

        if (RUN.equals(tableId)) {
            BiConsumer<CastResReqDto, String> setter = RUN_MAP.get(colName);
            if (setter != null) setter.accept(message.result, colValue);
        } else if (INTERVAL.equals(tableId)) {
            BiConsumer<CastRsltRunDto, String> setter = INTERVAL_MAP.get(colName);
            if (setter != null) {
                setter.accept(message.run, colValue);
                if (QUEUE_LENGTH_CURRENT.equals(colName)) {
                    message.runs.add(message.run);
                }
            }
        } else if (WHAT_IF_DEFINITION_TABLE.equals(tableId)) {
            BiConsumer<CastWhatIfCntrlDto, String> setter = WHATIF_MAP.get(colName);
            if (setter != null) setter.accept(message.whatIf, colValue);
        }
    }

    private static String attributeOf(NamedNodeMap attributeMap, String name) {
        for (int i = 0; i < attributeMap.getLength(); i++) {
            Node attNode = attributeMap.item(i);
            if (name.equals(attNode.getNodeName())) {
                return attNode.getNodeValue();
            }
        }
        return "";
    }

    // values 를 만나면 멈춘다. values 뒤에 오는 PName 은 읽지 않는다 (BlockResourceID 열과 다르다)
    private static String[] columnOf(NamedNodeMap attributeMap) {
        String colName = "";
        String colValue = "";
        for (int i = 0; i < attributeMap.getLength(); i++) {
            Node attNode = attributeMap.item(i);
            if (S_P_NAME.equals(attNode.getNodeName())) {
                colName = attNode.getNodeValue();
            }
            if (S_VALUES.equals(attNode.getNodeName())) {
                colValue = attNode.getNodeValue();
                break;
            }
        }
        return new String[] { colName, colValue };
    }

    // ---- CAST 모델 파일 저장 ----

    private void saveModel(CastModelDto dto) throws IOException {
        CastModelDto chk = castApiMapper.checkCASTModel(dto);
        if (chk != null) {
            writeModelFile(chk.getFileNm(), dto.getValues());
            castApiMapper.updateCASTModel(dto);
            return;
        }

        SmltMdlDto model = new SmltMdlDto();
        String newId = castApiMapper.retrieveNewCastModelId(dto);

        String ext = "";
        switch (dto.getResourceType()) {
            case CAST_MODEL:
                ext = CAST_MODEL;
                model.setSmltMdlTypeCd("1");
                break;
            case CAST_EXPRESS_MODEL:
                ext = CAST_EXPRESS_MODEL;
                model.setSmltMdlTypeCd("2");
                break;
            default:
                break;
        }
        String yyyymm = EgovDateUtil.getCurrentDateAsString().substring(0, 6);

        String savedPath = CoreYamlRead.getDefaultPath() + File.separator;
        FileUtil.makeFolder(savedPath);

        savedPath += "PM" + File.separator;
        FileUtil.makeFolder(savedPath);

        savedPath += "M" + File.separator;
        FileUtil.makeFolder(savedPath);

        savedPath += yyyymm + File.separator;
        FileUtil.makeFolder(savedPath);

        String resourceId = dto.getResourceID();
        String modelName = resourceId == null || resourceId.isEmpty() ? newId : resourceId;
        String storeFileNm = savedPath + DigestUtils.sha256Hex(modelName + "." + ext);
        writeModelFile(storeFileNm, dto.getValues());

        String atchFileId = castApiMapper.retrieveIdMaxPk();

        model.setSmltMdlExpln(modelName);
        model.setSmltMdlFilePathNm(atchFileId);
        model.setSmltMdlSn(newId);
        castApiMapper.insertCASTModel(model);

        PmAtchFileDto fdto = new PmAtchFileDto();
        fdto.setAtchFileId(atchFileId);
        fdto.setAtchFileNm(modelName + ".txt");
        fdto.setStrgFileNm(storeFileNm);
        fdto.setAtchFilePathNm("remote:" + modelName + ".txt");
        fdto.setAtchFileSn("1");
        fdto.setAtchFileTaskSeCd("M");
        fdto.setAtchFileTypeCd("E01");
        fdto.setAtchFileSz("100");
        fdto.setAtchFileExtnNm("txt");
        fdto.setLoginUserId("system");
        fdto.setFrstRgtrId("system");
        castApiMapper.insertAtchFile(fdto);
    }

    // 파일을 못 쓰면 예외를 그대로 던져 DB 등록까지 롤백한다. 없는 파일을 가리키는 모델 행이 남지 않게 한다.
    private static void writeModelFile(String path, String values) throws IOException {
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(path), StandardCharsets.UTF_8))) {
            writer.write(values);
        }
    }

    private static void parseModel(Node node, CastModelDto mDto) {
        if (node.hasAttributes()) {
            NamedNodeMap attributeMap = node.getAttributes();

            for (int i = 0; i < attributeMap.getLength(); i++) {
                Node attNode = attributeMap.item(i);

                switch (attNode.getNodeName()) {
                    case RESOURCE_TYPE:
                        mDto.setResourceType(attNode.getNodeValue());
                        break;
                    case RESOURCE_ID:
                        mDto.setResourceID(attNode.getNodeValue());
                        break;
                    case AUTHOR:
                        mDto.setAuthor(attNode.getNodeValue());
                        break;
                    case DESCRIPTION:
                        mDto.setDescription(attNode.getNodeValue());
                        break;
                    case LAST_MODIFIED:
                        mDto.setLastModified(attNode.getNodeValue());
                        break;
                    case S_VALUES:
                        mDto.setValues(attNode.getNodeValue());
                        break;
                    default:
                        break;
                }
            }
        }
        if (node.hasChildNodes()) {
            NodeList nodeList = node.getChildNodes();

            for (int i = 0; i < nodeList.getLength(); i++) {
                Node childNode = nodeList.item(i);
                if (childNode.getNodeType() == Node.TEXT_NODE) {
                    continue;
                }
                parseModel(childNode, mDto);
            }
        }
    }

    // ---- WhatIf 상태 동기화 ----

    private int updateWhatIf(CastWhatIfCntrlDto dto) {
        if (dto.getWhatIfRunId() == null || dto.getStatus() == null) {
            throw new IllegalStateException("CAST 요청 ID 또는 상태 목록이 없습니다.");
        }

        String[] sIDs = dto.getWhatIfRunId().split(",", -1);
        String[] sStts = dto.getStatus().split(",", -1);

        if (sIDs.length != sStts.length) {
            throw new IllegalStateException("CAST 요청 ID와 상태 목록의 길이가 다릅니다.");
        }

        Map<String, UserSmltReqStatus> reportedSttsMap = new LinkedHashMap<>();
        for (int j = 0; j < sIDs.length; j++) {
            String runId = sIDs[j].trim();
            String status = sStts[j].trim();

            if (runId.isBlank() && status.isBlank()) {
                continue;
            }

            UserSmltReqStatus to = UserSmltReqStatus.ofValue(status);

            if (runId.isBlank() || to == null) {
                throw new IllegalStateException("CAST 요청 ID 또는 상태 목록이 올바르지 않습니다.");
            }

            if (reportedSttsMap.putIfAbsent(runId, to) != null) {
                throw new IllegalStateException("CAST 상태 목록에 중복된 요청 ID가 있습니다: " + runId);
            }
        }

        if (reportedSttsMap.isEmpty()) {
            return 0;
        }

        Map<String, String> currentSttsMap = castApiMapper.checkWhatIfIdList(dto).stream()
                .collect(Collectors.toMap(CastWhatIfCntrlDto::getWhatIfRunId, CastWhatIfCntrlDto::getStatus,
                        (first, ignored) -> first));

        int rRslt = 0;
        for (Map.Entry<String, UserSmltReqStatus> reported : reportedSttsMap.entrySet()) {
            String runId = reported.getKey();
            UserSmltReqStatus from = UserSmltReqStatus.ofValue(currentSttsMap.get(runId));
            UserSmltReqStatus to = reported.getValue();

            if (from == null || !from.canTransitTo(to)) {
                continue;
            }

            CastWhatIfCntrlDto wDto = new CastWhatIfCntrlDto();
            CastApiXml.applyRemoteAddr(wDto::setLoginIpAddr);
            wDto.setWhatIfRunId(runId);
            wDto.setFromStatus(from.getValue());
            wDto.setStatus(to.getValue());

            int updated = castApiMapper.updateWhatIfDefinitionTableStts(wDto);
            rRslt = Math.addExact(rRslt, updated);
        }

        for (String runId : currentSttsMap.keySet()) {
            if (!reportedSttsMap.containsKey(runId)) {
                rRslt = Math.addExact(rRslt, castApiMapper.deleteWhatIfDefinitionTable(runId));
            }
        }
        return rRslt;
    }
}

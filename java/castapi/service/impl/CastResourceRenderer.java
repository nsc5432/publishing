package aoms.pm.castapi.service.impl;

import static aoms.pm.castapi.service.statics.CastApiConstants.*;
import static aoms.pm.castapi.service.statics.CastApiFieldMaps.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.BiFunction;
import java.util.function.Function;

import org.apache.commons.text.StringEscapeUtils;
import org.springframework.stereotype.Component;

import aoms.framework.cmmn.util.FileUtil;
import aoms.pm.castapi.mapper.CastApiMapper;
import aoms.pm.castapi.service.statics.CastApiFieldMaps.FieldInfo;
import aoms.pm.cmmn.dto.CastCheckInCounterServiceTimeDto;
import aoms.pm.cmmn.dto.CastCheckinTypeDto;
import aoms.pm.cmmn.dto.CastCounterAllocationDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblDptgDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblEmigDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblImmigDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblScrtyCntrlDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblTrnstScrtyCntrlDto;
import aoms.pm.cmmn.dto.CastFlightScheduleDto;
import aoms.pm.cmmn.dto.CastModelDto;
import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.cmmn.dto.CastResourceInformationDto;
import aoms.pm.cmmn.dto.CastRptStngHrGroupCntrlDto;
import aoms.pm.cmmn.dto.CastSelfCheckInCountAndBagDropDto;
import aoms.pm.cmmn.dto.CastWhatIfCntrlDto;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CastResourceRenderer {
    private enum ColumnNaming { RAW, PASCAL, PASCAL_SPACED }

    private static final class TableSpec<T> {
        private final String resourceType;
        private final int allowDefaultValue;
        private final String friendlyName;
        private final String tableId;
        private final BiFunction<CastApiMapper, CastReqGetResourceDto, List<T>> query;
        private final Function<T, String> lastModified;
        private final Map<String, FieldInfo<T>> fields;
        private final ColumnNaming naming;
        private final Set<String> quotedTags;
        private final boolean escapeValues;

        private TableSpec(String resourceType, int allowDefaultValue, String friendlyName, String tableId,
                BiFunction<CastApiMapper, CastReqGetResourceDto, List<T>> query, Function<T, String> lastModified,
                Map<String, FieldInfo<T>> fields, ColumnNaming naming, Set<String> quotedTags, boolean escapeValues) {
            this.resourceType = resourceType;
            this.allowDefaultValue = allowDefaultValue;
            this.friendlyName = friendlyName;
            this.tableId = tableId;
            this.query = query;
            this.lastModified = lastModified;
            this.fields = fields;
            this.naming = naming;
            this.quotedTags = quotedTags;
            this.escapeValues = escapeValues;
        }

        private static <T> TableSpec<T> of(String resourceType, int allowDefaultValue, String friendlyName, String tableId,
                BiFunction<CastApiMapper, CastReqGetResourceDto, List<T>> query, Function<T, String> lastModified,
                Map<String, FieldInfo<T>> fields, ColumnNaming naming) {
            return new TableSpec<>(resourceType, allowDefaultValue, friendlyName, tableId, query, lastModified,
                    fields, naming, Collections.emptySet(), false);
        }

        private TableSpec<T> quoting(String... tags) {
            return new TableSpec<>(resourceType, allowDefaultValue, friendlyName, tableId, query, lastModified,
                    fields, naming, new HashSet<>(Arrays.asList(tags)), escapeValues);
        }

        private TableSpec<T> escaping() {
            return new TableSpec<>(resourceType, allowDefaultValue, friendlyName, tableId, query, lastModified,
                    fields, naming, quotedTags, true);
        }
    }

    private static final TableSpec<CastFlightScheduleDto> FLIGHT_SCHEDULE_SPEC = TableSpec.of(
            FLIGHT_SCHEDULE, 0, "Table", "Self_TBasicObject",
            CastApiMapper::retrieveFlightSchedule, CastFlightScheduleDto::getLastModified,
            FS_FIELD_MAP, ColumnNaming.RAW);

    private static final TableSpec<CastCounterAllocationDto> COUNTER_ALLOCATION_SPEC = TableSpec.of(
            COUNTER_ALLOCATION, 0, COUNTER_ALLOCATION, COUNTER_ALLOCATION,
            CastApiMapper::retrieveCounterAllocation, CastCounterAllocationDto::getLastModified,
            CA_FIELD_MAP, ColumnNaming.RAW)
            .quoting(CHECKINALLOCDESCRYPTION);

    private static final TableSpec<CastSelfCheckInCountAndBagDropDto> SBD_ALLOCATION_SPEC = TableSpec.of(
            COUNTER_ALLOCATION, 0, COUNTER_ALLOCATION, COUNTER_ALLOCATION,
            CastApiMapper::retrieveSelfCheckInCountAndBagDrop, CastSelfCheckInCountAndBagDropDto::getLastModified,
            SBD_FIELD_MAP, ColumnNaming.RAW)
            .quoting(AIRLINECODE, CHECKINALLOCDESCRYPTION);

    // GenericTable 은 리소스 ID 에 포함된 이름으로 고른다. 순서대로 비교한다.
    private static final Map<String, TableSpec<?>> GENERIC_TABLE_SPECS = new LinkedHashMap<>();
    static {
        GENERIC_TABLE_SPECS.put(CHECK_IN_TYPE, TableSpec.of(
                GENERIC_TABLE, -1, CHECK_IN_TYPE, CHECK_IN_TYPE,
                CastApiMapper::retrieveCheckinType, CastCheckinTypeDto::getLastModified,
                CT_FIELD_MAP, ColumnNaming.PASCAL_SPACED));
        GENERIC_TABLE_SPECS.put(CHECK_IN_COUNTER_SERVICE_TIME, TableSpec.of(
                GENERIC_TABLE, -1, "CheckinCounterServiceTime001", "CheckinCounterServiceTime001",
                CastApiMapper::retrieveCheckInCounterServiceTime, CastCheckInCounterServiceTimeDto::getLastModified,
                ST_FIELD_MAP, ColumnNaming.PASCAL_SPACED)
                .escaping());
        GENERIC_TABLE_SPECS.put(FACILITY_OPENING_TABLE_DEPARTURE_GATE, TableSpec.of(
                GENERIC_TABLE, -1, "Facility Opening Table_Departure Gate", FACILITY_OPENING_TABLE_DEPARTURE_GATE,
                CastApiMapper::retrieveFcltyOpngTblDptg, CastFcltyOpngTblDptgDto::getLastModified,
                DG_FIELD_MAP, ColumnNaming.PASCAL_SPACED));
        GENERIC_TABLE_SPECS.put(FACILITY_OPENING_TABLE_EMIGRATION, TableSpec.of(
                GENERIC_TABLE, 0, "Facility Opening Table_Emigration", FACILITY_OPENING_TABLE_EMIGRATION,
                CastApiMapper::retrieveFcltyOpngTblEmig, CastFcltyOpngTblEmigDto::getLastModified,
                EM_FIELD_MAP, ColumnNaming.PASCAL_SPACED));
        GENERIC_TABLE_SPECS.put(FACILITY_OPENING_TABLE_IMMIGRATION, TableSpec.of(
                GENERIC_TABLE, -1, "Facility Opening Table_Immigration", FACILITY_OPENING_TABLE_IMMIGRATION,
                CastApiMapper::retrieveFcltyOpngTblImmig, CastFcltyOpngTblImmigDto::getLastModified,
                IM_FIELD_MAP, ColumnNaming.PASCAL_SPACED));
        GENERIC_TABLE_SPECS.put(FACILITY_OPENING_TABLE_SECURITY_CONTROL, TableSpec.of(
                GENERIC_TABLE, 0, "Facility Opening Table_Security Control", FACILITY_OPENING_TABLE_SECURITY_CONTROL,
                CastApiMapper::retrieveFcltyOpngTblScrtyCntrl, CastFcltyOpngTblScrtyCntrlDto::getLastModified,
                SC_FIELD_MAP, ColumnNaming.PASCAL_SPACED));
        GENERIC_TABLE_SPECS.put(FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL, TableSpec.of(
                GENERIC_TABLE, -1, "Facility Opening Table_Transfer Security Control", FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL,
                CastApiMapper::retrieveFcltyOpngTblTrnstScrtyCntrl, CastFcltyOpngTblTrnstScrtyCntrlDto::getLastModified,
                TS_FIELD_MAP, ColumnNaming.PASCAL_SPACED));
        GENERIC_TABLE_SPECS.put(REPORTING_PROFILES_TIME_GROUPS, TableSpec.of(
                GENERIC_TABLE, -1, "Reporting Profiles Time Groups", REPORTING_PROFILES_TIME_GROUPS,
                CastApiMapper::retrieveRptStngHrGroupCntrl, CastRptStngHrGroupCntrlDto::getLastModified,
                RS_FIELD_MAP, ColumnNaming.PASCAL_SPACED));
        GENERIC_TABLE_SPECS.put(WHAT_IF_DEFINITION_TABLE, TableSpec.of(
                GENERIC_TABLE, 0, WHAT_IF_DEFINITION_TABLE, WHAT_IF_DEFINITION_TABLE,
                CastApiMapper::retrieveWhatIfCntrl, CastWhatIfCntrlDto::getLastModified,
                WI_FIELD_MAP, ColumnNaming.PASCAL));
    }

    private static final DateTimeFormatter LAST_MODIFIED_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final CastApiMapper castApiMapper;

    public String renderResourceInformation(List<Object> results, boolean result) {
        StringBuilder sb = new StringBuilder();
        sb.append(XML_VERSION);
        sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
        sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
        sb.append(System.lineSeparator());
        sb.append(TAB_TWO).append(RES_GET_RESOURCE_INFORMATION_START);
        sb.append(System.lineSeparator());
        sb.append(TAB_THREE).append(RESOURCE_INFOS_START);

        if (results != null) {
            for (Object obj : results) {
                CastResourceInformationDto data = (CastResourceInformationDto) obj;
                sb.append(System.lineSeparator());
                sb.append(TAB_FOUR)
                  .append("<").append(RESOURCE_INFO).append(" ")
                  .append(RESOURCE_TYPE).append("=\"").append(data.getResourceType()).append("\" ")
                  .append(RESOURCE_ID).append("=\"").append(data.getResourceID()).append("\" ")
                  .append(AUTHOR).append("=\"").append(data.getAuthor()).append("\" ")
                  .append(DESCRIPTION).append("=\"").append(data.getDescription()).append("\" ")
                  .append(LAST_MODIFIED).append("=\"").append(data.getLastModified()).append("\"/>");
            }
        }

        sb.append(System.lineSeparator());
        sb.append(TAB_THREE).append(RESOURCE_INFOS_END);
        sb.append(System.lineSeparator());
        sb.append(TAB_THREE).append(INVOCATION_RESULT).append(result ? TRUE : FALSE).append(INVOCATION_RESULT_MESSAGE).append(result ? MESSAGE_OK : MESSAGE_NOT_OK).append("\"/>");
        sb.append(System.lineSeparator());
        sb.append(TAB_TWO).append(RES_GET_RESOURCE_INFORMATION_END);
        sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_END);
        sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_END);

        return sb.toString();
    }

    // FlightSchedule · CounterAllocation · GenericTable. 리소스 ID 에 맞는 GenericTable 이 없으면 비어 있다.
    public Optional<String> renderTable(String type, CastReqGetResourceDto idto) {
        String resourceId = idto.getResourceID();
        if (FLIGHT_SCHEDULE.equals(type)) {
            return Optional.of(renderTable(FLIGHT_SCHEDULE_SPEC, idto));
        }
        if (COUNTER_ALLOCATION.equals(type)) {
            return Optional.of(resourceId.contains("CA")
                    ? renderTable(COUNTER_ALLOCATION_SPEC, idto)
                    : renderTable(SBD_ALLOCATION_SPEC, idto));
        }
        for (Map.Entry<String, TableSpec<?>> entry : GENERIC_TABLE_SPECS.entrySet()) {
            if (resourceId.contains(entry.getKey())) {
                return Optional.of(renderTable(entry.getValue(), idto));
            }
        }
        return Optional.empty();
    }

    public String renderModel(String type, CastReqGetResourceDto idto) {
        CastModelDto ms = CAST_EXPRESS_MODEL.equals(type) ? castApiMapper.retrieveCASTExModel(idto) : castApiMapper.retrieveCASTModel(idto);
        if (ms == null) throw new IllegalStateException("CAST 모델 리소스가 없습니다.");

        String filePath = ms.getFileNm();
        if (filePath == null || !FileUtil.isExistsFile(filePath)) throw new IllegalStateException("CAST 모델 파일이 없습니다.");

        StringBuilder fileValue;
        try {
            fileValue = FileUtil.readTextFile(filePath, false);
        } catch (IOException e) {
            throw new IllegalStateException("CAST 모델 파일을 읽지 못했습니다.", e);
        }

        StringBuilder sb = new StringBuilder();
        CastApiXml.openGetResource(sb);
        appendResourceInfo(sb, type, ms.getResourceID(), ms.getAuthor(), ms.getDescription(), ms.getLastModified());
        sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
        sb.append(System.lineSeparator());
        sb.append(TAB_FOUR).append(M_TABLE_START).append(ms.getTableID()).append(FNC_S_QUOT_ONE).append(">");
        sb.append(System.lineSeparator());
        sb.append(TAB_FIVE).append("<m:col PName=").append(FNC_S_QUOT_ONE).append(MODEL).append(FNC_S_QUOT_ONE).append(" ");
        sb.append("PFriendlyName=").append(FNC_S_QUOT_ONE).append(MODEL).append(FNC_S_QUOT_ONE).append(" ");
        sb.append("PKind=").append(FNC_S_QUOT_ONE).append("Binary").append(FNC_S_QUOT_ONE).append(" ");
        sb.append("PEnumType=").append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE).append(" ");
        sb.append("values=").append(FNC_S_QUOT_ONE).append(fileValue.toString()).append(FNC_S_QUOT_ONE).append("/>");
        sb.append(System.lineSeparator());
        sb.append(TAB_FOUR).append(M_TABLE_END);
        sb.append(System.lineSeparator());
        sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
        sb.append(System.lineSeparator());
        CastApiXml.closeGetResource(sb, true);
        return sb.toString();
    }

    // CAST 테이블은 열 단위다. 필드마다 모든 행의 값을 쉼표로 이어 m:col 하나에 싣는다.
    private <T> String renderTable(TableSpec<T> spec, CastReqGetResourceDto idto) {
        List<T> rows = spec.query.apply(castApiMapper, idto);
        List<String> tags = new ArrayList<>(spec.fields.keySet());
        List<FieldInfo<T>> fields = new ArrayList<>(spec.fields.values());
        StringBuilder[] values = new StringBuilder[fields.size()];
        for (int f = 0; f < values.length; f++) {
            values[f] = new StringBuilder(rows.size() * 16);
        }

        for (int r = 0; r < rows.size(); r++) {
            T row = rows.get(r);
            for (int f = 0; f < values.length; f++) {
                if (r > 0) {
                    values[f].append(',');
                }
                values[f].append(valueOf(spec, tags.get(f), fields.get(f).extractor.apply(row)));
            }
        }

        String lastModified = rows.isEmpty()
                ? LocalDateTime.now().format(LAST_MODIFIED_FORMAT)
                : spec.lastModified.apply(rows.get(0));

        StringBuilder sb = new StringBuilder();
        CastApiXml.openGetResource(sb);
        appendResourceInfo(sb, spec.resourceType, idto.getResourceID(), DEFAULT_AUTHOR, spec.resourceType, lastModified);
        sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
        sb.append(System.lineSeparator());
        sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(spec.allowDefaultValue)
          .append(FRIENDLYNAME).append(spec.friendlyName).append(XML_ID).append(spec.tableId).append(FNC_S_QUOT_ONE).append(">");
        sb.append(System.lineSeparator());
        for (int f = 0; f < values.length; f++) {
            String xmlTag = tags.get(f);
            appendColumn(sb, friendlyNameOf(spec.naming, xmlTag), fields.get(f).pKind, pNameOf(spec.naming, xmlTag), values[f]);
        }
        sb.append(TAB_FOUR).append(M_TABLE_END);
        sb.append(System.lineSeparator());
        sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
        sb.append(System.lineSeparator());
        CastApiXml.closeGetResource(sb, true);
        return sb.toString();
    }

    private static void appendResourceInfo(StringBuilder sb, String type, String resourceId, String author,
            String description, String lastModified) {
        sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(type).append(FNC_S_QUOT_ONE).append(" ");
        sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(resourceId).append(FNC_S_QUOT_ONE).append(" ");
        sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(author).append(FNC_S_QUOT_ONE).append(" ");
        sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(description).append(FNC_S_QUOT_ONE).append(" ");
        sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(lastModified).append(FNC_S_QUOT_ONE).append("/>");
        sb.append(System.lineSeparator());
    }

    private static void appendColumn(StringBuilder sb, String friendlyName, String pKind, String pName, CharSequence value) {
        sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
        sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(friendlyName).append(FNC_S_QUOT_ONE).append(" ");
        sb.append(pKind);
        sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(pName).append(FNC_S_QUOT_ONE);
        sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(value).append(FNC_S_QUOT_ONE).append("/>");
        sb.append(System.lineSeparator());
    }

    private static String valueOf(TableSpec<?> spec, String xmlTag, Object value) {
        if (value == null) {
            return "";
        }
        String text = value.toString();
        if (spec.quotedTags.contains(xmlTag)) {
            return text.replace(FNC_S_QUOT_ONE, FNC_QUOT_ONE);
        }
        return spec.escapeValues ? StringEscapeUtils.escapeXml11(text) : text;
    }

    private static String friendlyNameOf(ColumnNaming naming, String xmlTag) {
        switch (naming) {
            case PASCAL:
                return toPascalCase(xmlTag);
            case PASCAL_SPACED:
                return splitWords(toPascalCase(xmlTag));
            default:
                return xmlTag;
        }
    }

    private static String pNameOf(ColumnNaming naming, String xmlTag) {
        return naming == ColumnNaming.RAW ? xmlTag : toPascalCase(xmlTag);
    }

    private static String toPascalCase(String camelCase) {
        if (camelCase == null || camelCase.isBlank()) {
            return camelCase;
        }

        return camelCase.substring(0, 1).toUpperCase() + camelCase.substring(1);
    }

    private static String splitWords(String pascalCase) {
        if (pascalCase == null || pascalCase.isBlank()) {
            return pascalCase;
        }

        StringBuilder result = new StringBuilder();
        for (int i = 0; i < pascalCase.length(); i++) {
            char c = pascalCase.charAt(i);

            if ("CurrentNumberofLanes".equals(pascalCase) && c == 'o' || Character.isUpperCase(c) && i > 0) {
                result.append(" ");
            }

            result.append(c);
        }

        return result.toString();
    }
}

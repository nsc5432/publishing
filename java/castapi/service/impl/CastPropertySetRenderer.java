package aoms.pm.castapi.service.impl;

import static aoms.pm.castapi.service.statics.CastApiConstants.*;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.parsers.ParserConfigurationException;

import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import aoms.pm.cast.dto.UserSmltReqDto;
import aoms.pm.castapi.mapper.CastApiMapper;
import aoms.pm.cmmn.dto.CastProPertySetDtlDto;
import aoms.pm.cmmn.dto.CastPropertySetDto;
import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.utils.StringUtils;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CastPropertySetRenderer {
    private static final class PropertyColumns {
        private final StringBuilder pName = new StringBuilder();
        private final StringBuilder pFriendlyName = new StringBuilder();
        private final StringBuilder pEnumType = new StringBuilder();
        private final StringBuilder pKind = new StringBuilder();
        private final StringBuilder unitName = new StringBuilder();
        private final StringBuilder values = new StringBuilder();

        private void add(boolean leadingComma, String name, String friendlyName, String enumType, String kind, String value) {
            if (leadingComma) {
                for (StringBuilder sb : new StringBuilder[] { pName, pFriendlyName, pEnumType, pKind, unitName, values }) {
                    sb.append(',');
                }
            }
            pName.append(name);
            pFriendlyName.append(friendlyName);
            pEnumType.append(enumType);
            pKind.append(kind);
            unitName.append("");
            values.append(value);
        }
    }

    private static final String DAILY_PRPT_SET_RSRC_ID = "PS001";

    private final CastApiMapper castApiMapper;

    // 원천 PS001의 XML을 만든 뒤, PS ID와 시설 참조를 사용자 시뮬레이션에 할당된 ID로 바꾼다.
    public String renderUserPropertySet(UserSmltReqDto request) {
        String sourceNo = DAILY_PRPT_SET_RSRC_ID.substring(2);

        Map<String, String> replacements = new LinkedHashMap<>();
        replacements.put(DAILY_PRPT_SET_RSRC_ID, request.getPrptStngRsrcId());
        replacements.put("SBD" + sourceNo, request.getSbdCntrlAlctnId());
        replacements.put("FacilityOpeningTable_DepartureGate" + sourceNo, request.getFcltyOpngDptcnySrngRsrcId());
        replacements.put("FacilityOpeningTable_SecurityControl" + sourceNo, request.getFcltyOpngScrtyCntrlRsrcId());
        replacements.put("FacilityOpeningTable_Immigration" + sourceNo, request.getFcltyOpngEntcnyRsrcId());
        replacements.put("FacilityOpeningTable_TransferSecurityControl" + sourceNo, request.getFcltyOpngTrScrtyCntrlRsrcId());

        for (String value : replacements.values())
            if (value == null || value.isBlank())
                throw new IllegalStateException("PropertySet 리소스 참조가 없습니다.");

        Pattern pattern = Pattern.compile(String.join("|", replacements.keySet()));
        Matcher matcher = pattern.matcher(renderBasePropertySetXml(request.getExcnYmd()));

        StringBuffer result = new StringBuffer();

        while (matcher.find())
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacements.get(matcher.group())));

        matcher.appendTail(result);
        return result.toString();
    }

    public String render(CastReqGetResourceDto idto) {
        PropertyColumns columns = new PropertyColumns();
        CastPropertySetDto propertySetMstr = castApiMapper.retrievePropertySetMst(idto);
        // 서비스 관련 속성
        addServiceProperties(idto, columns);
        // 여객/자원 정보
        addPaxProperties(idto, columns);
        // 리소스 ID 참조 속성
        addResourceIdProperties(idto, columns);

        StringBuilder sb = new StringBuilder();
        CastApiXml.openGetResource(sb);
        if (propertySetMstr == null) {
            CastApiXml.closeGetResource(sb, false);
            return sb.toString();
        }

        sb.append(TAB_THREE).append("<").append(RESOURCE_INFO).append(" ").append(AUTHOR).append("=\"").append(propertySetMstr.getAuthor()).append(FNC_S_QUOT_ONE)
          .append(" ").append(CREATED).append("=\"").append(propertySetMstr.getCreated()).append(FNC_S_QUOT_ONE)
          .append(" ").append(DESCRIPTION).append("=\"").append(PROPERTY_SET).append(FNC_S_QUOT_ONE)
          .append(" ").append(LAST_MODIFIED).append("=\"").append(propertySetMstr.getLastModified()).append(FNC_S_QUOT_ONE)
          .append(" ").append(LAST_SAVE_BY).append("=\"").append(propertySetMstr.getLastSaveBy()).append(FNC_S_QUOT_ONE)
          .append(" ").append(LAST_SAVED_USING_VERSION).append("=\"").append(propertySetMstr.getLastSaveUsingVersion()).append(FNC_S_QUOT_ONE)
          .append(" ").append(RESOURCE_ID).append("=\"").append(propertySetMstr.getResourceID()).append(FNC_S_QUOT_ONE)
          .append(" ").append(RESOURCE_TYPE).append("=\"").append(PROPERTY_SET).append(FNC_S_QUOT_ONE).append("/>")
          .append(System.lineSeparator())
          .append(TAB_THREE).append(RESOURCE_CONTENT_START)
          .append(System.lineSeparator())
          .append(TAB_FOUR).append(M_TABLE_START).append(idto.getResourceID()).append(FNC_S_QUOT_ONE)
          .append(" id=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(">")
          .append(System.lineSeparator())
          .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
          .append(PROPERTY_NAME).append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE)
          .append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(S_P_NAME).append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE)
          .append("RunID,").append(columns.pName).append(FNC_S_QUOT_ONE).append("/>")
          .append(System.lineSeparator())
          .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE)
          .append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append("Property Friendly Name").append(FNC_S_QUOT_ONE)
          .append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE)
          .append("PFriendlyName").append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE)
          .append("Run ID,").append(columns.pFriendlyName).append(FNC_S_QUOT_ONE).append("/>")
          .append(System.lineSeparator())
          .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
          .append("Property Enumeration Type").append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE)
          .append("PEnumType").append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(",").append(columns.pEnumType).append(FNC_S_QUOT_ONE).append("/>")
          .append(System.lineSeparator())
          .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE)
          .append("TPKind").append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
          .append("Property Kind").append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append("Enumeration").append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE)
          .append("PKind").append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(STRING).append(",").append(columns.pKind).append(FNC_S_QUOT_ONE).append("/>")
          .append(System.lineSeparator())
          .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
          .append("Unit Name").append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE)
          .append("UnitName").append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(",").append(columns.unitName).append(FNC_S_QUOT_ONE).append("/>")
          .append(System.lineSeparator())
          .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
          .append("Property Values").append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME)
          .append(FNC_S_QUOT_ONE).append(S_VALUES).append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(",").append(columns.values).append(FNC_S_QUOT_ONE).append("/>")
          .append(System.lineSeparator())
          .append(TAB_FOUR).append(M_TABLE_END)
          .append(System.lineSeparator())
          .append(TAB_THREE).append(RESOURCE_CONTENT_END)
          .append(System.lineSeparator());
        CastApiXml.closeGetResource(sb, true);
        return sb.toString();
    }

    private String renderBasePropertySetXml(String baseYmd) {
        CastReqGetResourceDto dto = new CastReqGetResourceDto();
        dto.setResourceType(PROPERTY_SET);
        dto.setResourceID(DAILY_PRPT_SET_RSRC_ID);
        dto.setBaseYmd(baseYmd);

        String xml = render(dto);

        try {
            Document document = CastApiXml.parseXmlSafely(xml);
            boolean populated = false;
            NodeList columns = document.getElementsByTagName("m:col");

            for (int i = 0; i < columns.getLength(); i++) {
                Element column = (Element) columns.item(i);
                if (!S_VALUES.equals(column.getAttribute(S_P_NAME)))
                    continue;

                String value = column.getAttribute(S_VALUES).replace(",", "").trim();
                if (!value.isEmpty())
                    populated = true;
            }

            if (!populated)
                throw new IllegalStateException("CAST 입력 내용이 없습니다: " + DAILY_PRPT_SET_RSRC_ID);
        } catch (ParserConfigurationException | SAXException | IOException e) {
            throw new IllegalStateException("CAST 입력 XML이 유효하지 않습니다: " + DAILY_PRPT_SET_RSRC_ID, e);
        }

        return xml;
    }

    private void addServiceProperties(CastReqGetResourceDto idto, PropertyColumns columns) {
        List<Object> rows = castApiMapper.retrievePropertySetSvc(idto);
        if (rows == null) return;

        for (int i = 0; i < rows.size(); i++) {
            CastPropertySetDto step = (CastPropertySetDto) rows.get(i);
            columns.add(i > 0, step.getPName(), step.getPFriendlyName(), step.getPEnumType(), STRING, distributionXml(step));
        }
    }

    private void addPaxProperties(CastReqGetResourceDto idto, PropertyColumns columns) {
        List<Object> rows = castApiMapper.retrievePropertySetPax(idto);
        if (rows == null) return;

        for (Object row : rows) {
            CastPropertySetDto step = (CastPropertySetDto) row;
            columns.add(true, step.getPName(), step.getPFriendlyName(), step.getPEnumType(), step.getVlType(), paxXml(step));
        }
    }

    private void addResourceIdProperties(CastReqGetResourceDto idto, PropertyColumns columns) {
        List<Object> rows = castApiMapper.retrievePropertySetId(idto);
        if (rows == null) return;

        for (Object row : rows) {
            CastPropertySetDto step = (CastPropertySetDto) row;
            columns.add(true, step.getPName(), step.getPFriendlyName(), step.getPEnumType(), STRING, step.getVal());
        }
    }

    // ---- 서비스 시간 분포식 (tyCd 01~11) ----

    private static String distributionXml(CastPropertySetDto step) {
        String vlType = step.getVlType();
        StringBuilder xml = new StringBuilder();

        switch (step.getTyCd()) {
            case "01":
                if ("1".equals(vlType)) triangle(xml, step, FNC_ERROR_RETURN_VALUE_FLOAT);
                else if ("2".equals(vlType)) triangle(xml, step, FNC_ERROR_RETURN_VALUE_INTEGER);
                else if ("3".equals(vlType)) triangle(xml, step, FNC_ERROR_RETURN_VALUE_UNASSIGNED);
                break;
            case "02":
                if ("1".equals(vlType)) randomized(xml, step, TID_RANDOMIZED, FNC_ERROR_RETURN_VALUE_FLOAT, FNC_MAX, FNC_MIN);
                else if ("2".equals(vlType)) randomized(xml, step, TID_RANDOMIZED_INTEGER, FNC_ERROR_RETURN_VALUE_INTEGER, FNC_MAX_INTEGER, FNC_MIN_INTEGER);
                else if ("3".equals(vlType)) randomized(xml, step, TID_RANDOMIZED, FNC_ERROR_RETURN_VALUE_UNASSIGNED, FNC_MAX, FNC_MIN);
                break;
            case "03":
                // Gamma 만 UseRestr 가 없다
                openDistribution(xml, TID_GAMMA, FNC_ERROR_RETURN_VALUE_FLOAT);
                param(xml, FNC_SCALE, step.getMin());
                param(xml, FNC_SHAPE, step.getMax());
                closeDistribution(xml);
                break;
            case "04":
                floatDistribution(xml, TID_CONTANT);
                param(xml, FNC_VALUE, step.getMin());
                closeDistribution(xml);
                break;
            case "05":
                floatDistribution(xml, TID_GAUSSIAN);
                param(xml, FNC_MEAN, step.getMin());
                param(xml, FNC_STD_DEV, step.getMax());
                closeDistribution(xml);
                break;
            case "06":
                floatDistribution(xml, TID_EXPONENTIAL);
                param(xml, FNC_MAX, step.getMax());
                param(xml, FNC_MIN, step.getMin());
                closeDistribution(xml);
                break;
            case "07":
                floatDistribution(xml, TID_ERLANG);
                param(xml, FNC_OFFSET, step.getMin());
                param(xml, FNC_DEGFREEDOM, step.getMax());
                param(xml, FNC_LAMBDA, step.getDist());
                closeDistribution(xml);
                break;
            case "08":
                floatDistribution(xml, TID_WEIBULL);
                param(xml, FNC_SCALE, step.getMin());
                param(xml, FNC_SHAPE, step.getMax());
                closeDistribution(xml);
                break;
            case "09":
                floatDistribution(xml, TID_POLYGONAL);
                param(xml, FNC_INTERVAL_DATA, step.getMin());
                param(xml, FNC_OFFSET, step.getMax());
                closeDistribution(xml);
                break;
            case "10":
                floatDistribution(xml, TID_POISSON);
                param(xml, FNC_MEAN, step.getMin());
                closeDistribution(xml);
                break;
            case "11":
                floatDistribution(xml, TID_NEGATIVE_BINOMIAL);
                param(xml, FNC_MAX, step.getMax());
                param(xml, FNC_MIN, step.getMin());
                closeDistribution(xml);
                break;
            default:
                xml.append(step.getVal());
                break;
        }

        return xml.toString();
    }

    private static void triangle(StringBuilder sb, CastPropertySetDto step, String errorReturnValue) {
        openDistribution(sb, TID_TRIANGLE, errorReturnValue);
        sb.append(FNC_USE_RESTR);
        param(sb, FNC_A, step.getMin());
        param(sb, FNC_B, step.getMax());
        param(sb, FNC_C, step.getDist());
        closeDistribution(sb);
    }

    private static void randomized(StringBuilder sb, CastPropertySetDto step, String tid, String errorReturnValue,
            String maxName, String minName) {
        openDistribution(sb, tid, errorReturnValue);
        param(sb, maxName, step.getMax());
        param(sb, minName, step.getMin());
        sb.append(FNC_USE_RESTR);
        closeDistribution(sb);
    }

    private static void floatDistribution(StringBuilder sb, String tid) {
        openDistribution(sb, tid, FNC_ERROR_RETURN_VALUE_FLOAT);
        sb.append(FNC_USE_RESTR);
    }

    private static void openDistribution(StringBuilder sb, String tid, String errorReturnValue) {
        sb.append(tid)
          .append(FNC_ROLE)
          .append(FNC_ANNOTATION)
          .append(FNC_CATEGORY)
          .append(FNC_DESCRIPTION)
          .append(FNC_DISTRIBUTION_UNIT)
          .append(FNC_DYNAMIC_PARAMS)
          .append(FNC_ERROR_HANDLEING_MODE)
          .append(errorReturnValue)
          .append(FNC_EXPANDED);
    }

    private static void param(StringBuilder sb, String name, Object value) {
        sb.append(name).append(value).append(FNC_QUOT_TWO);
    }

    private static void closeDistribution(StringBuilder sb) {
        sb.append(FNC_QT).append(FNC_LR).append(FNC_QUOT_ONE);
    }

    // ---- 여객 속성 (tyCd 01~05) ----

    private String paxXml(CastPropertySetDto step) {
        String tyCd = step.getTyCd();
        StringBuilder xml = new StringBuilder();
        CastProPertySetDtlDto pax = new CastProPertySetDtlDto();
        pax.setCd(step.getCd());
        pax.setResourceID(step.getResourceID());
        List<Object> paxDtl = castApiMapper.retrievePropertySetPaxDtl(pax);

        for (int i = 0; i < paxDtl.size(); i++) {
            CastProPertySetDtlDto paxInput = (CastProPertySetDtlDto) paxDtl.get(i);
            boolean last = i == paxDtl.size() - 1;

            switch (tyCd) {
                case "01":
                    appendConstantShareRows(xml, paxInput, i);
                    if (last) xml.append(T_CONSTANT_SHARE_ROWS_END);
                    break;
                case "02":
                    appendReportingProfile(xml, paxInput, i);
                    if (last) xml.append(T_REPORTING_PROFILE_END);
                    break;
                case "03":
                    appendMultiCaseOfValues(xml, paxInput, i);
                    if (last) xml.append(TI_MULTI_CASE_OF_VALUES_END);
                    break;
                case "04":
                    if (i == 0) xml.append(paxInput.getShares());
                    break;
                case "05":
                    if (i == 0) xml.append(TID_POISSON_ROLE).append(paxInput.getShares()).append(TID_POISSON_USE_RESTR);
                    break;
                default:
                    xml.append(step.getVal());
                    break;
            }
        }

        return xml.toString();
    }

    private static void appendConstantShareRows(StringBuilder sb, CastProPertySetDtlDto paxInput, int i) {
        if (i == 0) sb.append(T_CONSTANT_SHARE_ROWS_START).append(T_CONSTANT_SHARE_ROWS_ROLE);

        String value1 = paxInput.getValue1();
        sb.append(T_CONSTANT_SHARE_ROW);
        sb.append(T_CONSTANT_SHARE_ROW_ROLE).append(paxInput.getRole()).append(")");
        sb.append(FNC_QUOT_TWO);
        sb.append(SHARES).append(paxInput.getShares());
        sb.append(FNC_QUOT_TWO);
        if ("True".equals(value1) || "False".equals(value1)) {
            sb.append(VALUE).append(value1);
        } else {
            sb.append(VALUE).append(paxInput.getVlType()).append("] ").append(value1.isEmpty() ? "0" : value1);
        }
        sb.append(FNC_QUOT_TWO);
        sb.append(FNC_QT);
        sb.append(FNC_LR);
    }

    private static void appendReportingProfile(StringBuilder sb, CastProPertySetDtlDto paxInput, int i) {
        if (i == 0) {
            sb.append(T_REPORTING_PROFILE_START)
              .append(FNC_ROLE)
              .append(T_REPORTING_PROFILE_MODE)
              .append(FNC_QUOT_TWO)
              .append(NAME)
              .append(FNC_QUOT_TWO)
              .append(SOURCE_DATA_COUNT)
              .append(FNC_QUOT_TWO)
              .append("&gt;&#13;&#10;");
        }
        String sPercentage = String.valueOf(Double.parseDouble(paxInput.getShares()) / 100);
        String startTime = paxInput.getValue2();
        sb.append(T_REPORTING_PROFILE_ENTRY);
        sb.append(T_CONSTANT_SHARE_ROW_ROLE).append(paxInput.getRole()).append(")");
        sb.append(FNC_QUOT_TWO);
        sb.append(CHOSEN_TIME);
        sb.append(FNC_QUOT_TWO);
        sb.append(PERCENTAGE).append(StringUtils.removeTrailingZeros(sPercentage));
        sb.append(FNC_QUOT_TWO);
        sb.append(START_TIME_DURATION).append(startTime.substring(0, 2));
        sb.append(":").append(startTime.substring(2, 4)).append(":").append(startTime.substring(4, 6));
        sb.append(".000");
        sb.append(FNC_QUOT_TWO);
        sb.append(FNC_QT);
        sb.append(FNC_LR);
    }

    private static void appendMultiCaseOfValues(StringBuilder sb, CastProPertySetDtlDto paxInput, int i) {
        if (i == 0) sb.append(TI_MULTI_CASE_OF_VALUES_START).append(T_CONSTANT_SHARE_ROWS_ROLE);
        String[] splitVal = paxInput.getShares().split(",");
        for (int bb = 0; bb < splitVal.length; bb++) {
            String splitNum = bb < 10 ? "0" + bb : Integer.toString(bb);
            sb.append(TI_MULTI_CASE_OF_VALUE);
            sb.append(TI_MULTI_CASE_OF_VALUE_ROLE).append(splitNum).append(")");
            sb.append(FNC_QUOT_TWO);
            sb.append(OPERATOR_ENUM);
            sb.append(FNC_QUOT_TWO);
            sb.append(TI_MULTI_CASE_OF_VALUE_VALUE).append(splitVal[bb].replace(" ", ""));
            sb.append(FNC_QUOT_TWO);
            sb.append(FNC_QT);
            sb.append(FNC_LR);
        }
    }
}

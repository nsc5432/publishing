package aoms.pm.castrest.service.impl;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiConsumer;
import java.util.function.Function;

import javax.servlet.http.HttpServletRequest;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.text.StringEscapeUtils;
import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.egovframe.rte.fdl.string.EgovDateUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import aoms.framework.cmmn.config.CoreYamlRead;
import aoms.framework.cmmn.service.SessionService;
import aoms.framework.cmmn.util.FileUtil;
import aoms.pm.castrest.mapper.CastRestMapper;
import aoms.pm.castrest.service.CastRestService;
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
import aoms.pm.cmmn.dto.CastProPertySetDtlDto;
import aoms.pm.cmmn.dto.CastPropertySetDto;
import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.cmmn.dto.CastReqGetResourceInformationDto;
import aoms.pm.cmmn.dto.CastResReqDto;
import aoms.pm.cmmn.dto.CastResourceInformationDto;
import aoms.pm.cmmn.dto.CastRptStngHrGroupCntrlDto;
import aoms.pm.cmmn.dto.CastRsltFcltCdDto;
import aoms.pm.cmmn.dto.CastRsltRunDto;
import aoms.pm.cmmn.dto.CastSelfCheckInCountAndBagDropDto;
import aoms.pm.cmmn.dto.CastWhatIfCntrlDto;
import aoms.pm.cmmn.dto.PmAtchFileDto;
import aoms.pm.cmmn.dto.SimRsltDto;
import aoms.pm.cmmn.dto.SimRunStatDto;
import aoms.pm.cmmn.dto.SmltMdlDto;
import aoms.pm.cmmn.dto.SmltRsltDtlDto;
import aoms.pm.utils.SessionUtils;
import aoms.pm.utils.StringUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname   : CastRestServiceImpl.java
 * @Description : PM_여객출현정보 관리 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2025. 09. 12 / 이순영 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service("castRestService")
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastRestServiceImpl extends EgovAbstractServiceImpl implements CastRestService {
    private static final String CAST_MODEL = "CASTModel";
    private static final String CAST_EXPRESS_MODEL = "CASTExpressModel";
    private static final String FLIGHT_SCHEDULE = "FlightSchedule";
    private static final String COUNTER_ALLOCATION = "CounterAllocation";
    private static final String CHECK_IN_TYPE = "CheckinType";
    private static final String CHECK_IN_COUNTER_SERVICE_TIME = "CheckinCounterServiceTime";
    private static final String GENERIC_TABLE = "GenericTable";
    private static final String PROPERTY_SET = "PropertySet"; 
    private static final String RESOURCE_TYPE = "ResourceType";
    private static final String RESOURCE_ID = "ResourceID";
    private static final String AUTHOR = "Author";
    private static final String CREATED = "Created";
    private static final String LAST_SAVE_BY = "LastSavedBy";
    private static final String LAST_SAVED_USING_VERSION = "LastSavedUsingVersion";
    private static final String DESCRIPTION = "Description";
    private static final String LAST_MODIFIED = "LastModified";
    private static final String PARAMETER = "Parameter";
    private static final String DOM_STATUS = "DomStatus";
    private static final String FLIGHT_DIRECTION = "FlightDirection";
    private static final String DEP_ARR_TERMINAL = "DepArrTerminal";
    private static final String AIRLINE_CODE = "AirlineCode";
    private static final String OPERATOR_CAT = "OperatorCat";
    private static final String FLIGHT_NUMBER = "FlightNumber";
    private static final String FLIGHT_NUMBER_ID = "FlightNumberID";
    private static final String SCHEDULE_TIME = "ScheduleTime";
    private static final String ESTIMATED_TIME = "EstimatedTime";
    private static final String ACTUAL_TIME = "ActualTime";
    private static final String AIRPORT_CODE = "AirportCode";
    private static final String STAND_NUMBER = "StandNumber";
    private static final String GATE = "Gate";
    private static final String CONTACT_REMOTE = "ContactRemote";
    private static final String SEATS = "Seats";
    private static final String PAX_COUNT = "PaxCount";
    private static final String TRANSFER_PAX = "TransferPax";
    private static final String BELT = "Belt";
    private static final String AIRCRAFT_TYPE = "AircraftType";
    private static final String CHECK_IN_RANGE = "CheckInRange";
    private static final String FLIGHT_TYPE = "FlightType";
    private static final String SBD_AVAILABLE = "SBDAvailable";
    private static final String TRIANGLE = "Triangle";
    private static final String BUS = "Bus";
    private static final String ARRIVAL_GATE = "ArrivalGate";
    private static final String BAGGAGET1 = "BaggageT1";
    private static final String BAGGAGET2 = "BaggageT2";   
    private static final String BLOCKID = "BLOCKID";
    private static final String DEPARRTERMINAL = "DEPARRTERMINAL"; 
    private static final String RESOURCEID = "RESOURCEID";
    private static final String AIRLINECODE = "AIRLINECODE";
    private static final String DOMSTATUS = "DOMSTATUS";
    private static final String T1 = "T1";
    private static final String T2 = "T2";
    private static final String TRAVELCLASS = "TRAVELCLASS";
    private static final String GROUPSTATUS = "GROUPSTATUS";
    private static final String CHECKINTYPE = "CHECKINTYPE";
    private static final String NONFUNCTIONALSTATUS = "NONFUNCTIONALSTATUS";
    private static final String CHECKINALLOCTYPE = "CHECKINALLOCTYPE";
    private static final String CHECKINALLOCDESCRYPTION = "CHECKINALLOCDESCRYPTION";
    private static final String RESOURCE = "Resource";
	private static final String INTERVAL = "Interval";
	private static final String RUN = "Run";
	private static final String ID = "id";
	private static final String LIST = "list";
	private static final String REST = "REST";
    private static final String BLOCK_RESOURCE_ID = "BlockResourceID";
    private static final String SELF_ID = "SelfID";
    private static final String PARENT_ID = "ParentID";
    private static final String CHECK_IN_TYPE_RESOURCE_ID = "CheckinTypeResourceID";
    private static final String CHECK_IN_COUNTER_SERVICE_TIME_RESOURCE_ID = "CheckInCounterServiceTimeResourceID";
    private static final String FACILITY_OPENING_TABLE_DEPARTURE_GATE_RESOURCE_ID = "FacilityOpeningTable_DepartureGateResourceID";
    private static final String FACILITY_OPENING_TABLE_EMIGRATION_RESOURCE_ID = "FacilityOpeningTable_EmigrationResourceID";
    private static final String FACILITY_OPENING_TABLE_IMMIGRATION_RESOURCE_ID = "FacilityOpeningTable_ImmigrationResourceID";
    private static final String FACILITY_OPENING_TABLE_SECURITY_CONTROL_RESOURCE_ID = "FacilityOpeningTable_SecurityControlResourceID";
    private static final String FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL_RESOURCE_ID = "FacilityOpeningTable_TransferSecurityControlResourceID";
    private static final String SBD_COUNTER_ALLOCATION_RESOURCE_ID = "SBDCounterAllocationResourceID";
    private static final String FLIGHT_SCHEDULE_RESOURCE_ID = "FlightScheduleResourceID";
    private static final String BELT_ALLOCATION_RESOURCE_ID = "BeltAllocationResourceID";
    private static final String CHECK_IN_ALLOCATION_RESOURCE_ID = "CheckInAllocationResourceID";
    private static final String PROPERTY_SET_RESOURCE_ID = "PropertySetResourceID";
    private static final String MODEL_RESOURCE_ID = "ModelResourceID";
    private static final String RUN_ID = "RunID";
    private static final String START_TIME = "StartTime";
    private static final String END_TIME = "EndTime";
    private static final String STOP_TIME = "StopTime";
    private static final String SIMULATION_START_TIME = "SimulationStartTime";
    private static final String SIMULATION_STOP_TIME = "SimulationStopTime";
    private static final String TRANSACTION_TIME_MIN = "TransactionTime_Min";
    private static final String TRANSACTION_TIME_MAX = "TransactionTime_Max";
    private static final String TRANSACTION_TIME_AVG = "TransactionTime_Avg";
    private static final String WAITING_TIME_MIN = "WaitingTime_Min";
    private static final String WAITING_TIME_MAX = "WaitingTime_Max";
    private static final String WAITING_TIME_AVG = "WaitingTime_Avg";
    private static final String FINISHED_CLIENTS_ABS = "FinishedClients_Abs";
    private static final String WAITING_CLIENTS_MIN = "WaitingClients_Min";
    private static final String WAITING_CLIENTS_MAX = "WaitingClients_Max";
    private static final String WAITING_CLIENTS_AVG = "WaitingClients_Avg";
    private static final String QUEUE_LENGTH_CURRENT = "QueueLength_Current";
    private static final String STRING = "String";
    private static final String TERMINAL = "terminal";
    private static final String SCHEDULEDHOUR = "scheduledHour";
    private static final String GROUPNAME = "GroupName";
    private static final String LOCATION = "location";
    private static final String START_DATE = "startDate";
    private static final String END_DATE = "endDate";
    private static final String SIDE_DOOR = "sideDoor";
    private static final String FACIAL_RECOGNITION = "facialRecognition";
    private static final String CURRENT_NUMBER_OF_LANES = "currentNumberofLanes";
    private static final String IMMIGRATION_TYPE = "immigrationType";
    private static final String PASSPORT = "passport";
    private static final String AIRLINE = "airline";
    private static final String SERVICE_TIME = "serviceTime";
    private static final String COUNTER_SHARE = "counterShare";
    private static final String COUNTER_VALUE = "counterValue";
    private static final String KIOSK_SHARE = "kioskShare";
    private static final String KIOSK_VALUE = "kioskValue";
    private static final String MOBILE_SHARE = "mobileShare";
    private static final String MOBILE_VALUE = "mobileValue";
    private static final String S_P_NAME = "PName";
    private static final String S_VALUES = "values";
    private static final String MODEL = "Model";
    private static final String P_ENUM_TYPE = " PEnumType=";
    private static final String P_FRIENDLY_NAME = " PFriendlyName=";
    private static final String P_KIND = " PKind=";
    private static final String PROPERTY_NAME = "Property Name";
    private static final String PROPERTY_P_NAME = " PName=";
    private static final String PROPERTY_VALUES = " values=";    
	private static final String TN_PM_SMLT_STNG = "TN_PM_SMLT_STNG";
    private static final String FACILITY_OPENING_TABLE_DEPARTURE_GATE = "FacilityOpeningTable_DepartureGate";
    private static final String FACILITY_OPENING_TABLE_EMIGRATION = "FacilityOpeningTable_Emigration";
    private static final String FACILITY_OPENING_TABLE_IMMIGRATION = "FacilityOpeningTable_Immigration";
    private static final String FACILITY_OPENING_TABLE_SECURITY_CONTROL = "FacilityOpeningTable_SecurityControl";
    private static final String FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL = "FacilityOpeningTable_TransferSecurityControl";
    private static final String REPORTING_PROFILES_TIME_GROUPS = "ReportingProfilesTimeGroups";
    private static final String M_COL = "m:col";
    private static final String RESOURCE_DESCRIPTION = "m:ResourceDescription"; 
    private static final String RESOURCE_TYPES = "m:ResourceTypes";
    private static final String RESOURCE_INFO = "m:ResourceInfo";
    private static final String RESOURCE_ERROR = "<error>Unsupported Resource Type</error>";
    private static final String INVALID_REQUEST = "Invalid Request: No resource information found.";
    private static final String XML_VERSION = "<?xml version=\"1.0\"?>";
    private static final String SOAP_ENVELOPE_START = "<soap:Envelope xmlns:soap=\"http://www.w3.org/2001/12/soap-envelope\" soap:encodingStyle=\"http://www.w3.org/2001/12/soap-encoding\">";
    private static final String SOAP_ENVELOPE_END = "</soap:Envelope>";
    private static final String SOAP_BODY_START = "<soap:Body>";
    private static final String SOAP_BODY_END = "</soap:Body>";
    private static final String RESOURCE_INFOS_START = "<m:ResourceInfos>";
    private static final String RESOURCE_INFOS_END = "</m:ResourceInfos>";
    private static final String INVOCATION_RESULT = "<m:InvocationResult Result=\"";
    private static final String INVOCATION_RESULT_MESSAGE = "\" Message=\"";
    private static final String RES_GET_RESOURCE_INFORMATION_START = "<m:RES_GetResourceInformation xmlns:m=\"RES_GetResourceInformation.xsd\" User=\"Olaf\" Auth=\"abcxxx\">";
    private static final String RES_GET_RESOURCE_INFORMATION_END = "</m:RES_GetResourceInformation>";
    private static final String TAB_ONE = "\t";
    private static final String TAB_TWO = "\t\t";
    private static final String TAB_THREE = "\t\t\t";
    private static final String TAB_FOUR = "\t\t\t\t";
    private static final String TAB_FIVE = "\t\t\t\t\t";
    private static final String M_TABLE_REQ_START = "<m:table allowDefaultValue=\"";
    private static final String M_TABLE_START = "<m:table friendlyname=\"";
    private static final String M_TABLE_END = "</m:table>"; 
    private static final String M_COL_START = "<m:col";
    private static final String P_KIND_STRING = "PKind=\"String\"";
    private static final String P_KIND_INTEGER = "PKind=\"Integer\"";
    private static final String P_KIND_FLOAT = "PKind=\"Float\"";
    private static final String P_KIND_DURATION = "PKind=\"Duration\"";
    private static final String P_KIND_DATE_TIME = "PKind=\"Date/Time\"";
    private static final String XML_ID = "\" id=\"";
    private static final String RES_SET_RESURCE_START = "<m:RES_SetResource xmlns:m=\"RES_SetResource.xsd\">";
    private static final String RES_SET_RESURCE_END = "</m:RES_SetResource>";
    private static final String RES_DELETE_RESOURCE_START = "<m:RES_DeleteResource xmlns:m=\"RES_DeleteResource.xsd\">";
    private static final String RES_DELETE_RESOURCE_END = "</m:RES_DeleteResource>";
    private static final String DISALLOW_DOCTYPE_DECL = "http://apache.org/xml/features/disallow-doctype-decl";
    private static final String EXTERNAL_GENERAL_ENTITIES = "http://xml.org/sax/features/external-general-entities";
    private static final String EXTERNAL_PARAMETER_ENTITIES = "http://xml.org/sax/features/external-parameter-entities";
    private static final String RESOURCE_CONTENT_START = "<m:ResourceContent>";
    private static final String RESOURCE_CONTENT_END = "</m:ResourceContent>";
    private static final String TID_TRIANGLE = "&quot;&lt;TIDTriangle";
    private static final String TID_RANDOMIZED = "&quot;&lt;TIDRandomized";
    private static final String TID_RANDOMIZED_INTEGER = "&quot;&lt;TIDRandomizedInteger";
    private static final String TID_GAMMA = "&quot;&lt;TIDGamma";
    private static final String TID_CONTANT = "&quot;&lt;TIDConstant";
    private static final String TID_GAUSSIAN = "&quot;&lt;TIDGaussian";
    private static final String TID_EXPONENTIAL = "&quot;&lt;TIDExponential";
    private static final String TID_ERLANG = "&quot;&lt;TIDErlang";
    private static final String TID_WEIBULL = "&quot;&lt;TIDWeibull";
    private static final String TID_POLYGONAL = "&quot;&lt;TIDPolygonal";
    private static final String TID_POISSON = "&quot;&lt;TIDPoisson";
    private static final String TID_NEGATIVE_BINOMIAL = "&quot;&lt;TIDNegativeBinomial";
    private static final String FNC_ROLE = " role=&quot;&quot;Self&quot;&quot;";
    private static final String FNC_ANNOTATION = " Annotation=&quot;&quot;[String] &quot;&quot;";
    private static final String FNC_CATEGORY = " Category=&quot;&quot;[String] Transaction Time[s]&quot;&quot;";
    private static final String FNC_DESCRIPTION = " Description=&quot;&quot;[String] &quot;&quot;";
    private static final String FNC_DISTRIBUTION_UNIT = " DistributionUnit=&quot;&quot;[String] s&quot;&quot;";
    private static final String FNC_DYNAMIC_PARAMS = " DynamicParams=&quot;&quot;[Boolean] False&quot;&quot;";
    private static final String FNC_ERROR_HANDLEING_MODE = " ErrorHandlingMode=&quot;&quot;[Enumeration:TErrorHandlingMode] 1&quot;&quot;";
    private static final String FNC_ERROR_RETURN_VALUE_FLOAT = " ErrorReturnValue=&quot;&quot;[Float] 0&quot;&quot;";
    private static final String FNC_ERROR_RETURN_VALUE_INTEGER = " ErrorReturnValue=&quot;&quot;[Integer] 0&quot;&quot;";
    private static final String FNC_ERROR_RETURN_VALUE_UNASSIGNED = " ErrorReturnValue=&quot;&quot;[Unassigned] &quot;&quot;";
    private static final String FNC_EXPANDED = " Expanded=&quot;&quot;[Boolean] True&quot;&quot;";
    private static final String FNC_USE_RESTR = " UseRestr=&quot;&quot;[Boolean] False&quot;&quot;";
    private static final String FNC_A = " a=&quot;&quot;[Float] ";
    private static final String FNC_B = " b=&quot;&quot;[Float] ";
    private static final String FNC_C = " c=&quot;&quot;[Float] ";
    private static final String FNC_MAX = " Max=&quot;&quot;[Float] ";
    private static final String FNC_MIN = " Min=&quot;&quot;[Float] ";
    private static final String FNC_MAX_INTEGER = " Max=&quot;&quot;[Integer] ";
    private static final String FNC_MIN_INTEGER = " Min=&quot;&quot;[Integer] ";
    private static final String FNC_VALUE = " Value=&quot;&quot;[Float] ";
    private static final String FNC_MEAN = " Mean=&quot;&quot;[Float] ";
    private static final String FNC_STD_DEV = " StdDev=&quot;&quot;[Float] ";
    private static final String FNC_OFFSET = " Offset=&quot;&quot;[Float] ";
    private static final String FNC_DEGFREEDOM = " degfreedom=&quot;&quot;[Integer] ";
    private static final String FNC_LAMBDA = " lambda=&quot;&quot;[Float] ";
    private static final String FNC_SCALE = " Scale=&quot;&quot;[Float] ";
    private static final String FNC_SHAPE = " Shape=&quot;&quot;[Float] ";
    private static final String FNC_INTERVAL_DATA = " IntervalData=&quot;&quot;[String] ";
    private static final String FNC_QUOT_TWO = "&quot;&quot;";
    private static final String FNC_QUOT_ONE = "&quot;";
    private static final String FNC_S_QUOT_ONE = "\"";
    private static final String FNC_QT = "/&gt;";
    private static final String FNC_LR = "&#13;&#10;";
    private static final String T_CONSTANT_SHARE_ROWS_START = "&quot;&lt;TConstantShareRows";
    private static final String T_CONSTANT_SHARE_ROWS_END = "&lt;/TConstantShareRows&gt;&#13;&#10;&quot;";
    private static final String T_CONSTANT_SHARE_ROWS_ROLE = " role=&quot;&quot;Self&quot;&quot;&gt;&#13;&#10;";
    private static final String T_CONSTANT_SHARE_ROW = "&lt;TConstantShareRow";
    private static final String T_CONSTANT_SHARE_ROW_ROLE = " role=&quot;&quot;(";
    private static final String T_REPORTING_PROFILE_START = "&quot;&lt;TReportingProfile";
    private static final String T_REPORTING_PROFILE_END = "&lt;/TReportingProfile&gt;&#13;&#10;&quot;";
    private static final String T_REPORTING_PROFILE_MODE = " Mode=&quot;&quot;[Enumeration:TReportingProfileMode] 0";
    private static final String TI_MULTI_CASE_OF_VALUES_START = "&quot;&lt;TIMultiCaseOfValues";
    private static final String TI_MULTI_CASE_OF_VALUES_END = "&lt;/TIMultiCaseOfValues&gt;&#13;&#10;&quot;";
    private static final String TI_MULTI_CASE_OF_VALUE = "&lt;TIMultiCaseOfValue";
    private static final String TI_MULTI_CASE_OF_VALUE_ROLE = " role=&quot;&quot;(Child";
    private static final String OPERATOR_ENUM = " OperatorEnum=&quot;&quot;[Enumeration:TBoolOperator] 0";
    private static final String TI_MULTI_CASE_OF_VALUE_VALUE = " Value=&quot;&quot;[String] ";
    private static final String TID_POISSON_ROLE = "&lt;TIDPoisson role=&quot;Self&quot; Category=&quot;[String] Transaction Time[s]&quot; Mean=&quot;[Float] ";
    private static final String TID_POISSON_USE_RESTR = "&quot; UseRestr=&quot;[Boolean] False&quot;/&gt;";
    private static final String SHARES = " Shares=&quot;&quot;[Float] ";
    private static final String VALUE = " Value=&quot;&quot;[";
    private static final String NAME = " Name=&quot;&quot;[String] ";
    private static final String SOURCE_DATA_COUNT = " SourceDataCount=&quot;&quot;[Integer] -1";
    private static final String T_REPORTING_PROFILE_ENTRY = "&lt;TReportingProfileEntry";
    private static final String CHOSEN_TIME = " ChosenTime=&quot;&quot;[Duration] 0100-01-01T00:00:00.000";
    private static final String PERCENTAGE = " Percentage=&quot;&quot;[Float] ";
    private static final String START_TIME_DURATION = " StartTime=&quot;&quot;[Duration] 1899-12-30T-";
    private static final String RES_GET_RESOURCE_START = "<m:RES_GetResource xmlns:m=\"RES_GetResource.xsd\">";
    private static final String RES_GET_RESOURCE_END = "</m:RES_GetResource>";
    private static final String FRIENDLYNAME = "\" friendlyname=\"";
    private static final String MESSAGE_OK = "This is Ok";
    private static final String MESSAGE_NOT_OK = "This is not OK";
    private static final String FALSE = "false";
    private static final String TRUE = "true";
    private static final String DEFAULT_AUTHOR = "SYSTEM";
    private static final String WHAT_IF_DEFINITION_TABLE = "WhatIfDefinitionTable";
    private static final String SIMULATION_RESULT_SUFFIX = "SimulationResultSuffix";
    private static final String STATUS = "Status";
    private static final String WHAT_IF_RUN_ID = "WhatIfRunID";
    
    private final CastRestMapper castRestMapper;
    private final SessionService sessionService;
    
    private static class FsFieldInfo {
    	private final String pKind;
    	private final Function<CastFlightScheduleDto, Object> extractor;
    	
    	FsFieldInfo(String pKind, Function<CastFlightScheduleDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
    
	private static final Map<String, FsFieldInfo> FS_FIELD_MAP = new LinkedHashMap<>();
	static {
		FS_FIELD_MAP.put(DOM_STATUS, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getDomStatus));
		FS_FIELD_MAP.put(FLIGHT_DIRECTION, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getFlightDirection));
		FS_FIELD_MAP.put(DEP_ARR_TERMINAL, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getDepArrTerminal));
		FS_FIELD_MAP.put(AIRLINE_CODE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getAirlineCode));
		FS_FIELD_MAP.put(OPERATOR_CAT, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getOperatorCat));
		FS_FIELD_MAP.put(FLIGHT_NUMBER, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getFlightNumber));
		FS_FIELD_MAP.put(FLIGHT_NUMBER_ID, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getFlightNumberID));
		FS_FIELD_MAP.put(SCHEDULE_TIME, new FsFieldInfo(P_KIND_DATE_TIME, CastFlightScheduleDto::getScheduleTime));
		FS_FIELD_MAP.put(ESTIMATED_TIME, new FsFieldInfo(P_KIND_DATE_TIME, CastFlightScheduleDto::getEstimatedTime));
		FS_FIELD_MAP.put(ACTUAL_TIME, new FsFieldInfo(P_KIND_DATE_TIME, CastFlightScheduleDto::getActualTime));
		FS_FIELD_MAP.put(AIRPORT_CODE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getAirportCode));
		FS_FIELD_MAP.put(STAND_NUMBER, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getStandNumber));
		FS_FIELD_MAP.put(GATE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getGate));
		FS_FIELD_MAP.put(CONTACT_REMOTE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getContactRemote));
		FS_FIELD_MAP.put(SEATS, new FsFieldInfo(P_KIND_INTEGER, CastFlightScheduleDto::getSeats));
		FS_FIELD_MAP.put(PAX_COUNT, new FsFieldInfo(P_KIND_INTEGER, CastFlightScheduleDto::getPaxCount));
		FS_FIELD_MAP.put(TRANSFER_PAX, new FsFieldInfo(P_KIND_INTEGER, CastFlightScheduleDto::getTransferPax));
		FS_FIELD_MAP.put(BELT, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getBelt));
		FS_FIELD_MAP.put(AIRCRAFT_TYPE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getAircraftType));
		FS_FIELD_MAP.put(CHECK_IN_RANGE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getCheckInRange));
		FS_FIELD_MAP.put(FLIGHT_TYPE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getFlightType));
		FS_FIELD_MAP.put(SBD_AVAILABLE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getSbdAvailable));
		FS_FIELD_MAP.put(TRIANGLE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getTriangle));
		FS_FIELD_MAP.put(BUS, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getBus));
		FS_FIELD_MAP.put(ARRIVAL_GATE, new FsFieldInfo(P_KIND_STRING, CastFlightScheduleDto::getArrivalGate));
		FS_FIELD_MAP.put(BAGGAGET1, new FsFieldInfo(P_KIND_DATE_TIME, CastFlightScheduleDto::getBaggageT1));
		FS_FIELD_MAP.put(BAGGAGET2, new FsFieldInfo(P_KIND_DATE_TIME, CastFlightScheduleDto::getBaggageT2));
	}
    
    private static class CaFieldInfo {
    	private final String pKind;
    	private final Function<CastCounterAllocationDto, Object> extractor;
    	
    	CaFieldInfo(String pKind, Function<CastCounterAllocationDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
    
	private static final Map<String, CaFieldInfo> CA_FIELD_MAP = new LinkedHashMap<>();
	static {
		CA_FIELD_MAP.put(BLOCKID, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getBlockID));
		CA_FIELD_MAP.put(DEPARRTERMINAL, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getDepArrTerminal));
		CA_FIELD_MAP.put(RESOURCEID, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getResourceID));
		CA_FIELD_MAP.put(AIRLINECODE, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getAirlineCode));
		CA_FIELD_MAP.put(DOMSTATUS, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getDomStatus));
		CA_FIELD_MAP.put(T1, new CaFieldInfo(P_KIND_DATE_TIME, CastCounterAllocationDto::getT1));
		CA_FIELD_MAP.put(T2, new CaFieldInfo(P_KIND_DATE_TIME, CastCounterAllocationDto::getT2));
		CA_FIELD_MAP.put(TRAVELCLASS, new CaFieldInfo(P_KIND_DATE_TIME, CastCounterAllocationDto::getTravelClass));
		CA_FIELD_MAP.put(GROUPSTATUS, new CaFieldInfo(P_KIND_DATE_TIME, CastCounterAllocationDto::getGroupStatus));
		CA_FIELD_MAP.put(CHECKINTYPE, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getCheckinType));
		CA_FIELD_MAP.put(NONFUNCTIONALSTATUS, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getNonFunctionalStatus));
		CA_FIELD_MAP.put(CHECKINALLOCTYPE, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getCheckinAllocType));
		CA_FIELD_MAP.put(CHECKINALLOCDESCRYPTION, new CaFieldInfo(P_KIND_STRING, CastCounterAllocationDto::getCheckInAllocDescryption));
	}
    
    private static class SbdFieldInfo {
    	private final String pKind;
    	private final Function<CastSelfCheckInCountAndBagDropDto, Object> extractor;
    	
    	SbdFieldInfo(String pKind, Function<CastSelfCheckInCountAndBagDropDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
    
	private static final Map<String, SbdFieldInfo> SBD_FIELD_MAP = new LinkedHashMap<>();
	static {
		SBD_FIELD_MAP.put(BLOCKID, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getBlockID));
		SBD_FIELD_MAP.put(DEPARRTERMINAL, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getDepArrTerminal));
		SBD_FIELD_MAP.put(RESOURCEID, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getResourceID));
		SBD_FIELD_MAP.put(AIRLINECODE, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getAirlineCode));
		SBD_FIELD_MAP.put(DOMSTATUS, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getDomStatus));
		SBD_FIELD_MAP.put(T1, new SbdFieldInfo(P_KIND_DATE_TIME, CastSelfCheckInCountAndBagDropDto::getT1));
		SBD_FIELD_MAP.put(T2, new SbdFieldInfo(P_KIND_DATE_TIME, CastSelfCheckInCountAndBagDropDto::getT2));
		SBD_FIELD_MAP.put(TRAVELCLASS, new SbdFieldInfo(P_KIND_DATE_TIME, CastSelfCheckInCountAndBagDropDto::getTravelClass));
		SBD_FIELD_MAP.put(GROUPSTATUS, new SbdFieldInfo(P_KIND_DATE_TIME, CastSelfCheckInCountAndBagDropDto::getGroupStatus));
		SBD_FIELD_MAP.put(CHECKINTYPE, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getCheckinType));
		SBD_FIELD_MAP.put(NONFUNCTIONALSTATUS, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getNonFunctionalStatus));
		SBD_FIELD_MAP.put(CHECKINALLOCTYPE, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getCheckinAllocType));
		SBD_FIELD_MAP.put(CHECKINALLOCDESCRYPTION, new SbdFieldInfo(P_KIND_STRING, CastSelfCheckInCountAndBagDropDto::getCheckInAllocDescryption));
	}
    
    private static class StFieldInfo {
    	private final String pKind;
    	private final Function<CastCheckInCounterServiceTimeDto, Object> extractor;
    	
    	StFieldInfo(String pKind, Function<CastCheckInCounterServiceTimeDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }

	private static final Map<String, StFieldInfo> ST_FIELD_MAP = new LinkedHashMap<>();
	static {
		ST_FIELD_MAP.put(AIRLINE, new StFieldInfo(P_KIND_STRING, CastCheckInCounterServiceTimeDto::getAirline));
		ST_FIELD_MAP.put(SERVICE_TIME, new StFieldInfo(P_KIND_FLOAT, CastCheckInCounterServiceTimeDto::getServiceTime));
	}
    
    private static class CtFieldInfo {
    	private final String pKind;
    	private final Function<CastCheckinTypeDto, Object> extractor;
    	
    	CtFieldInfo(String pKind, Function<CastCheckinTypeDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }    
    
	private static final Map<String, CtFieldInfo> CT_FIELD_MAP = new LinkedHashMap<>();
	static {
		CT_FIELD_MAP.put(AIRLINE_CODE, new CtFieldInfo(P_KIND_STRING, CastCheckinTypeDto::getAirlineCode));
		CT_FIELD_MAP.put(COUNTER_SHARE, new CtFieldInfo(P_KIND_FLOAT, CastCheckinTypeDto::getCounterShare));
		CT_FIELD_MAP.put(COUNTER_VALUE, new CtFieldInfo(P_KIND_STRING, CastCheckinTypeDto::getCounterValue));
		CT_FIELD_MAP.put(KIOSK_SHARE, new CtFieldInfo(P_KIND_FLOAT, CastCheckinTypeDto::getKioskShare));
		CT_FIELD_MAP.put(KIOSK_VALUE, new CtFieldInfo(P_KIND_STRING, CastCheckinTypeDto::getKioskValue));
		CT_FIELD_MAP.put(MOBILE_SHARE, new CtFieldInfo(P_KIND_FLOAT, CastCheckinTypeDto::getMobileShare));
		CT_FIELD_MAP.put(MOBILE_VALUE, new CtFieldInfo(P_KIND_STRING, CastCheckinTypeDto::getMobileValue));
	}
    
    private static class DgFieldInfo {
    	private final String pKind;
    	private final Function<CastFcltyOpngTblDptgDto, Object> extractor;
    	
    	DgFieldInfo(String pKind, Function<CastFcltyOpngTblDptgDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
    
	private static final Map<String, DgFieldInfo> DG_FIELD_MAP = new LinkedHashMap<>();
	static {
		DG_FIELD_MAP.put(TERMINAL, new DgFieldInfo(P_KIND_STRING, CastFcltyOpngTblDptgDto::getTerminal));
		DG_FIELD_MAP.put(LOCATION, new DgFieldInfo(P_KIND_STRING, CastFcltyOpngTblDptgDto::getLocation));
		DG_FIELD_MAP.put(START_DATE, new DgFieldInfo(P_KIND_DATE_TIME, CastFcltyOpngTblDptgDto::getStartDate));
		DG_FIELD_MAP.put(END_DATE, new DgFieldInfo(P_KIND_DATE_TIME, CastFcltyOpngTblDptgDto::getEndDate));
		DG_FIELD_MAP.put(START_TIME, new DgFieldInfo(P_KIND_DURATION, CastFcltyOpngTblDptgDto::getStartTime));
		DG_FIELD_MAP.put(END_TIME, new DgFieldInfo(P_KIND_DURATION, CastFcltyOpngTblDptgDto::getEndTime));
		DG_FIELD_MAP.put(SIDE_DOOR, new DgFieldInfo(P_KIND_STRING, CastFcltyOpngTblDptgDto::getSideDoor));
		DG_FIELD_MAP.put(FACIAL_RECOGNITION, new DgFieldInfo(P_KIND_STRING, CastFcltyOpngTblDptgDto::getFacialRecognition));
		DG_FIELD_MAP.put(CURRENT_NUMBER_OF_LANES, new DgFieldInfo(P_KIND_INTEGER, CastFcltyOpngTblDptgDto::getCurrentNumberofLanes));
	}
    
    private static class EmFieldInfo {
    	private final String pKind;
    	private final Function<CastFcltyOpngTblEmigDto, Object> extractor;
    	
    	EmFieldInfo(String pKind, Function<CastFcltyOpngTblEmigDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
    
	private static final Map<String, EmFieldInfo> EM_FIELD_MAP = new LinkedHashMap<>();
	static {
		EM_FIELD_MAP.put(TERMINAL, new EmFieldInfo(P_KIND_STRING, CastFcltyOpngTblEmigDto::getTerminal));
		EM_FIELD_MAP.put(LOCATION, new EmFieldInfo(P_KIND_STRING, CastFcltyOpngTblEmigDto::getLocation));
		EM_FIELD_MAP.put(IMMIGRATION_TYPE, new EmFieldInfo(P_KIND_STRING, CastFcltyOpngTblEmigDto::getImmigrationType));
		EM_FIELD_MAP.put(CURRENT_NUMBER_OF_LANES, new EmFieldInfo(P_KIND_INTEGER, CastFcltyOpngTblEmigDto::getCurrentNumberofLanes));
	}
    
    private static class ScFieldInfo {
    	private final String pKind;
    	private final Function<CastFcltyOpngTblScrtyCntrlDto, Object> extractor;
    	
    	ScFieldInfo(String pKind, Function<CastFcltyOpngTblScrtyCntrlDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }

	private static final Map<String, ScFieldInfo> SC_FIELD_MAP = new LinkedHashMap<>();
	static {
		SC_FIELD_MAP.put(TERMINAL, new ScFieldInfo(P_KIND_STRING, CastFcltyOpngTblScrtyCntrlDto::getTerminal));
		SC_FIELD_MAP.put(LOCATION, new ScFieldInfo(P_KIND_STRING, CastFcltyOpngTblScrtyCntrlDto::getLocation));
		SC_FIELD_MAP.put(CURRENT_NUMBER_OF_LANES, new ScFieldInfo(P_KIND_INTEGER, CastFcltyOpngTblScrtyCntrlDto::getCurrentNumberofLanes));
	}
    
    private static class ImFieldInfo {
    	private final String pKind;
    	private final Function<CastFcltyOpngTblImmigDto, Object> extractor;
    	
    	ImFieldInfo(String pKind, Function<CastFcltyOpngTblImmigDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
  
	private static final Map<String, ImFieldInfo> IM_FIELD_MAP = new LinkedHashMap<>();
	static {
		IM_FIELD_MAP.put(TERMINAL, new ImFieldInfo(P_KIND_STRING, CastFcltyOpngTblImmigDto::getTerminal));
		IM_FIELD_MAP.put(LOCATION, new ImFieldInfo(P_KIND_STRING, CastFcltyOpngTblImmigDto::getLocation));
		IM_FIELD_MAP.put(START_DATE, new ImFieldInfo(P_KIND_DATE_TIME, CastFcltyOpngTblImmigDto::getStartDate));
		IM_FIELD_MAP.put(END_DATE, new ImFieldInfo(P_KIND_DATE_TIME, CastFcltyOpngTblImmigDto::getEndDate));
		IM_FIELD_MAP.put(START_TIME, new ImFieldInfo(P_KIND_DURATION, CastFcltyOpngTblImmigDto::getStartTime));
		IM_FIELD_MAP.put(END_TIME, new ImFieldInfo(P_KIND_DURATION, CastFcltyOpngTblImmigDto::getEndTime));
		IM_FIELD_MAP.put(PASSPORT, new ImFieldInfo(P_KIND_STRING, CastFcltyOpngTblImmigDto::getPassport));
		IM_FIELD_MAP.put(IMMIGRATION_TYPE, new ImFieldInfo(P_KIND_STRING, CastFcltyOpngTblImmigDto::getImmigrationType));
		IM_FIELD_MAP.put(CURRENT_NUMBER_OF_LANES, new ImFieldInfo(P_KIND_INTEGER, CastFcltyOpngTblImmigDto::getCurrentNumberofLanes));
	}
    
    private static class TsFieldInfo {
    	private final String pKind;
    	private final Function<CastFcltyOpngTblTrnstScrtyCntrlDto, Object> extractor;
    	
    	TsFieldInfo(String pKind, Function<CastFcltyOpngTblTrnstScrtyCntrlDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
    
	private static final Map<String, TsFieldInfo> TS_FIELD_MAP = new LinkedHashMap<>();
	static {
		TS_FIELD_MAP.put(TERMINAL, new TsFieldInfo(P_KIND_STRING, CastFcltyOpngTblTrnstScrtyCntrlDto::getTerminal));
		TS_FIELD_MAP.put(LOCATION, new TsFieldInfo(P_KIND_STRING, CastFcltyOpngTblTrnstScrtyCntrlDto::getLocation));
		TS_FIELD_MAP.put(START_DATE, new TsFieldInfo(P_KIND_DATE_TIME, CastFcltyOpngTblTrnstScrtyCntrlDto::getStartDate));
		TS_FIELD_MAP.put(END_DATE, new TsFieldInfo(P_KIND_DATE_TIME, CastFcltyOpngTblTrnstScrtyCntrlDto::getEndDate));
		TS_FIELD_MAP.put(START_TIME, new TsFieldInfo(P_KIND_DURATION, CastFcltyOpngTblTrnstScrtyCntrlDto::getStartTime));
		TS_FIELD_MAP.put(END_TIME, new TsFieldInfo(P_KIND_DURATION, CastFcltyOpngTblTrnstScrtyCntrlDto::getEndTime));
		TS_FIELD_MAP.put(CURRENT_NUMBER_OF_LANES, new TsFieldInfo(P_KIND_INTEGER, CastFcltyOpngTblTrnstScrtyCntrlDto::getCurrentNumberofLanes));
	}
	private static final Map<String, RsFieldInfo> RS_FIELD_MAP = new LinkedHashMap<>();
	static {
		RS_FIELD_MAP.put(SCHEDULEDHOUR, new RsFieldInfo(P_KIND_INTEGER, CastRptStngHrGroupCntrlDto::getScheduledHour));
		RS_FIELD_MAP.put(GROUPNAME, new RsFieldInfo(P_KIND_STRING, CastRptStngHrGroupCntrlDto::getGroupName));
	}
	private static class RsFieldInfo {
    	private final String pKind;
    	private final Function<CastRptStngHrGroupCntrlDto, Object> extractor;
    	
    	RsFieldInfo(String pKind, Function<CastRptStngHrGroupCntrlDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
	private static class WiFieldInfo {
    	private final String pKind;
    	private final Function<CastWhatIfCntrlDto, Object> extractor;
    	
    	WiFieldInfo(String pKind, Function<CastWhatIfCntrlDto, Object> extractor) {
    		this.pKind = pKind;
    		this.extractor = extractor;
    	}
    }
	
	private static final Map<String, WiFieldInfo> WI_FIELD_MAP = new LinkedHashMap<>();
	static {
		WI_FIELD_MAP.put("LastChange", new WiFieldInfo(P_KIND_DATE_TIME, CastWhatIfCntrlDto::getLastChange));
		WI_FIELD_MAP.put(WHAT_IF_RUN_ID, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getWhatIfRunId));
		WI_FIELD_MAP.put(MODEL, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getModel));
		WI_FIELD_MAP.put("FS", new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getFs));
		WI_FIELD_MAP.put("CA", new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getCa));
		WI_FIELD_MAP.put("SBD", new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getSbd));
		WI_FIELD_MAP.put("PS", new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getPs));
		WI_FIELD_MAP.put(FACILITY_OPENING_TABLE_DEPARTURE_GATE, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getFacilityOpeningTableDepartureGate));
		WI_FIELD_MAP.put(FACILITY_OPENING_TABLE_EMIGRATION, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getFacilityOpeningTableEmigration));
		WI_FIELD_MAP.put(FACILITY_OPENING_TABLE_IMMIGRATION, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getFacilityOpeningTableImmigration));
		WI_FIELD_MAP.put(FACILITY_OPENING_TABLE_SECURITY_CONTROL, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getFacilityOpeningTableSecurityControl));
		WI_FIELD_MAP.put(FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getFacilityOpeningTableTransferSecurityControl));
		WI_FIELD_MAP.put(CHECK_IN_COUNTER_SERVICE_TIME, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getCheckinCounterServiceTime));
		WI_FIELD_MAP.put(CHECK_IN_TYPE, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getCheckinType));
		WI_FIELD_MAP.put(REPORTING_PROFILES_TIME_GROUPS, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getRptStngId));
		WI_FIELD_MAP.put(SIMULATION_RESULT_SUFFIX, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getSimulationResultSuffix));
		WI_FIELD_MAP.put(STATUS, new WiFieldInfo(P_KIND_STRING, CastWhatIfCntrlDto::getStatus));
		
	}

	private static final Map<String, BiConsumer<CastResReqDto, String>> RESOURCE_INFO_MAP = new HashMap<>();
	static {
		RESOURCE_INFO_MAP.put(AUTHOR, CastResReqDto::setAuthor);
		RESOURCE_INFO_MAP.put(CREATED, CastResReqDto::setCreated);
		RESOURCE_INFO_MAP.put(DESCRIPTION, CastResReqDto::setDescription);
		RESOURCE_INFO_MAP.put(LAST_MODIFIED, CastResReqDto::setLastModified);
		RESOURCE_INFO_MAP.put(LAST_SAVE_BY, CastResReqDto::setLastSavedBy);
		RESOURCE_INFO_MAP.put(LAST_SAVED_USING_VERSION, CastResReqDto::setLastSavedUsingVersion);
		RESOURCE_INFO_MAP.put(RESOURCE_ID, CastResReqDto::setResourceID);
		RESOURCE_INFO_MAP.put(RESOURCE_TYPE, CastResReqDto::setResourceType);
	}
	
	private static final Map<String, BiConsumer<CastResReqDto, String>> RUN_MAP = new HashMap<>();
	static {
		RUN_MAP.put(SELF_ID, CastResReqDto::setSelfID);
		RUN_MAP.put(PARENT_ID, CastResReqDto::setParentID);
		RUN_MAP.put(BELT_ALLOCATION_RESOURCE_ID, CastResReqDto::setBagAllocationResourceID);
		RUN_MAP.put(FLIGHT_SCHEDULE_RESOURCE_ID, CastResReqDto::setFlightScheduleResourceID);
		RUN_MAP.put(CHECK_IN_ALLOCATION_RESOURCE_ID, CastResReqDto::setCheckInAllocationResourceID);
		RUN_MAP.put(PROPERTY_SET_RESOURCE_ID, CastResReqDto::setPropertySetResourceID);
		RUN_MAP.put(MODEL_RESOURCE_ID, CastResReqDto::setModelResourceID);
		RUN_MAP.put(RUN_ID, CastResReqDto::setRunID);
		RUN_MAP.put(START_TIME, CastResReqDto::setStartTime);
		RUN_MAP.put(STOP_TIME, CastResReqDto::setStopTime);
		RUN_MAP.put(SIMULATION_START_TIME, CastResReqDto::setSimulationStartTime);
		RUN_MAP.put(SIMULATION_STOP_TIME, CastResReqDto::setSimulationStopTime);
		RUN_MAP.put(CHECK_IN_TYPE_RESOURCE_ID, CastResReqDto::setCheckinTypeResourceID);
		RUN_MAP.put(CHECK_IN_COUNTER_SERVICE_TIME_RESOURCE_ID, CastResReqDto::setCheckinCounterServiceTimeResourceID);
		RUN_MAP.put(FACILITY_OPENING_TABLE_DEPARTURE_GATE_RESOURCE_ID, CastResReqDto::setFacilityOpeningTableDepartureGateResourceID);
		RUN_MAP.put(FACILITY_OPENING_TABLE_EMIGRATION_RESOURCE_ID, CastResReqDto::setFacilityOpeningTableEmigrationResourceID);
		RUN_MAP.put(FACILITY_OPENING_TABLE_IMMIGRATION_RESOURCE_ID, CastResReqDto::setFacilityOpeningTableImmigrationResourceID);
		RUN_MAP.put(FACILITY_OPENING_TABLE_SECURITY_CONTROL_RESOURCE_ID, CastResReqDto::setFacilityOpeningTableSecurityControlResourceID);
		RUN_MAP.put(FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL_RESOURCE_ID, CastResReqDto::setFacilityOpeningTableTransferSecurityControlResourceID);
		RUN_MAP.put(SBD_COUNTER_ALLOCATION_RESOURCE_ID, CastResReqDto::setSbdCounterAllocationResourceID);
	}
    
	private static final Map<String, BiConsumer<CastRsltRunDto, String>> INTERVAL_MAP = new HashMap<>();
	static {
		INTERVAL_MAP.put(SELF_ID, CastRsltRunDto::setSelfID);
		INTERVAL_MAP.put(PARENT_ID, CastRsltRunDto::setParentID);
		INTERVAL_MAP.put(T1, CastRsltRunDto::setT1);
		INTERVAL_MAP.put(T2, CastRsltRunDto::setT2);
		INTERVAL_MAP.put(TRANSACTION_TIME_MIN, CastRsltRunDto::setTransactionTimeMin);
		INTERVAL_MAP.put(TRANSACTION_TIME_MAX, CastRsltRunDto::setTransactionTimeMax);
		INTERVAL_MAP.put(TRANSACTION_TIME_AVG, CastRsltRunDto::setTransactionTimeAvg);
		INTERVAL_MAP.put(WAITING_TIME_MIN, CastRsltRunDto::setWaitingTimeMin);
		INTERVAL_MAP.put(WAITING_TIME_MAX, CastRsltRunDto::setWaitingTimeMax);
		INTERVAL_MAP.put(WAITING_TIME_AVG, CastRsltRunDto::setWaitingTimeAvg);
		INTERVAL_MAP.put(FINISHED_CLIENTS_ABS, CastRsltRunDto::setFinishedClientsAbs);
		INTERVAL_MAP.put(WAITING_CLIENTS_MIN, CastRsltRunDto::setWaitingClientsMin);
		INTERVAL_MAP.put(WAITING_CLIENTS_MAX, CastRsltRunDto::setWaitingClientsMax);
		INTERVAL_MAP.put(WAITING_CLIENTS_AVG, CastRsltRunDto::setWaitingClientsAvg);
		INTERVAL_MAP.put(QUEUE_LENGTH_CURRENT, CastRsltRunDto::setQueueLengthCurrent);
	}

	private static final Map<String, BiConsumer<CastWhatIfCntrlDto, String>> WHATIF_MAP = new HashMap<>();
	static {
		WHATIF_MAP.put("LastChange", CastWhatIfCntrlDto::setLastChange);
		WHATIF_MAP.put(WHAT_IF_RUN_ID, CastWhatIfCntrlDto::setWhatIfRunId);
		WHATIF_MAP.put(MODEL, CastWhatIfCntrlDto::setModel);
		WHATIF_MAP.put("FS", CastWhatIfCntrlDto::setFs);
		WHATIF_MAP.put("CA", CastWhatIfCntrlDto::setCa);
		WHATIF_MAP.put("SBD", CastWhatIfCntrlDto::setSbd);
		WHATIF_MAP.put("PS", CastWhatIfCntrlDto::setPs);
		WHATIF_MAP.put(FACILITY_OPENING_TABLE_DEPARTURE_GATE, CastWhatIfCntrlDto::setFacilityOpeningTableDepartureGate);
		WHATIF_MAP.put(FACILITY_OPENING_TABLE_EMIGRATION, CastWhatIfCntrlDto::setFacilityOpeningTableEmigration);
		WHATIF_MAP.put(FACILITY_OPENING_TABLE_IMMIGRATION, CastWhatIfCntrlDto::setFacilityOpeningTableImmigration);
		WHATIF_MAP.put(FACILITY_OPENING_TABLE_SECURITY_CONTROL, CastWhatIfCntrlDto::setFacilityOpeningTableSecurityControl);
		WHATIF_MAP.put(FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL, CastWhatIfCntrlDto::setFacilityOpeningTableTransferSecurityControl);
		WHATIF_MAP.put(CHECK_IN_COUNTER_SERVICE_TIME, CastWhatIfCntrlDto::setCheckinCounterServiceTime);
		WHATIF_MAP.put(CHECK_IN_TYPE, CastWhatIfCntrlDto::setCheckinType);
		WHATIF_MAP.put(REPORTING_PROFILES_TIME_GROUPS, CastWhatIfCntrlDto::setRptStngId);
		WHATIF_MAP.put(SIMULATION_RESULT_SUFFIX, CastWhatIfCntrlDto::setSimulationResultSuffix);
		WHATIF_MAP.put(STATUS, CastWhatIfCntrlDto::setStatus);
	}
	String colTable = "";			
	String colValue = "";
	String colName = "";
	String pName = "";
	String pValue = "";
    
	@Override
	public String retrieveResourceInformation(String param){
        // 1. 초기 로그 기록 (Step 2)
        saveSimLog("1", "1");
        List<Object> dbResults = null;
		try {
            // 2. XML 파싱 (XXE 보안 설정 적용)
            Document doc = parseXmlSafely(param);
            Element node = doc.getDocumentElement();
            
            CastReqGetResourceInformationDto infoDto = new CastReqGetResourceInformationDto();            
            
        	// 3. 노드 정보 추출 및 DTO 변환
        	resourceInfoList(node, null, infoDto);
            mapResourceFlags(infoDto);
            
            // 5. DB 데이터 조회
            dbResults = castRestMapper.retrieveResourceInformation(infoDto);
            
            // 6. 응답 XML 빌드
            saveSimLog("1", "2");
            return buildResponseXml(dbResults, true);
		} catch (IllegalStateException | ParserConfigurationException | SAXException | IOException e) {
            saveSimLog("1", "9");
            
			return buildResponseXml(dbResults, false);
		}
	}

    /**
     * 리소스 타입 리스트를 확인하여 각 Yn 플래그 세팅 (복잡도 감소)
     */
    private void mapResourceFlags(CastReqGetResourceInformationDto dto) {
        String types = dto.getResourceTypes();
        if (types == null) return;
        
        dto.setModelYn(types.contains(CAST_MODEL) ? "1" : "");
        dto.setExModelYn(types.contains(CAST_EXPRESS_MODEL) ? "1" : "");
        dto.setFlightYn(types.contains(FLIGHT_SCHEDULE) ? "1" : "");
        dto.setCounterYn(types.contains(COUNTER_ALLOCATION) ? "1" : "");
        dto.setSbdYn(types.contains(COUNTER_ALLOCATION) ? "1" : "");
        dto.setStYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setCtYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setDgYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setImmiYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setEmiYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setScYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setTsYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setRptYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setIfYn(types.contains(GENERIC_TABLE) ? "1" : "");
        dto.setHandleYn(types.contains(PROPERTY_SET) ? "1" : "");        
    }
    
    /**
     *  노드 파싱
     *
     * @Method Name : resourceInformationNodeInfo
     * @param ncDto
     * @param model
     * @return
     **/  	
	private void resourceInfoList(Node node, String str, CastReqGetResourceInformationDto sDto) {
		String pStr = str;
		if (PARAMETER.equals(str)) {
			NamedNodeMap attributeMap = node.getAttributes();
			colTable = getAttributeValue(attributeMap, "id").orElse("");
			pStr = "m:" + colTable;
		}

		processResourceInformationInfo(node, pStr, sDto);
		
		if (node.hasChildNodes()) {
			processInfoNodes(node, sDto);
		}
	}
	
	private void processInfoNodes(Node node, CastReqGetResourceInformationDto sDto) {
		NodeList nodeList = node.getChildNodes();
		for (int i = 0; i < nodeList.getLength(); i++) {
			Node childNode = nodeList.item(i);
			
			if (childNode.getNodeType() == Node.TEXT_NODE) {
				continue;
			}
			
			resourceInfoList(childNode, childNode.getNodeName(), sDto);
		}
	}
	
	private void processResourceInformationInfo(Node node, String str, CastReqGetResourceInformationDto sDto) {
		if (RESOURCE_TYPES.equals(str)) {
			sDto.setResourceTypes(node.getTextContent());
		}
	}

    /**
     * 응답용 XML 문자열 생성
     */
    private String buildResponseXml(List<Object> results, boolean result) {
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
        
        if(results != null) {
        	for (Object obj : results) {
                CastResourceInformationDto data = (CastResourceInformationDto) obj;
                appendItemXml(sb, data);
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

    /**
     * 개별 리소스 항목의 XML 생성 (상세 로직 분리)
     */
    private void appendItemXml(StringBuilder sb, CastResourceInformationDto data) {
        sb.append(System.lineSeparator());
        appendDefaultColumns(sb, data);
    }

    private void appendDefaultColumns(StringBuilder sb, CastResourceInformationDto data) {
    	sb.append(TAB_FOUR)
    	  .append("<")
    	  .append(RESOURCE_INFO)
    	  .append(" ")
    	  .append(RESOURCE_TYPE)
    	  .append("=\"")
    	  .append(data.getResourceType())
    	  .append("\" ")
    	  .append(RESOURCE_ID)
    	  .append("=\"")
    	  .append(data.getResourceID())
    	  .append("\" ")
	  	  .append(AUTHOR)
	  	  .append("=\"")
	  	  .append(data.getAuthor())
	  	  .append("\" ")
    	  .append(DESCRIPTION)
    	  .append("=\"")
    	  .append(data.getDescription())
	  	  .append("\" ")
    	  .append(LAST_MODIFIED)
    	  .append("=\"")
    	  .append(data.getLastModified())
    	  .append("\"/>");
    } 
	
	@Override
	public String retrieveResource(String param){		
        // 1. 초기 로그 기록 (Step 2)
        saveSimLog("2", "2");

        try {
            // 2. XML 파싱 (XXE 보안 설정 적용)
            Document doc = parseXmlSafely(param);
            Element node = doc.getDocumentElement();
            
            CastReqGetResourceDto resourceDto = new CastReqGetResourceDto();
            
        	// 3. 노드 정보 추출 및 DTO 변환
            resourceList(node, null, resourceDto);

            // 6. 응답 XML 빌드
            saveSimLog("2", "2");        
            
            // 4. 리소스 타입별 처리 및 XML 생성
            StringBuilder contentSb = new StringBuilder();
            processResourceData(resourceDto.getResourceType(), resourceDto, contentSb);
            return contentSb.toString();
        } catch (IllegalStateException | ParserConfigurationException | SAXException | IOException e) {
            saveSimLog("2", "9");
		}
        
        return INVALID_REQUEST;
	}
	
	private void resourceList(Node node, String str, CastReqGetResourceDto sDto) {
		NamedNodeMap attributeMap = node.getAttributes();
		if (PARAMETER.equals(str)) {
			colTable = getAttributeValue(attributeMap, "id").orElse("");
			processResourceInfo(node, colTable, sDto);
		} else if (RESOURCE_DESCRIPTION.equals(str)) {
			String resourceType = getAttributeValue(attributeMap, RESOURCE_TYPE).orElse("");
			sDto.setResourceType(resourceType);
			String resourceId = getAttributeValue(attributeMap, RESOURCE_ID).orElse("");
			sDto.setResourceID(resourceId);
		}
		
		if (node.hasChildNodes()) {
			processResourceNodes(node, sDto);
		}
	}
	
	private void processResourceNodes(Node node, CastReqGetResourceDto sDto) {
		NodeList nodeList = node.getChildNodes();
		for (int i = 0; i < nodeList.getLength(); i++) {
			Node childNode = nodeList.item(i);
			
			if (childNode.getNodeType() == Node.TEXT_NODE) {
				continue;
			}
			
			resourceList(childNode, childNode.getNodeName(), sDto);
		}
	}
	
	private void processResourceInfo(Node node, String str, CastReqGetResourceDto sDto) {
		if (RESOURCE_TYPE.equals(str)) {
			sDto.setResourceType(node.getTextContent());
		} else if (RESOURCE_ID.equals(str)) {
			sDto.setResourceID(node.getTextContent());
		}
	}
    
    /**
     * 리소스 타입에 따른 분기 처리 (인지 복잡도 해결을 위한 메서드 분리)
     */
    private void processResourceData(String type, CastReqGetResourceDto idto, StringBuilder sb) {
        switch (type) {
            case FLIGHT_SCHEDULE:
                handleFlightSchedule(idto, sb);
                break;
            case COUNTER_ALLOCATION:
                if(idto.getResourceID().contains("CA")) {
                	 handleCounterAllocation(idto, sb);
                }else {
                	handleSbdAllocation(idto, sb);
                }
                break;
            case PROPERTY_SET:
                handlePropertySet(idto, sb);
                break;
            case CAST_MODEL:
            case CAST_EXPRESS_MODEL:
                handleCastModel(type, idto, sb);
                break;
            case GENERIC_TABLE:
            	if(idto.getResourceID().contains(CHECK_IN_TYPE)) {
            		handleCheckinType(idto, sb);
            	}else if(idto.getResourceID().contains(CHECK_IN_COUNTER_SERVICE_TIME)) {
            		handleServiceTime(idto, sb);
            	}else if(idto.getResourceID().contains(FACILITY_OPENING_TABLE_DEPARTURE_GATE)) {
            		handleDepartureGate(idto, sb);
            	}else if(idto.getResourceID().contains(FACILITY_OPENING_TABLE_EMIGRATION)) {
            		handleEmigration(idto, sb);
            	}else if(idto.getResourceID().contains(FACILITY_OPENING_TABLE_IMMIGRATION)) {
            		handleImmigration(idto, sb);
            	}else if(idto.getResourceID().contains(FACILITY_OPENING_TABLE_SECURITY_CONTROL)) {
            		handleSecurityControl(idto, sb);
            	}else if(idto.getResourceID().contains(FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL)) {
            		handleTransferSecurityControl(idto, sb);
            	}else if(idto.getResourceID().contains(REPORTING_PROFILES_TIME_GROUPS)) {
            		handleRrpStngHrGroupControl(idto, sb);
            	}else if(idto.getResourceID().contains(WHAT_IF_DEFINITION_TABLE)) {
            		handleWhatIfControl(idto, sb);
            	}
            	break;
            default:
                sb.append(RESOURCE_ERROR);
        }
    }  
    
    /**
     * FlightSchedule 처리 로직
     */
    private void handleFlightSchedule(CastReqGetResourceDto idto, StringBuilder sb) {
        saveSimLog("3", "1");
        CastFlightScheduleDto fs = castRestMapper.retrieveFlightSchedule(idto);    
       
    	sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if (fs != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(FLIGHT_SCHEDULE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(FLIGHT_SCHEDULE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(fs.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(0).append(FRIENDLYNAME).append("Table").append(XML_ID).append("Self_TBasicObject").append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	FS_FIELD_MAP.forEach((xmlTag, fsFieldInfo) -> {
        		Object value = fsFieldInfo.extractor.apply(fs);
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(xmlTag).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(fsFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(xmlTag).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(value == null ? "" : value).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }
        saveSimLog("3", "2");
    }

    /**
     * CounterAllocation 처리 로직
     */
    private void handleCounterAllocation(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("4", "1");
		CastCounterAllocationDto ca = castRestMapper.retrieveCounterAllocation(idto);
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(ca != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(COUNTER_ALLOCATION).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(COUNTER_ALLOCATION).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(ca.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(0).append(FRIENDLYNAME).append(COUNTER_ALLOCATION).append(XML_ID).append(COUNTER_ALLOCATION).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	CA_FIELD_MAP.forEach((xmlTag, caFieldInfo) -> {
        		Object value = caFieldInfo.extractor.apply(ca);        		
        		if (CHECKINALLOCDESCRYPTION.equals(xmlTag)) {
        			value = ((String) value).replace(FNC_S_QUOT_ONE,FNC_QUOT_ONE);        		
        		}
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(xmlTag).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(caFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(xmlTag).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(value == null ? "" : value).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}
    	saveSimLog("4", "2");    	
    }

    /**
     * SBDCounterAllocation 처리 로직
     */
    private void handleSbdAllocation(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("5", "1");
		CastSelfCheckInCountAndBagDropDto sf = castRestMapper.retrieveSelfCheckInCountAndBagDrop(idto);
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(sf != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(COUNTER_ALLOCATION).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(COUNTER_ALLOCATION).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(sf.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(0).append(FRIENDLYNAME).append(COUNTER_ALLOCATION).append(XML_ID).append(COUNTER_ALLOCATION).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	SBD_FIELD_MAP.forEach((xmlTag, sbdFieldInfo) -> {
        		Object value = sbdFieldInfo.extractor.apply(sf);     		
        		if (AIRLINECODE.equals(xmlTag) || CHECKINALLOCDESCRYPTION.equals(xmlTag)) {
        			value = ((String) value).replace(FNC_S_QUOT_ONE,FNC_QUOT_ONE);        		
        		}   
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(xmlTag).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(sbdFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(xmlTag).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(value == null ? "" : value).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}
    	saveSimLog("5", "2");    	
    }

    /**
     * PropertySet 처리 (상당히 복잡한 XML 구조)
     */
    private void handlePropertySet(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("6", "1");
    	processMasterInfo(idto, sb);
    	saveSimLog("6", "2");    	
    }
	
	private void processMasterInfo(CastReqGetResourceDto idto, StringBuilder sb) {
		StringBuilder pNameSb = new StringBuilder();
		StringBuilder pFriendlyNameSb = new StringBuilder();
		StringBuilder pEnumTypeSb = new StringBuilder();
		StringBuilder pKindSb = new StringBuilder();
		StringBuilder unitNameSb = new StringBuilder();
		StringBuilder valSb = new StringBuilder();
		
		CastPropertySetDto arrMst = castRestMapper.retrievePropertySetMst(idto);		
		processServiceProperties(idto, pNameSb, pFriendlyNameSb, pEnumTypeSb, pKindSb, unitNameSb, valSb);
		processPaxAndResourceInfo(idto, pNameSb, pFriendlyNameSb, pEnumTypeSb, pKindSb, unitNameSb, valSb);
		processPropertySetId(idto, pNameSb, pFriendlyNameSb, pEnumTypeSb, pKindSb, unitNameSb, valSb);
		
		sb.append(XML_VERSION)
		  .append(System.lineSeparator())
          .append(SOAP_ENVELOPE_START)
		  .append(System.lineSeparator())
          .append(TAB_ONE).append(SOAP_BODY_START)
		  .append(System.lineSeparator())
		  .append(TAB_TWO).append(RES_GET_RESOURCE_START)
		  .append(System.lineSeparator());
		if (arrMst != null) {
			sb.append(TAB_THREE).append("<").append(RESOURCE_INFO).append(" ").append(AUTHOR).append("=\"").append(arrMst.getAuthor()).append(FNC_S_QUOT_ONE)
			  .append(" ").append(CREATED).append("=\"").append(arrMst.getCreated()).append(FNC_S_QUOT_ONE)
			  .append(" ").append(DESCRIPTION).append("=\"").append(PROPERTY_SET).append(FNC_S_QUOT_ONE)
			  .append(" ").append(LAST_MODIFIED).append("=\"").append(arrMst.getLastModified()).append(FNC_S_QUOT_ONE)
			  .append(" ").append(LAST_SAVE_BY).append("=\"").append(arrMst.getLastSaveBy()).append(FNC_S_QUOT_ONE)
			  .append(" ").append(LAST_SAVED_USING_VERSION).append("=\"").append(arrMst.getLastSaveUsingVersion()).append(FNC_S_QUOT_ONE)
			  .append(" ").append(RESOURCE_ID).append("=\"").append(arrMst.getResourceID()).append(FNC_S_QUOT_ONE)
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
			  .append("RunID,").append(pNameSb.toString()).append(FNC_S_QUOT_ONE).append("/>")
			  .append(System.lineSeparator())
			  .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE)
			  .append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append("Property Friendly Name").append(FNC_S_QUOT_ONE)
			  .append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE)
			  .append("PFriendlyName").append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE)
			  .append("Run ID,").append(pFriendlyNameSb.toString()).append(FNC_S_QUOT_ONE).append("/>")
			  .append(System.lineSeparator())
			  .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
			  .append("Property Enumeration Type").append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE)
			  .append("PEnumType").append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(",").append(pEnumTypeSb.toString()).append(FNC_S_QUOT_ONE).append("/>")
			  .append(System.lineSeparator())
			  .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE)
			  .append("TPKind").append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
			  .append("Property Kind").append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append("Enumeration").append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE)
			  .append("PKind").append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(STRING).append(",").append(pKindSb.toString()).append(FNC_S_QUOT_ONE).append("/>")
			  .append(System.lineSeparator())
			  .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
			  .append("Unit Name").append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE)
			  .append("UnitName").append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(",").append(unitNameSb.toString()).append(FNC_S_QUOT_ONE).append("/>")
			  .append(System.lineSeparator())
			  .append(TAB_FIVE).append(M_COL_START).append(P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE).append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE)
			  .append("Property Values").append(FNC_S_QUOT_ONE).append(P_KIND).append(FNC_S_QUOT_ONE).append(STRING).append(FNC_S_QUOT_ONE).append(PROPERTY_P_NAME)
			  .append(FNC_S_QUOT_ONE).append(S_VALUES).append(FNC_S_QUOT_ONE).append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(",").append(valSb.toString()).append(FNC_S_QUOT_ONE).append("/>")
			  .append(System.lineSeparator())
			  .append(TAB_FOUR).append(M_TABLE_END)
			  .append(System.lineSeparator())
			  .append(TAB_THREE).append(RESOURCE_CONTENT_END)
			  .append(System.lineSeparator())
			  .append(TAB_THREE).append(INVOCATION_RESULT)
			  .append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>")
			  .append(System.lineSeparator())
			  .append(TAB_TWO).append(RES_GET_RESOURCE_END)
	          .append(System.lineSeparator())
			  .append(TAB_ONE).append(SOAP_BODY_END)
	          .append(System.lineSeparator())
              .append(SOAP_ENVELOPE_END);				
		}else {
			sb.append(TAB_THREE).append(INVOCATION_RESULT)
			  .append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>")
			  .append(System.lineSeparator())
			  .append(TAB_TWO).append(RES_GET_RESOURCE_END)
			  .append(System.lineSeparator())
			  .append(TAB_ONE).append(SOAP_BODY_END)
			  .append(System.lineSeparator())
			  .append(SOAP_ENVELOPE_END);
		}
	}
	
	private void processServiceProperties(CastReqGetResourceDto idto, StringBuilder pNameSb, StringBuilder pFriendlyNameSb, StringBuilder pEnumTypeSb, StringBuilder pKindSb, StringBuilder unitNameSb, StringBuilder valSb) {
		List<Object> arrSvc = castRestMapper.retrievePropertySetSvc(idto);
		if (arrSvc != null) {			
			for (int i = 0; i < arrSvc.size(); i++) {
				CastPropertySetDto step = (CastPropertySetDto) arrSvc.get(i);
				appendSeparators(i, pNameSb, pFriendlyNameSb, pEnumTypeSb, pKindSb, unitNameSb, valSb);
				pNameSb.append(step.getPName());
				pFriendlyNameSb.append(step.getPFriendlyName());
				pEnumTypeSb.append(step.getPEnumType());
				pKindSb.append(STRING);
				unitNameSb.append("");
				valSb.append(buildPropertyXmlValue(step));
			}
		}
	}
	
	private void appendSeparators(int index, StringBuilder... sbs) {
		if (index > 0) {
			for (StringBuilder sb : sbs) sb.append(",");
		}
	}
	
	private String buildPropertyXmlValue(CastPropertySetDto step) {
		String tyCd = step.getTyCd();
		String vlType = step.getVlType();
		StringBuilder xml = new StringBuilder();
		
		switch (tyCd) {
		case "01" :
			if ("1".equals(vlType)) appendTringleFloatXml(xml, step);
			else if ("2".equals(vlType)) appendTringleIntegerXml(xml, step);
			else if ("3".equals(vlType)) appendTringleUnassignedXml(xml, step);
			break;
		case "02" :
			if ("1".equals(vlType)) appendRandomFloatXml(xml, step);
			else if ("2".equals(vlType)) appendRandomIntegerXml(xml, step);
			else if ("3".equals(vlType)) appendRandomUnassignedXml(xml, step);
			break;
		case "03" : appendGammaXml(xml, step); break;
		case "04" : appendConstantXml(xml, step); break;
		case "05" : appendGaussianXml(xml, step); break;
		case "06" : appendExponentialXml(xml, step); break;
		case "07" : appendErlangXml(xml, step); break;
		case "08" : appendWeibullXml(xml, step); break;
		case "09" : appendPolygonalXml(xml, step); break;
		case "10" : appendPoissonXml(xml, step); break;
		case "11" : appendNegativeBinomialXml(xml, step); break;
		  default:
			  xml.append(step.getVal());
		    break;
		}
		
		return xml.toString();
	}
	
	private void appendTringleFloatXml(StringBuilder sb, CastPropertySetDto step) {
	    sb.append(TID_TRIANGLE)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_A)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_B)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_C)
	      .append(step.getDist())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendTringleIntegerXml(StringBuilder sb, CastPropertySetDto step) {
	    sb.append(TID_TRIANGLE)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_INTEGER)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_A)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_B)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_C)
	      .append(step.getDist())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendTringleUnassignedXml(StringBuilder sb, CastPropertySetDto step) {
	    sb.append(TID_TRIANGLE)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_UNASSIGNED)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_A)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_B)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_C)
	      .append(step.getDist())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendRandomFloatXml(StringBuilder sb, CastPropertySetDto step) {
	    sb.append(TID_RANDOMIZED)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_MAX)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_MIN)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_USE_RESTR)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendRandomIntegerXml(StringBuilder sb, CastPropertySetDto step) {
	    sb.append(TID_RANDOMIZED_INTEGER)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_INTEGER)
	      .append(FNC_EXPANDED)
	      .append(FNC_MAX_INTEGER)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_MIN_INTEGER)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_USE_RESTR)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendRandomUnassignedXml(StringBuilder sb, CastPropertySetDto step) {	    
	    sb.append(TID_RANDOMIZED)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_UNASSIGNED)
	      .append(FNC_EXPANDED)
	      .append(FNC_MAX)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_MIN)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_USE_RESTR)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE); 
	}
	
	private void appendGammaXml(StringBuilder sb, CastPropertySetDto step) {
	    sb.append(TID_GAMMA)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_SCALE)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_SHAPE)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE); 	
	}
	
	private void appendConstantXml(StringBuilder sb, CastPropertySetDto step) {	    
	    sb.append(TID_CONTANT)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)	      
	      .append(FNC_VALUE)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendGaussianXml(StringBuilder sb, CastPropertySetDto step) {
	    sb.append(TID_GAUSSIAN)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_MEAN)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_STD_DEV)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendExponentialXml(StringBuilder sb, CastPropertySetDto step) {	    
	    sb.append(TID_EXPONENTIAL)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_MAX)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_MIN)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendErlangXml(StringBuilder sb, CastPropertySetDto step) {	    
	    sb.append(TID_ERLANG)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_OFFSET)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_DEGFREEDOM)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_LAMBDA)
	      .append(step.getDist())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendWeibullXml(StringBuilder sb, CastPropertySetDto step) {	    
	    sb.append(TID_WEIBULL)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_SCALE)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_SHAPE)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendPolygonalXml(StringBuilder sb, CastPropertySetDto step) {	    
	    sb.append(TID_POLYGONAL)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_INTERVAL_DATA)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_OFFSET)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendPoissonXml(StringBuilder sb, CastPropertySetDto step) {
	    sb.append(TID_POISSON)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_MEAN)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);
	}
	
	private void appendNegativeBinomialXml(StringBuilder sb, CastPropertySetDto step) {	    
	    sb.append(TID_NEGATIVE_BINOMIAL)
	      .append(FNC_ROLE)
	      .append(FNC_ANNOTATION)
	      .append(FNC_CATEGORY)
	      .append(FNC_DESCRIPTION)
	      .append(FNC_DISTRIBUTION_UNIT)
	      .append(FNC_DYNAMIC_PARAMS)
	      .append(FNC_ERROR_HANDLEING_MODE)
	      .append(FNC_ERROR_RETURN_VALUE_FLOAT)
	      .append(FNC_EXPANDED)
	      .append(FNC_USE_RESTR)
	      .append(FNC_MAX)
	      .append(step.getMax())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_MIN)
	      .append(step.getMin())
	      .append(FNC_QUOT_TWO)
	      .append(FNC_QT)
	      .append(FNC_LR)
	      .append(FNC_QUOT_ONE);	
	}
	
	private void processPaxAndResourceInfo(CastReqGetResourceDto idto, StringBuilder pNameSb, StringBuilder pFriendlyNameSb, StringBuilder pEnumTypeSb, StringBuilder pKindSb, StringBuilder unitNameSb, StringBuilder valSb) {
		List<Object> arrPax = castRestMapper.retrievePropertySetPax(idto);
		if (arrPax != null) {
			for (int i = 0; i < arrPax.size(); i++) {
				CastPropertySetDto step = (CastPropertySetDto) arrPax.get(i);
				pNameSb.append(',').append(step.getPName());
				pFriendlyNameSb.append(',').append(step.getPFriendlyName());
				pEnumTypeSb.append(',').append(step.getPEnumType());
				pKindSb.append(',').append(step.getVlType());
				unitNameSb.append(',').append("");
				valSb.append(',').append(buildPaxAndResourceXmlValue(step));
			}
		}
	}
	
	private String buildPaxAndResourceXmlValue(CastPropertySetDto step) {		
		String tyCd = step.getTyCd();
		StringBuilder xml = new StringBuilder();
		CastProPertySetDtlDto pax = new CastProPertySetDtlDto();
		pax.setCd(step.getCd());
		pax.setResourceID(step.getResourceID());
		List<Object> paxDtl = castRestMapper.retrievePropertySetPaxDtl(pax);
		
		for (int i = 0; i < paxDtl.size(); i++) {
			CastProPertySetDtlDto paxInput = (CastProPertySetDtlDto) paxDtl.get(i);
			
			switch (tyCd) {
			case "01" : 
				appendTConstantShareRowsXml(xml, paxInput, i);
				if (i == (paxDtl.size() - 1)) xml.append(T_CONSTANT_SHARE_ROWS_END);
				break;
			case "02" : 
				appendTReportingProfileXml(xml, paxInput, i);
				if (i == (paxDtl.size() - 1)) xml.append(T_REPORTING_PROFILE_END);
				break;
			case "03" :
				appendTIMultiCaseOfValuesXml(xml, paxInput, i);
				if (i == (paxDtl.size() - 1)) xml.append(TI_MULTI_CASE_OF_VALUES_END);
				break;
			case "04" : appendSharesXml(xml, paxInput, i); break;
			case "05" : appendTIDPoissonRoleXml(xml, paxInput, i); break;
			  default:
				  xml.append(step.getVal());
			    break;
			}
		}
		
		return xml.toString();		
	}

	private void appendTConstantShareRowsXml(StringBuilder sb, CastProPertySetDtlDto paxInput, int i) {
		if (i == 0) sb.append(T_CONSTANT_SHARE_ROWS_START);
		if (i == 0) sb.append(T_CONSTANT_SHARE_ROWS_ROLE);
		if(paxInput.getValue1().equals("True") || paxInput.getValue1().equals("False")){
			sb.append(T_CONSTANT_SHARE_ROW);
			sb.append(T_CONSTANT_SHARE_ROW_ROLE).append(paxInput.getRole()).append(")");
			sb.append(FNC_QUOT_TWO);
			sb.append(SHARES).append(paxInput.getShares());
			sb.append(FNC_QUOT_TWO);
			sb.append(VALUE).append(paxInput.getValue1());
			sb.append(FNC_QUOT_TWO);
			sb.append(FNC_QT);
			sb.append(FNC_LR);
		} else {
			String tmpVal = "";
			if(paxInput.getValue1().isEmpty()||paxInput.getValue1().equals("")||"".equals(paxInput.getValue1())){
				tmpVal = "0";
			} else {
				tmpVal = paxInput.getValue1();
			}
			sb.append(T_CONSTANT_SHARE_ROW);
			sb.append(T_CONSTANT_SHARE_ROW_ROLE).append(paxInput.getRole()).append(")");
			sb.append(FNC_QUOT_TWO);
			sb.append(SHARES).append(paxInput.getShares());
			sb.append(FNC_QUOT_TWO);
			sb.append(VALUE).append(paxInput.getVlType()).append("] ").append(tmpVal);
			sb.append(FNC_QUOT_TWO);
			sb.append(FNC_QT);
			sb.append(FNC_LR);
		}
	}
	
	private void appendTReportingProfileXml(StringBuilder sb, CastProPertySetDtlDto paxInput, int i) {		
		if (i == 0) sb.append(T_REPORTING_PROFILE_START);
		if (i == 0) sb.append(FNC_ROLE);
		if (i == 0) sb.append(T_REPORTING_PROFILE_MODE);
		if (i == 0) sb.append(FNC_QUOT_TWO);
		if (i == 0) sb.append(NAME);
		if (i == 0) sb.append(FNC_QUOT_TWO);
		if (i == 0) sb.append(SOURCE_DATA_COUNT);
		if (i == 0) sb.append(FNC_QUOT_TWO);
		if (i == 0) sb.append("&gt;&#13;&#10;");
		String sPercentage = String.valueOf(Double.parseDouble(paxInput.getShares())/100);
		sb.append(T_REPORTING_PROFILE_ENTRY);
		sb.append(T_CONSTANT_SHARE_ROW_ROLE).append(paxInput.getRole()).append(")");
		sb.append(FNC_QUOT_TWO);
		sb.append(CHOSEN_TIME);
		sb.append(FNC_QUOT_TWO);
		sb.append(PERCENTAGE).append(StringUtils.removeTrailingZeros(sPercentage));
		sb.append(FNC_QUOT_TWO);
		sb.append(START_TIME_DURATION).append(paxInput.getValue2().substring(0, 2));
		sb.append(":").append(paxInput.getValue2().substring(2, 4)).append(":").append(paxInput.getValue2().substring(4, 6));
		sb.append(".000");
		sb.append(FNC_QUOT_TWO);
		sb.append(FNC_QT);
		sb.append(FNC_LR);
	}
	
	private void appendTIMultiCaseOfValuesXml(StringBuilder sb, CastProPertySetDtlDto paxInput, int i) {
		if (i == 0) sb.append(TI_MULTI_CASE_OF_VALUES_START);
		if (i == 0) sb.append(T_CONSTANT_SHARE_ROWS_ROLE);
		String[] splitVal = paxInput.getShares().split(",");
		String splitNum = "";
		for (int bb = 0; bb < splitVal.length; bb++) {
			String splitRstl = splitVal[bb].replace(" ", "");
			if (bb < 10) {
				splitNum = "0" + Integer.toString(bb);
			} else {
				splitNum = Integer.toString(bb);
			}
			sb.append(TI_MULTI_CASE_OF_VALUE);
			sb.append(TI_MULTI_CASE_OF_VALUE_ROLE).append(splitNum).append(")");
			sb.append(FNC_QUOT_TWO);
			sb.append(OPERATOR_ENUM);
			sb.append(FNC_QUOT_TWO);
			sb.append(TI_MULTI_CASE_OF_VALUE_VALUE).append(splitRstl);
			sb.append(FNC_QUOT_TWO);
			sb.append(FNC_QT);
			sb.append(FNC_LR);
		}
	}
	
	private void appendSharesXml(StringBuilder sb, CastProPertySetDtlDto paxInput, int i) {
		if (i == 0) sb.append(paxInput.getShares());
	}
	
	private void appendTIDPoissonRoleXml(StringBuilder sb, CastProPertySetDtlDto paxInput, int i) {
		if (i == 0) sb.append(TID_POISSON_ROLE);
		if (i == 0) sb.append(paxInput.getShares());
		if (i == 0) sb.append(TID_POISSON_USE_RESTR);		
	}
	
	private void processPropertySetId(CastReqGetResourceDto idto, StringBuilder pNameSb, StringBuilder pFriendlyNameSb, StringBuilder pEnumTypeSb, StringBuilder pKindSb, StringBuilder unitNameSb, StringBuilder valSb) {
		List<Object> arrId = castRestMapper.retrievePropertySetId(idto);
		if (arrId != null) {
			for (int i = 0; i < arrId.size(); i++) {
				CastPropertySetDto step = (CastPropertySetDto) arrId.get(i);
				pNameSb.append(',').append(step.getPName());
				pFriendlyNameSb.append(',').append(step.getPFriendlyName());
				pEnumTypeSb.append(',').append(step.getPEnumType());
				pKindSb.append(',').append(STRING);
				unitNameSb.append(',').append("");
				valSb.append(',').append(step.getVal());
			}
		}
	}

    /**
     * CAST_MODEL, CAST_EXPRESS_MODEL 처리 로직
     */
    private void handleCastModel(String type, CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("7", "1");
		CastModelDto ms = castRestMapper.retrieveCASTExModel(idto);
		
		String filePath = ms.getFileNm();
		StringBuilder fileValue = new StringBuilder();
		
		if(FileUtil.isExistsFile(filePath)) {
			try {
				if(FileUtil.isExistsFile(filePath)) {
					fileValue = FileUtil.readTextFile(filePath,false);
				}
			} catch (IOException e) {
				saveSimLog("7", "9"); 
			}
		}
		
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(type == null ? CAST_MODEL : CAST_EXPRESS_MODEL).append(FNC_S_QUOT_ONE).append(" ");
		sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(ms.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
		sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(ms.getAuthor()).append(FNC_S_QUOT_ONE).append(" ");
		sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(ms.getDescription()).append(FNC_S_QUOT_ONE).append(" ");
		sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(ms.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
		sb.append(System.lineSeparator());
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
		sb.append(TAB_THREE).append(INVOCATION_RESULT);
		sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
		sb.append(System.lineSeparator());
		sb.append(TAB_ONE).append(SOAP_BODY_END);
		sb.append(System.lineSeparator());
		sb.append(SOAP_ENVELOPE_END);
    	saveSimLog("7", "2"); 
    }
    
    /**
     * handleServiceTime 처리 (상당히 복잡한 XML 구조)
     */
    private void handleServiceTime(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("9", "1");
    	CastCheckInCounterServiceTimeDto st = castRestMapper.retrieveCheckInCounterServiceTime(idto);
    	
    	sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(st != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(st.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(-1).append(FRIENDLYNAME).append("CheckinCounterServiceTime001").append(XML_ID).append("CheckinCounterServiceTime001").append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	ST_FIELD_MAP.forEach((xmlTag, stFieldInfo) -> {
        		Object value = stFieldInfo.extractor.apply(st);
             	sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnCaseConverter(fnPascalCase(xmlTag))).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(stFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(value == null ? "" : StringEscapeUtils.escapeXml11((String) value)).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }
    	saveSimLog("9", "2");
    }
	
    /**
     * handleCheckinType 처리 (상당히 복잡한 XML 구조)
     */
    private void handleCheckinType(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("10", "1");
		CastCheckinTypeDto ct = castRestMapper.retrieveCheckinType(idto);
		
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(ct != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(ct.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(-1).append(FRIENDLYNAME).append(CHECK_IN_TYPE).append(XML_ID).append(CHECK_IN_TYPE).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	CT_FIELD_MAP.forEach((xmlTag, ctFieldInfo) -> {
        		Object value = ctFieldInfo.extractor.apply(ct);
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnCaseConverter(fnPascalCase(xmlTag))).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(ctFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(value == null ? "" : value).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }
		
    	saveSimLog("10", "2");
    }
	
    /**
     * handleDepartureGate 처리 (상당히 복잡한 XML 구조)
     */
    private void handleDepartureGate(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("11", "1");
		CastFcltyOpngTblDptgDto dg = castRestMapper.retrieveFcltyOpngTblDptg(idto);
		
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		
		if(dg != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(dg.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(-1).append(FRIENDLYNAME).append("Facility Opening Table_Departure Gate").append(XML_ID).append(FACILITY_OPENING_TABLE_DEPARTURE_GATE).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	DG_FIELD_MAP.forEach((xmlTag, dgFieldInfo) -> {
        		Object value = dgFieldInfo.extractor.apply(dg);
        		String tagValue;
        		if (value == null) {
        			tagValue = "";
        		} else {
        			tagValue = (String) value;
        		}
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnCaseConverter(fnPascalCase(xmlTag))).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(dgFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(tagValue).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }
    	saveSimLog("11", "2");    	
    }
	
    /**
     * handleEmigration 처리 (상당히 복잡한 XML 구조)
     */
    private void handleEmigration(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("12", "1");
    	CastFcltyOpngTblEmigDto em = castRestMapper.retrieveFcltyOpngTblEmig(idto);
    	
    	sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(em != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(em.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(0).append(FRIENDLYNAME).append("Facility Opening Table_Emigration").append(XML_ID).append(FACILITY_OPENING_TABLE_EMIGRATION).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	EM_FIELD_MAP.forEach((xmlTag, emFieldInfo) -> {
        		Object value = emFieldInfo.extractor.apply(em);
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnCaseConverter(fnPascalCase(xmlTag))).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(emFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(value == null ? "" : value).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }	
    	saveSimLog("12", "2");    	
    }
	
    /**
     * handleImmigration 처리 (상당히 복잡한 XML 구조)
     */
    private void handleImmigration(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("13", "1");
		CastFcltyOpngTblImmigDto im = castRestMapper.retrieveFcltyOpngTblImmig(idto);
		
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(im != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(im.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(-1).append(FRIENDLYNAME).append("Facility Opening Table_Immigration").append(XML_ID).append(FACILITY_OPENING_TABLE_IMMIGRATION).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	IM_FIELD_MAP.forEach((xmlTag, imFieldInfo) -> {
        		Object value = imFieldInfo.extractor.apply(im);
        		String tagValue;
        		if (value == null) {
        			tagValue = "";
        		} else {
        			tagValue = StringEscapeUtils.escapeXml11((String) value);
        		}
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnCaseConverter(fnPascalCase(xmlTag))).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(imFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(tagValue).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }	
    	saveSimLog("13", "2");    	
    }
	
    /**
     * handleSecurityControl 처리 (상당히 복잡한 XML 구조)
     */
    private void handleSecurityControl(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("14", "1");
		CastFcltyOpngTblScrtyCntrlDto sc = castRestMapper.retrieveFcltyOpngTblScrtyCntrl(idto);
		
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(sc != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(sc.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(0).append(FRIENDLYNAME).append("Facility Opening Table_Security Control").append(XML_ID).append(FACILITY_OPENING_TABLE_SECURITY_CONTROL).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	SC_FIELD_MAP.forEach((xmlTag, scFieldInfo) -> {
        		Object value = scFieldInfo.extractor.apply(sc);
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnCaseConverter(fnPascalCase(xmlTag))).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(scFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(value == null ? "" : value).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});        	
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }	
    	saveSimLog("14", "2");    	
    }
	
    /**
     * handleTransferSecurityControl 처리 (상당히 복잡한 XML 구조)
     */
    private void handleTransferSecurityControl(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("15", "1");
		CastFcltyOpngTblTrnstScrtyCntrlDto ts = castRestMapper.retrieveFcltyOpngTblTrnstScrtyCntrl(idto);
		
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(ts != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(ts.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(-1).append(FRIENDLYNAME).append("Facility Opening Table_Transfer Security Control").append(XML_ID).append(FACILITY_OPENING_TABLE_TRANSFER_SECURITY_CONTROL).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	TS_FIELD_MAP.forEach((xmlTag, tsFieldInfo) -> {
        		Object value = tsFieldInfo.extractor.apply(ts);
        		String tagValue;
        		if (value == null) {
        			tagValue = "";
        		} else {
        			tagValue = (String) value;
        		}
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnCaseConverter(fnPascalCase(xmlTag))).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(tsFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(tagValue).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }	
    	saveSimLog("15", "2");    	
    }
    /**
     * handleTransferSecurityControl 처리 (상당히 복잡한 XML 구조)
     */
    private void handleRrpStngHrGroupControl(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("21", "1");
    	CastRptStngHrGroupCntrlDto rs = castRestMapper.retrieveRptStngHrGroupCntrl(idto);
		
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(rs != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(rs.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(-1).append(FRIENDLYNAME).append("Reporting Profiles Time Groups").append(XML_ID).append(REPORTING_PROFILES_TIME_GROUPS).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	RS_FIELD_MAP.forEach((xmlTag, rsFieldInfo) -> {
        		Object value = rsFieldInfo.extractor.apply(rs);
        		String tagValue;
        		if (value == null) {
        			tagValue = "";
        		} else {
        			tagValue = (String) value;
        		}
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnCaseConverter(fnPascalCase(xmlTag))).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(rsFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(tagValue).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }	
    	saveSimLog("21", "2");    	
    }
    private String fnPascalCase(String camelCase) {
    	if (camelCase == null || camelCase.isBlank()) {
    		return camelCase;
    	}
    	
    	return camelCase.substring(0,1).toUpperCase() + camelCase.substring(1);
    }
    
    private String fnCaseConverter(String camelCase) {
    	if (camelCase == null || camelCase.isBlank()) {
    		return camelCase;
    	}
    	
    	StringBuilder result = new StringBuilder();
    	for (int i = 0; i < camelCase.length(); i++) {
    		char c = camelCase.charAt(i);
    		
    		if ("CurrentNumberofLanes".equals(camelCase) && c == 'o' || Character.isUpperCase(c) && i > 0) {
    			result.append(" ");
    		}
    		
    		result.append(c);
    	}
    	
    	return result.toString();
    }
	
    /**
     * XXE(XML External Entity) 공격 방지를 위한 보안 파싱 설정
     */
    private Document parseXmlSafely(String xmlStr) throws ParserConfigurationException, SAXException, IOException {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        
        // 소나큐브 필수 보안 설정    
        dbf.setFeature(DISALLOW_DOCTYPE_DECL, true);
        dbf.setFeature(EXTERNAL_GENERAL_ENTITIES, false);
        dbf.setFeature(EXTERNAL_PARAMETER_ENTITIES, false);
        dbf.setXIncludeAware(false);
        dbf.setExpandEntityReferences(false);
        
        try (StringReader sr = new StringReader(xmlStr)) {
            DocumentBuilder db = dbf.newDocumentBuilder();
            return db.parse(new InputSource(sr));
        }
    }
	
	private Optional<String> getAttributeValue(NamedNodeMap attributeMap, String attributeName) {
		if (attributeMap == null) return Optional.empty();
		
		Node attr = attributeMap.getNamedItem(attributeName);
		if (attr != null) {
			return Optional.ofNullable(attr.getNodeValue());
		}
		
		return Optional.empty();
	}

    /**
     * 로그 기록 공통화
     */
    private void saveSimLog(String step, String status) {
        SimRunStatDto logDto = new SimRunStatDto();
        logDto.setSmltExcnStepCd(step);
        logDto.setSmltExcnSttsCd(status);
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
        	HttpServletRequest request = attributes.getRequest();
        	logDto.setLoginIpAddr(request.getRemoteAddr());
        }
        castRestMapper.insertSimRunStat(logDto);
        
    }
    
	@Override
	public String saveResult(String param){
        // 1. 초기 로그 기록 (Step 2)
        saveSimLog("16", "1");
        
		CastResReqDto simRslt = new CastResReqDto();
		CastRsltRunDto simRsltContent = new CastRsltRunDto();
		List<CastRsltRunDto> simRsltContentMap = new ArrayList<>();
		CastModelDto mDto = new CastModelDto();
		CastWhatIfCntrlDto wDto = new CastWhatIfCntrlDto();
		
		SessionUtils.setUserContext(simRslt, sessionService);
		SessionUtils.setUserContext(simRsltContent, sessionService);
		
		try {			
            // 2. XML 파싱 (XXE 보안 설정 적용)
            Document doc = parseXmlSafely(param);
            Element node = doc.getDocumentElement();
            
        	// 3. 노드 정보 추출 및 DTO 변환
            simRsltParser(node, RUN, simRslt, simRsltContentMap, simRsltContent, wDto);
			if (simRslt.getResourceType().equals(CAST_MODEL) || simRslt.getResourceType().equals(CAST_EXPRESS_MODEL)) {
				ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
		        if (attributes != null) {
		        	HttpServletRequest request = attributes.getRequest();
		        	mDto.setLoginIpAddr(request.getRemoteAddr());
		        }
				modelParser(node, mDto);
				saveModel(mDto);
			}else if(simRslt.getResourceType().equals(GENERIC_TABLE)) {
				
		        int result = updateWhatIf(wDto);
		        if(result < 1) {
					return buildReturnXml(false);
				}
		        
			}else {
				ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
		        if (attributes != null) {
		        	HttpServletRequest request = attributes.getRequest();
		        	simRslt.setLoginIpAddr(request.getRemoteAddr());
		        }
				int result = insertResult(simRslt);
				if(result < 1) {
					return buildReturnXml(false);
				}
			}
			
            // 6. 응답 XML 빌드
            saveSimLog("16", "2");
            return buildReturnXml(true);
		} catch (IllegalStateException | ParserConfigurationException | SAXException | IOException  e) {
            saveSimLog("16", "9");
            return buildReturnXml(false);
		}
	}
	
	private int insertResult(CastResReqDto dto){
		saveSimLog("19", "1");
		int relatedEventCd = setupMasterDto(dto);
		String simId = castRestMapper.retrieveSimId(dto);
		dto.setSimId(simId);
		
		SmltMdlDto modelDto = castRestMapper.retrieveModelInfo(dto);		
		String sno = (modelDto != null) ? modelDto.getSmltMdlSn() : "";
		dto.setSmltMdlSn(sno);
		if(sno.equals("")) {
			return 0;
		}
		List<SmltRsltDtlDto> datailList = processDetailList(dto, simId, sno, relatedEventCd);
		
		int rRslt = castRestMapper.insertSimSet(dto);
		if (!datailList.isEmpty()) {
			executeBatchInsert(datailList);
		}
		
		//executeDeleteLogic();
		saveSimLog("19", "2");
		return rRslt;
	}
	
	private int setupMasterDto(CastResReqDto dto) {
		int eventCd = 1;
		
		if (dto.getResourceID().contains(" Auto")) {
			dto.setSmltType("Auto");
			eventCd = 2;
		} else if (dto.getResourceID().contains("WhatIf")) {
			dto.setSmltType("WhatIf");
			eventCd = 0;
		}else {
			dto.setSmltType("Manual");
			eventCd = 1;
		} 
		
		return eventCd;
	}
	
	private List<SmltRsltDtlDto> processDetailList(CastResReqDto dto, String simId, String sno, int eventCd) {
		List<SmltRsltDtlDto> collector = new ArrayList<>();
		List<CastRsltRunDto> runList = dto.getResourceContent();
		
		if (runList == null) return collector;

		for (CastRsltRunDto run : runList) {			
			processSingleRun(collector, dto, run, simId, sno, eventCd);
		}
		return collector;
	}
	
	private void processSingleRun(List<SmltRsltDtlDto> collector, CastResReqDto dto, CastRsltRunDto run, String simId, String sno, int eventCd) {
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
		
		List<CastRsltFcltCdDto> fcltCdList = castRestMapper.checkFcltCdList(dto);
		
		for (int j = 0; j < sIDs.length; j++) {
			if (sIDs[j] == null || sIDs[j].isBlank() || pID[j].equals("")) {
				continue;
			}
			
			String fcltCd = fcltCdArr[Integer.parseInt(pID[j]) - 1];
			
			String chk = checkFcltCd(fcltCdList, fcltCd);
			
			SmltRsltDtlDto dtl = new SmltRsltDtlDto();
			ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
	        if (attributes != null) {
	        	HttpServletRequest request = attributes.getRequest();
	        	dtl.setLoginIpAddr(request.getRemoteAddr());
	        }
			if (chk != null && chk.length() > 0) {
				dtl.setSmltId(simId);
				dtl.setSmltMdlSn(sno);
				dtl.setSmltRsltSn(String.valueOf(j));
				dtl.setRelEventCd(eventCd);
				dtl.setPsgFcltCd(chk);

				String runDttm = dto.getStartTime().replace("T", " ").substring(0, 19);
				dtl.setSmltExcnDt(runDttm);
				
				dtl.setSmltActlDt(t2[j].replace("T", " ").substring(0, 19));
				if(wtngPaxCnt.length != 0){
					dtl.setWtngPsgCnt(Integer.parseInt(wtngPaxCnt[j]));
				}
				dtl.setTrnstPsgCnt(Integer.parseInt(passPaxCnt[j]));
				dtl.setMinPrcsHr(calResultTime(minDealTime[j]));
				dtl.setAvgPrcsHr(calResultTime(avgDealTime[j]));
				dtl.setMaxPrcsHr(calResultTime(maxDealTime[j]));
				dtl.setMinWtngHr(calResultTime(minWtngTime[j]));
				dtl.setAvgWtngHr(calResultTime(avgWtngTime[j]));
				dtl.setMaxWtngHr(calResultTime(maxWtngTime[j]));
				dtl.setMinWtngLen(Float.parseFloat(minWtngLen[j]));
				dtl.setAvgWtngLen(Float.parseFloat(avgWtngLen[j]));
				dtl.setMaxWtngLen(Float.parseFloat(maxWtngLen[j]));
				collector.add(dtl);
			} 
		}
	}
	
	private String checkFcltCd(List<CastRsltFcltCdDto> fcltCdList, String fcltCd) {
		if (fcltCd == null || fcltCd.isBlank()) {
			return null;
		}
		
		SimRsltDto fcltDto = new SimRsltDto();
		fcltDto.setPaxFcltCd(fcltCd);
		
		for (int k = 0; k < fcltCdList.size(); k++) {
			if(fcltCd.equals(fcltCdList.get(k).getSmltFcltNm())) {
				return fcltCdList.get(k).getPsgFcltCd();
			}
		}		
		
		return null;
	}
	
	private void executeBatchInsert(List<SmltRsltDtlDto> list) {
		int batchSize = 1000;
		for (int i = 0; i < list.size(); i += batchSize) {
			int end = Math.min(i + batchSize, list.size());
			List<SmltRsltDtlDto> batchList = list.subList(i, end);
			
			Map<String, Object> paramMap = new HashMap<>();
			paramMap.put(LIST, batchList);
			castRestMapper.insertSimResultDtl(paramMap);
		}
	}

	/*
	 * private void executeDeleteLogic() { List<Object> delList =
	 * castRestMapper.retrieveDelSetInfo(); if (delList == null) return;
	 * 
	 * for(int i=0; i < delList.size(); i++) { // ODS삭제처리 시작 String delSimId =
	 * ((SimSetDto) delList.get(i)).getSmltId(); DwDelKeyValHstDto dwDto = new
	 * DwDelKeyValHstDto(); dwDto.setTblNm(TN_PM_SMLT_STNG);
	 * dwDto.setKey1Vl(delSimId); dwDto.setLoginUserId(REST);
	 * ServletRequestAttributes attributes = (ServletRequestAttributes)
	 * RequestContextHolder.getRequestAttributes(); if (attributes != null) {
	 * HttpServletRequest request = attributes.getRequest();
	 * dwDto.setLoginIpAddr(request.getRemoteAddr()); }
	 * castRestMapper.insertDwDelKeyValHst(dwDto); // ODS삭제처리 종료
	 * castRestMapper.deleteSimRsltDtl(delSimId);
	 * castRestMapper.deleteSimSetMst(delSimId); } }
	 */

	public int calResultTime(String str) {
		if (str == null || str.length() < 19) return 0;
		
		String hourStr = str.substring(11, 13);
		String minuteStr = str.substring(14, 16);
		String secondStr = str.substring(17, 19);
		return Integer.parseInt(hourStr) * 3600 + Integer.parseInt(minuteStr) * 60 + Integer.parseInt(secondStr);
	}
	
	private String buildReturnXml(boolean result) {
		StringBuilder sb = new StringBuilder();
		sb.append(XML_VERSION)
		  .append(System.lineSeparator())
		  .append(SOAP_ENVELOPE_START)
		  .append(System.lineSeparator())
		  .append(SOAP_BODY_START)
		  .append(System.lineSeparator())
		  .append(RES_SET_RESURCE_START)
		  .append(System.lineSeparator())
		  .append(INVOCATION_RESULT)
		  .append(result ? TRUE : FALSE)
		  .append(INVOCATION_RESULT_MESSAGE)
		  .append(result ? MESSAGE_OK : MESSAGE_NOT_OK)
		  .append("\"/>")
		  .append(System.lineSeparator())
		  .append(RES_SET_RESURCE_END)
		  .append(System.lineSeparator())
		  .append(SOAP_BODY_END)
		  .append(System.lineSeparator())
		  .append(SOAP_ENVELOPE_END);
		return sb.toString();
	}
	
	/**
    *  실적 파싱
    *
    * @Method Name : simRsltParser
    * @param ncDto
    * @param model
    * @return
    **/
	private void simRsltParser(Node node, String str, CastResReqDto simRslt, List<CastRsltRunDto> simRsltContentMap, CastRsltRunDto simRsltContent, CastWhatIfCntrlDto wDto) {
		processAttributes(node, str, simRslt, simRsltContentMap, simRsltContent, wDto);
		
		if (node.hasChildNodes()) {
			processChildNodes(node, simRslt, simRsltContentMap, simRsltContent, wDto);
		}
	}
	
	private void processAttributes(Node node, String str, CastResReqDto simRslt, List<CastRsltRunDto> simRsltContentMap, CastRsltRunDto simRsltContent, CastWhatIfCntrlDto wDto) {
		NamedNodeMap attributeMap = node.getAttributes();
		
		if(!"".equals(getAttributeValue(attributeMap, ID).orElse(""))) {
			colTable = getAttributeValue(attributeMap, ID).orElse("");
		} 
		if (RESOURCE_INFO.equals(str) || (RUN.equals(colTable) && M_COL.equals(str)) || (RESOURCE.equals(colTable) && M_COL.equals(str)) || (INTERVAL.equals(colTable) && M_COL.equals(str)) || (WHAT_IF_DEFINITION_TABLE.equals(colTable) && M_COL.equals(str))) {
			processStandarInfo(str, attributeMap, simRslt, simRsltContentMap, simRsltContent, wDto);
		}
	}
	
	private void processStandarInfo(String str, NamedNodeMap attributeMap, CastResReqDto simRslt, List<CastRsltRunDto> simRsltContentMap, CastRsltRunDto simRsltContent, CastWhatIfCntrlDto wDto) {
		if (RESOURCE_INFO.equals(str)) {
			processResourceInfo(attributeMap, simRslt, simRsltContentMap);
		} else if (RUN.equals(colTable) && M_COL.equals(str)) {
			processRunInfo(attributeMap, simRslt);
		} else if (RESOURCE.equals(colTable) && M_COL.equals(str)) {
			handleResourceMapping(attributeMap, simRsltContent);
		} else if (INTERVAL.equals(colTable) && M_COL.equals(str)) {
			processIntervalInfo(attributeMap, simRsltContent, simRsltContentMap);
		} else if (WHAT_IF_DEFINITION_TABLE.equals(colTable) && M_COL.equals(str)) {
			whatIfParser(attributeMap, wDto);
		}
	}
	
	private void processResourceInfo(NamedNodeMap attributeMap, CastResReqDto simRslt, List<CastRsltRunDto> contentMap) {
		simRslt.setResourceContent(contentMap);
		
		iterateAttributes(attributeMap, (name, value) -> {
			BiConsumer<CastResReqDto, String> setter = RESOURCE_INFO_MAP.get(name);
			if (setter != null) {
				setter.accept(simRslt, value);
			}
		});
	}
	
	private void processRunInfo(NamedNodeMap attributeMap, CastResReqDto simRslt) {
		String localColName = "";
		String localColValue = "";
		
		for (int i = 0; i < attributeMap.getLength(); i++) {
			Node attNode = attributeMap.item(i);
			if (S_P_NAME.equals(attNode.getNodeName())) {
				localColName = attNode.getNodeValue();
			}
			if (S_VALUES.equals(attNode.getNodeName())) {
				localColValue = attNode.getNodeValue();
				break;
			}
		}
		
		if (!localColName.isEmpty()) {
			final String finalColName = localColName;
			final String finalColValue = localColValue;
			BiConsumer<CastResReqDto, String> setter = RUN_MAP.get(finalColName);
			if (setter != null) {
				setter.accept(simRslt, finalColValue);
			}
		}	
	}
	
	private void handleResourceMapping(NamedNodeMap attributeMap, CastRsltRunDto simRsltContent) {
		String localColName = "";
		
		for (int i = 0; i < attributeMap.getLength(); i++) {
			Node attNode = attributeMap.item(i);
			if (S_P_NAME.equals(attNode.getNodeName())) {
				localColName = attNode.getNodeValue();
				break;
			}
		}
		
		if (!localColName.isEmpty()) {
			final String finalColName = localColName;
			iterateAttributes(attributeMap, (name, value) -> {
				if (S_VALUES.equals(name) && BLOCK_RESOURCE_ID.equals(finalColName)) {
					simRsltContent.setBlockResourceID(value);
				}
			});
		}
	}
	
	private void processIntervalInfo(NamedNodeMap attributeMap, CastRsltRunDto simRsltContent, List<CastRsltRunDto> simRsltContentMap) {
		String localColName = "";
		String localColValue = "";
		
		for (int i = 0; i < attributeMap.getLength(); i++) {
			Node attNode = attributeMap.item(i);
			if (S_P_NAME.equals(attNode.getNodeName())) {
				localColName = attNode.getNodeValue();
			}
			if (S_VALUES.equals(attNode.getNodeName())) {
				localColValue = attNode.getNodeValue();
				break;
			}
		}
		
		if (!localColName.isEmpty()) {
			final String finalColName = localColName;
			final String finalColValue = localColValue;
			BiConsumer<CastRsltRunDto, String> setter = INTERVAL_MAP.get(finalColName);
			if (setter != null) {
				setter.accept(simRsltContent, finalColValue);
				if (QUEUE_LENGTH_CURRENT.equals(finalColName)) {
					simRsltContentMap.add(simRsltContent);
				}
			}
		}
	}
	private void processChildNodes(Node node, CastResReqDto simRslt, List<CastRsltRunDto> simRsltContentMap, CastRsltRunDto simRsltContent, CastWhatIfCntrlDto wDto) {
		NodeList nodeList = node.getChildNodes();
		for (int i = 0; i < nodeList.getLength(); i++) {
			Node childNode = nodeList.item(i);
			
			if (childNode.getNodeType() == Node.TEXT_NODE) {
				continue;
			}
			
			simRsltParser(childNode, childNode.getNodeName(), simRslt, simRsltContentMap, simRsltContent, wDto);
		}
	}
	
	private void iterateAttributes(NamedNodeMap attributeMap, BiConsumer<String, String> action) {
		for (int i = 0; i < attributeMap.getLength(); i++) {
			Node attNode = attributeMap.item(i);
			action.accept(attNode.getNodeName(), attNode.getNodeValue());
		}
	}

	@Override
	public String deleteResult(String param) {
        // 1. 초기 로그 기록 (Step 2)
        saveSimLog("4", "1");

        try {
        	// 2. XML 파싱 (XXE 보안 설정 적용)
            Document doc = parseXmlSafely(param);
            Element node = doc.getDocumentElement();
            
            CastResReqDto requestDto = new CastResReqDto();
            SessionUtils.setUserContext(requestDto, sessionService);
            
        	// 3. 노드 정보 추출 및 DTO 변환
            resourceDelete(node, null, requestDto);
            
            int result = castRestMapper.deleteCASTModel(requestDto);
            if (result < 1) {
            	return buildDeleteXml(false);
            }
            // 6. 응답 XML 빌드
            saveSimLog("4", "2");
            
            // 4. 리소스 타입별 처리 및 XML 생성
            return buildDeleteXml(true);
        } catch (IllegalStateException | ParserConfigurationException | SAXException | IOException e) {
            saveSimLog("4", "9");
		}
        
        return INVALID_REQUEST;
	}
	
	private void resourceDelete(Node node, String str, CastResReqDto sDto) {
		NamedNodeMap attributeMap = node.getAttributes();
		if (PARAMETER.equals(str)) {
			colTable = getAttributeValue(attributeMap, "id").orElse("");
			processResourceDelete(node, colTable, sDto);
		} else if (RESOURCE_DESCRIPTION.equals(str)) {
			String resourceType = getAttributeValue(attributeMap, RESOURCE_TYPE).orElse("");
			sDto.setResourceType(resourceType);
			String resourceId = getAttributeValue(attributeMap, RESOURCE_ID).orElse("");
			sDto.setResourceID(resourceId);
		}
		
		if (node.hasChildNodes()) {
			processResourceDeleteNodes(node, sDto);
		}
	}
	
	private void processResourceDelete(Node node, String str, CastResReqDto sDto) {
		if (RESOURCE_TYPE.equals(str)) {
			sDto.setResourceType(node.getTextContent());
		} else if (RESOURCE_ID.equals(str)) {
			sDto.setResourceID(node.getTextContent());
		}
	}
	
	private void processResourceDeleteNodes(Node node, CastResReqDto sDto) {
		NodeList nodeList = node.getChildNodes();
		for (int i = 0; i < nodeList.getLength(); i++) {
			Node childNode = nodeList.item(i);
			
			if (childNode.getNodeType() == Node.TEXT_NODE) {
				continue;
			}
			
			resourceDelete(childNode, childNode.getNodeName(), sDto);
		}
	}
	private String buildDeleteXml(boolean result) {
		StringBuilder sb = new StringBuilder();	    
		sb.append(XML_VERSION)
		  .append(System.lineSeparator())
		  .append(SOAP_ENVELOPE_START)
		  .append(System.lineSeparator())
		  .append(SOAP_BODY_START)
		  .append(System.lineSeparator())
		  .append(RES_DELETE_RESOURCE_START)
		  .append(System.lineSeparator())
		  .append(INVOCATION_RESULT)
		  .append(result ? TRUE : FALSE)
		  .append(INVOCATION_RESULT_MESSAGE)
		  .append(result ? MESSAGE_OK : MESSAGE_NOT_OK)
		  .append("\"/>")
		  .append(System.lineSeparator())
		  .append(RES_DELETE_RESOURCE_END)
		  .append(System.lineSeparator())
		  .append(SOAP_BODY_END)
		  .append(System.lineSeparator())
		  .append(SOAP_ENVELOPE_END);
		return sb.toString();
	}
	private CastModelDto saveModel(CastModelDto dto) throws IOException{
		saveSimLog("18", "1");
		CastModelDto rslt = new CastModelDto();

		SmltMdlDto model = new SmltMdlDto();
		PmAtchFileDto fdto = new PmAtchFileDto();

		CastModelDto chk = castRestMapper.checkCASTModel(dto);
		if (chk == null) {

			String newId = castRestMapper.retrieveNewCastModelId(dto);

			String savedPath = "";
			String storeFileNm = "";
			String yyyymm = "";
			String atchFileId = "";
			String atchFileSno = "";

			String ext = "";
			switch(dto.getResourceType()) {
				case CAST_MODEL: 
					ext = CAST_MODEL;
					model.setSmltMdlTypeCd("1");
					break;
				case CAST_EXPRESS_MODEL:
					ext = CAST_EXPRESS_MODEL;
					model.setSmltMdlTypeCd("2");
					break;
				default : 
					break;
			}
			yyyymm = EgovDateUtil.getCurrentDateAsString().substring(0, 6);
			// 1. 폴더 생성
			savedPath = CoreYamlRead.getDefaultPath() + File.separator;
			FileUtil.makeFolder(savedPath);
			
			savedPath += "PM" + File.separator;
			FileUtil.makeFolder(savedPath);

			savedPath += "M" + File.separator;
			FileUtil.makeFolder(savedPath);

			savedPath += yyyymm + File.separator;
			FileUtil.makeFolder(savedPath);
			if (dto.getResourceID().equals("")) {
				model.setSmltMdlExpln(newId);
				storeFileNm = savedPath + DigestUtils.sha256Hex(newId + "." + ext);
			} else {
				model.setSmltMdlExpln(dto.getResourceID());
				storeFileNm = savedPath + DigestUtils.sha256Hex(dto.getResourceID() + "." + ext);
			}

			
			try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(storeFileNm),StandardCharsets.UTF_8))) 
			{
				writer.write(dto.getValues());
			} catch (IOException e) {
				saveSimLog("18", "9");
			} 

			atchFileId = castRestMapper.retrieveIdMaxPk();

			model.setSmltMdlFilePathNm(atchFileId);
			model.setSmltMdlSn(newId);
			
			castRestMapper.insertCASTModel(model);

			fdto.setAtchFileSn(atchFileSno);

			atchFileSno = castRestMapper.retrieveSnoMaxPk(fdto);

			fdto.setAtchFileId(atchFileId);
			if (dto.getResourceID().equals("")) {
				fdto.setAtchFileNm(newId + ".txt");
			} else {
				fdto.setAtchFileNm(dto.getResourceID() + ".txt");
			}
			fdto.setStrgFileNm(storeFileNm);
			fdto.setAtchFilePathNm("remote:" + dto.getResourceID() + ".txt");
			fdto.setAtchFileSn("1");
			fdto.setAtchFileTaskSeCd("M");
			fdto.setAtchFileTypeCd("E01");
			fdto.setAtchFileSz("100");
			fdto.setAtchFileExtnNm("txt");
			fdto.setLoginUserId("system");
			fdto.setFrstRgtrId("system");
			castRestMapper.insertAtchFile(fdto);
		} else {
			try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(chk.getFileNm()),StandardCharsets.UTF_8))){
				writer.write(dto.getValues());
			} catch (IOException e) {
				 saveSimLog("18", "9");
			}
			castRestMapper.updateCASTModel(dto);
		}
		return rslt;
	}
	
	private void modelParser(Node node, CastModelDto mDto) {
		if (node.hasAttributes()) {
			NamedNodeMap attributeMap = node.getAttributes();
			int attributeLength = attributeMap.getLength();

			for (int i = 0; i < attributeLength; i++) {
				Node attNode = attributeMap.item(i);
				String nodeName =attNode.getNodeName();
				
				 switch (nodeName) {
		            case RESOURCE_TYPE:
		            	mDto.setResourceType(attNode.getNodeValue());
		            	break;
		            case RESOURCE_ID:
		            	mDto.setResourceID(attNode.getNodeValue());
		            	break;
		            case AUTHOR : 
		            	mDto.setAuthor(attNode.getNodeValue());
		            	break;
		            case DESCRIPTION:
		            	mDto.setDescription(attNode.getNodeValue());
		            	break;
		            case LAST_MODIFIED:
		            	mDto.setLastModified(attNode.getNodeValue());
		            	break;
		            case S_VALUES : 
		            	mDto.setValues(attNode.getNodeValue());
		            	break;
		            default :
		            	break;
				 }
			}
		}
		if (node.hasChildNodes()) {
			NodeList nodeList = node.getChildNodes();

			int nodeLength = nodeList.getLength();

			for (int i = 0; i < nodeLength; i++) {

				Node childNode = nodeList.item(i);
				if (childNode.getNodeType() == Node.TEXT_NODE) {
					continue;
				}
				modelParser(nodeList.item(i), mDto);
			}
		}
	}
	/**
     * handleWhatIfControl 처리 (상당히 복잡한 XML 구조)
     */
    private void handleWhatIfControl(CastReqGetResourceDto idto, StringBuilder sb) {
    	saveSimLog("20", "1");
    	CastWhatIfCntrlDto wi = castRestMapper.retrieveWhatIfCntrl(idto);
		
		sb.append(XML_VERSION);
		sb.append(System.lineSeparator());
        sb.append(SOAP_ENVELOPE_START);
		sb.append(System.lineSeparator());
        sb.append(TAB_ONE).append(SOAP_BODY_START);
		sb.append(System.lineSeparator());
		sb.append(TAB_TWO).append(RES_GET_RESOURCE_START);
		sb.append(System.lineSeparator());
		if(wi != null) {
			sb.append(TAB_TWO).append("<").append(RESOURCE_INFO).append(" ").append(RESOURCE_TYPE).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(RESOURCE_ID).append("=").append(FNC_S_QUOT_ONE).append(idto.getResourceID()).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(AUTHOR).append("=").append(FNC_S_QUOT_ONE).append(DEFAULT_AUTHOR).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(DESCRIPTION).append("=").append(FNC_S_QUOT_ONE).append(GENERIC_TABLE).append(FNC_S_QUOT_ONE).append(" ");
			sb.append(LAST_MODIFIED).append("=").append(FNC_S_QUOT_ONE).append(wi.getLastModified()).append(FNC_S_QUOT_ONE).append("/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_START);
			sb.append(System.lineSeparator());
			sb.append(TAB_FOUR).append(M_TABLE_REQ_START).append(0).append(FRIENDLYNAME).append(WHAT_IF_DEFINITION_TABLE).append(XML_ID).append(WHAT_IF_DEFINITION_TABLE).append(FNC_S_QUOT_ONE).append(">");
			sb.append(System.lineSeparator());
        	WI_FIELD_MAP.forEach((xmlTag, tsFieldInfo) -> {
        		Object value = tsFieldInfo.extractor.apply(wi);
        		String tagValue;
        		if (value == null) {
        			tagValue = "";
        		} else {
        			tagValue = (String) value;
        		}
        		sb.append(TAB_FIVE).append(M_COL_START + P_ENUM_TYPE).append(FNC_S_QUOT_ONE).append(FNC_S_QUOT_ONE);
    			sb.append(P_FRIENDLY_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE).append(" ");
    			sb.append(tsFieldInfo.pKind);
    			sb.append(PROPERTY_P_NAME).append(FNC_S_QUOT_ONE).append(fnPascalCase(xmlTag)).append(FNC_S_QUOT_ONE);
    			sb.append(PROPERTY_VALUES).append(FNC_S_QUOT_ONE).append(tagValue).append(FNC_S_QUOT_ONE).append("/>");
    			sb.append(System.lineSeparator());
        	});
        	sb.append(TAB_FOUR).append(M_TABLE_END);
        	sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(RESOURCE_CONTENT_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(TRUE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
		}else {
        	sb.append(TAB_THREE).append(INVOCATION_RESULT);
			sb.append(FALSE).append(INVOCATION_RESULT_MESSAGE).append(MESSAGE_NOT_OK).append("\"/>");
			sb.append(System.lineSeparator());
			sb.append(TAB_TWO).append(RES_GET_RESOURCE_END);
			sb.append(System.lineSeparator());
			sb.append(TAB_ONE).append(SOAP_BODY_END);
			sb.append(System.lineSeparator());
			sb.append(SOAP_ENVELOPE_END);
        }	
    	saveSimLog("20", "2");    	
    }
    private void whatIfParser(NamedNodeMap attributeMap, CastWhatIfCntrlDto wDto) {
		String localColName = "";
		String localColValue = "";
		
		for (int i = 0; i < attributeMap.getLength(); i++) {
			Node attNode = attributeMap.item(i);
			if (S_P_NAME.equals(attNode.getNodeName())) {
				localColName = attNode.getNodeValue();
			}
			if (S_VALUES.equals(attNode.getNodeName())) {
				localColValue = attNode.getNodeValue();
				break;
			}
		}
		if (!localColName.isEmpty()) {
			final String finalColName = localColName;
			final String finalColValue = localColValue;
			BiConsumer<CastWhatIfCntrlDto, String> setter = WHATIF_MAP.get(finalColName);
			if (setter != null) {
				setter.accept(wDto, finalColValue);
			}
		}	
	}
    private int updateWhatIf(CastWhatIfCntrlDto dto){
    	saveSimLog("22", "1");
    	String[] sIDs = dto.getWhatIfRunId().split(",");
    	String[] sStts = dto.getStatus().split(",");
    	
    	List<CastWhatIfCntrlDto> whatIfIdList = castRestMapper.checkWhatIfIdList(dto);
    	int rRslt = 0;
    	for (int j = 0; j < sIDs.length; j++) {
			if (sIDs[j] == null || sIDs[j].isBlank() ) {
				continue;
			}
			CastWhatIfCntrlDto wDto = new CastWhatIfCntrlDto();
			ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
	        if (attributes != null) {
	        	HttpServletRequest request = attributes.getRequest();
	        	wDto.setLoginIpAddr(request.getRemoteAddr());
	        }
			wDto.setWhatIfRunId(sIDs[j]);
			wDto.setStatus(sStts[j]);
			
			rRslt += castRestMapper.updateWhatIfDefinitionTableStts(wDto);
			whatIfIdList.removeIf(vo -> vo.getWhatIfRunId().equals(wDto.getWhatIfRunId()));
    	}
    	if(!whatIfIdList.isEmpty()) {
    		for(int i=0; i < whatIfIdList.size(); i++) {
    			CastWhatIfCntrlDto whatIf = new CastWhatIfCntrlDto();
    			whatIf.setWhatIfRunId(whatIfIdList.get(i).getWhatIfRunId());
    			rRslt += castRestMapper.deleteWhatIfDefinitionTable(whatIf);
    		}
    	}
		saveSimLog("22", "2");
		return rRslt;
    }
}
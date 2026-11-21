package aoms.pm.castapi.service.statics;

import static aoms.pm.castapi.service.statics.CastApiConstants.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;

import aoms.pm.cmmn.dto.CastCheckInCounterServiceTimeDto;
import aoms.pm.cmmn.dto.CastCheckinTypeDto;
import aoms.pm.cmmn.dto.CastCounterAllocationDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblDptgDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblEmigDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblImmigDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblScrtyCntrlDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblTrnstScrtyCntrlDto;
import aoms.pm.cmmn.dto.CastFlightScheduleDto;
import aoms.pm.cmmn.dto.CastResReqDto;
import aoms.pm.cmmn.dto.CastRptStngHrGroupCntrlDto;
import aoms.pm.cmmn.dto.CastRsltRunDto;
import aoms.pm.cmmn.dto.CastSelfCheckInCountAndBagDropDto;
import aoms.pm.cmmn.dto.CastWhatIfCntrlDto;

public final class CastApiFieldMaps {
    private CastApiFieldMaps() {
        throw new UnsupportedOperationException("생성자를 제공하지 않습니다.");
    }

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
    private static final String DOMSTATUS = "DOMSTATUS";
    private static final String T1 = "T1";
    private static final String T2 = "T2";
    private static final String TRAVELCLASS = "TRAVELCLASS";
    private static final String GROUPSTATUS = "GROUPSTATUS";
    private static final String CHECKINTYPE = "CHECKINTYPE";
    private static final String NONFUNCTIONALSTATUS = "NONFUNCTIONALSTATUS";
    private static final String CHECKINALLOCTYPE = "CHECKINALLOCTYPE";
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
    private static final String P_KIND_STRING = "PKind=\"String\"";
    private static final String P_KIND_INTEGER = "PKind=\"Integer\"";
    private static final String P_KIND_FLOAT = "PKind=\"Float\"";
    private static final String P_KIND_DURATION = "PKind=\"Duration\"";
    private static final String P_KIND_DATE_TIME = "PKind=\"Date/Time\"";
    private static final String SIMULATION_RESULT_SUFFIX = "SimulationResultSuffix";
    private static final String STATUS = "Status";
    private static final String WHAT_IF_RUN_ID = "WhatIfRunID";

    // FS (Flight Schedule)
    public static class FsFieldInfo {
        public final String pKind;
        public final Function<CastFlightScheduleDto, Object> extractor;

        FsFieldInfo(String pKind, Function<CastFlightScheduleDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, FsFieldInfo> FS_FIELD_MAP = new LinkedHashMap<>();
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

    // CA (카운터 할당)
    public static class CaFieldInfo {
        public final String pKind;
        public final Function<CastCounterAllocationDto, Object> extractor;

        CaFieldInfo(String pKind, Function<CastCounterAllocationDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, CaFieldInfo> CA_FIELD_MAP = new LinkedHashMap<>();
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

    // SBD
    public static class SbdFieldInfo {
        public final String pKind;
        public final Function<CastSelfCheckInCountAndBagDropDto, Object> extractor;

        SbdFieldInfo(String pKind, Function<CastSelfCheckInCountAndBagDropDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, SbdFieldInfo> SBD_FIELD_MAP = new LinkedHashMap<>();
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

    // 서비스 타임
    public static class StFieldInfo {
        public final String pKind;
        public final Function<CastCheckInCounterServiceTimeDto, Object> extractor;

        StFieldInfo(String pKind, Function<CastCheckInCounterServiceTimeDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, StFieldInfo> ST_FIELD_MAP = new LinkedHashMap<>();
    static {
        ST_FIELD_MAP.put(AIRLINE, new StFieldInfo(P_KIND_STRING, CastCheckInCounterServiceTimeDto::getAirline));
        ST_FIELD_MAP.put(SERVICE_TIME, new StFieldInfo(P_KIND_FLOAT, CastCheckInCounterServiceTimeDto::getServiceTime));
    }

    // 체크인카운터
    public static class CtFieldInfo {
        public final String pKind;
        public final Function<CastCheckinTypeDto, Object> extractor;

        CtFieldInfo(String pKind, Function<CastCheckinTypeDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, CtFieldInfo> CT_FIELD_MAP = new LinkedHashMap<>();
    static {
        CT_FIELD_MAP.put(AIRLINE_CODE, new CtFieldInfo(P_KIND_STRING, CastCheckinTypeDto::getAirlineCode));
        CT_FIELD_MAP.put(COUNTER_SHARE, new CtFieldInfo(P_KIND_FLOAT, CastCheckinTypeDto::getCounterShare));
        CT_FIELD_MAP.put(COUNTER_VALUE, new CtFieldInfo(P_KIND_STRING, CastCheckinTypeDto::getCounterValue));
        CT_FIELD_MAP.put(KIOSK_SHARE, new CtFieldInfo(P_KIND_FLOAT, CastCheckinTypeDto::getKioskShare));
        CT_FIELD_MAP.put(KIOSK_VALUE, new CtFieldInfo(P_KIND_STRING, CastCheckinTypeDto::getKioskValue));
        CT_FIELD_MAP.put(MOBILE_SHARE, new CtFieldInfo(P_KIND_FLOAT, CastCheckinTypeDto::getMobileShare));
        CT_FIELD_MAP.put(MOBILE_VALUE, new CtFieldInfo(P_KIND_STRING, CastCheckinTypeDto::getMobileValue));
    }

    // 출국장
    public static class DgFieldInfo {
        public final String pKind;
        public final Function<CastFcltyOpngTblDptgDto, Object> extractor;

        DgFieldInfo(String pKind, Function<CastFcltyOpngTblDptgDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, DgFieldInfo> DG_FIELD_MAP = new LinkedHashMap<>();
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

    // 출국심사
    public static class EmFieldInfo {
        public final String pKind;
        public final Function<CastFcltyOpngTblEmigDto, Object> extractor;

        EmFieldInfo(String pKind, Function<CastFcltyOpngTblEmigDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, EmFieldInfo> EM_FIELD_MAP = new LinkedHashMap<>();
    static {
        EM_FIELD_MAP.put(TERMINAL, new EmFieldInfo(P_KIND_STRING, CastFcltyOpngTblEmigDto::getTerminal));
        EM_FIELD_MAP.put(LOCATION, new EmFieldInfo(P_KIND_STRING, CastFcltyOpngTblEmigDto::getLocation));
        EM_FIELD_MAP.put(IMMIGRATION_TYPE, new EmFieldInfo(P_KIND_STRING, CastFcltyOpngTblEmigDto::getImmigrationType));
        EM_FIELD_MAP.put(CURRENT_NUMBER_OF_LANES, new EmFieldInfo(P_KIND_INTEGER, CastFcltyOpngTblEmigDto::getCurrentNumberofLanes));
    }

    // 보안검색대
    public static class ScFieldInfo {
        public final String pKind;
        public final Function<CastFcltyOpngTblScrtyCntrlDto, Object> extractor;

        ScFieldInfo(String pKind, Function<CastFcltyOpngTblScrtyCntrlDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, ScFieldInfo> SC_FIELD_MAP = new LinkedHashMap<>();
    static {
        SC_FIELD_MAP.put(TERMINAL, new ScFieldInfo(P_KIND_STRING, CastFcltyOpngTblScrtyCntrlDto::getTerminal));
        SC_FIELD_MAP.put(LOCATION, new ScFieldInfo(P_KIND_STRING, CastFcltyOpngTblScrtyCntrlDto::getLocation));
        SC_FIELD_MAP.put(CURRENT_NUMBER_OF_LANES, new ScFieldInfo(P_KIND_INTEGER, CastFcltyOpngTblScrtyCntrlDto::getCurrentNumberofLanes));
    }

    // 입국심사
    public static class ImFieldInfo {
        public final String pKind;
        public final Function<CastFcltyOpngTblImmigDto, Object> extractor;

        ImFieldInfo(String pKind, Function<CastFcltyOpngTblImmigDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, ImFieldInfo> IM_FIELD_MAP = new LinkedHashMap<>();
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

    // 환승장
    public static class TsFieldInfo {
        public final String pKind;
        public final Function<CastFcltyOpngTblTrnstScrtyCntrlDto, Object> extractor;

        TsFieldInfo(String pKind, Function<CastFcltyOpngTblTrnstScrtyCntrlDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, TsFieldInfo> TS_FIELD_MAP = new LinkedHashMap<>();
    static {
        TS_FIELD_MAP.put(TERMINAL, new TsFieldInfo(P_KIND_STRING, CastFcltyOpngTblTrnstScrtyCntrlDto::getTerminal));
        TS_FIELD_MAP.put(LOCATION, new TsFieldInfo(P_KIND_STRING, CastFcltyOpngTblTrnstScrtyCntrlDto::getLocation));
        TS_FIELD_MAP.put(START_DATE, new TsFieldInfo(P_KIND_DATE_TIME, CastFcltyOpngTblTrnstScrtyCntrlDto::getStartDate));
        TS_FIELD_MAP.put(END_DATE, new TsFieldInfo(P_KIND_DATE_TIME, CastFcltyOpngTblTrnstScrtyCntrlDto::getEndDate));
        TS_FIELD_MAP.put(START_TIME, new TsFieldInfo(P_KIND_DURATION, CastFcltyOpngTblTrnstScrtyCntrlDto::getStartTime));
        TS_FIELD_MAP.put(END_TIME, new TsFieldInfo(P_KIND_DURATION, CastFcltyOpngTblTrnstScrtyCntrlDto::getEndTime));
        TS_FIELD_MAP.put(CURRENT_NUMBER_OF_LANES, new TsFieldInfo(P_KIND_INTEGER, CastFcltyOpngTblTrnstScrtyCntrlDto::getCurrentNumberofLanes));
    }
    public static final Map<String, RsFieldInfo> RS_FIELD_MAP = new LinkedHashMap<>();
    static {
        RS_FIELD_MAP.put(SCHEDULEDHOUR, new RsFieldInfo(P_KIND_INTEGER, CastRptStngHrGroupCntrlDto::getScheduledHour));
        RS_FIELD_MAP.put(GROUPNAME, new RsFieldInfo(P_KIND_STRING, CastRptStngHrGroupCntrlDto::getGroupName));
    }
    public static class RsFieldInfo {
        public final String pKind;
        public final Function<CastRptStngHrGroupCntrlDto, Object> extractor;

        RsFieldInfo(String pKind, Function<CastRptStngHrGroupCntrlDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    // What-If
    public static class WiFieldInfo {
        public final String pKind;
        public final Function<CastWhatIfCntrlDto, Object> extractor;

        WiFieldInfo(String pKind, Function<CastWhatIfCntrlDto, Object> extractor) {
            this.pKind = pKind;
            this.extractor = extractor;
        }
    }

    public static final Map<String, WiFieldInfo> WI_FIELD_MAP = new LinkedHashMap<>();
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

    public static final Map<String, BiConsumer<CastResReqDto, String>> RESOURCE_INFO_MAP = new HashMap<>();
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

    public static final Map<String, BiConsumer<CastResReqDto, String>> RUN_MAP = new HashMap<>();
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

    public static final Map<String, BiConsumer<CastRsltRunDto, String>> INTERVAL_MAP = new HashMap<>();
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

    public static final Map<String, BiConsumer<CastWhatIfCntrlDto, String>> WHATIF_MAP = new HashMap<>();
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
}

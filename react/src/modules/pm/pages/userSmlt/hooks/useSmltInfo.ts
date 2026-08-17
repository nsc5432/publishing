import { useEffect, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { unwrap } from '@/api/pm/result';
import type { ApiError } from '@/types/api.types';
import { TERMINALS, type TerminalKind } from '../types';

/**
 * 조건 설정 진입 정보.
 *
 * 편집 대상 시뮬레이션 ID 는 터미널마다 따로 잡히고, 탭 조회·저장이 모두 이 ID 를 쓴다.
 * 화면이 T1/T2 패널을 함께 그리므로 두 터미널을 한 번에 받아 둔다.
 */
export interface SmltInfoState {
    /** 터미널별 편집 대상 시뮬레이션 ID (아직 못 받았으면 '') */
    smltIds: Record<TerminalKind, string>;
    /** 기준일자 (yyyyMMdd) */
    ymd: string;
    /** 마지막 저장 시각 (yyyyMMddHHmmss, 없으면 '') */
    saveDt: string;
    error: string;
}

const FAIL_MESSAGE = '사용자 시뮬레이션 정보를 불러오지 못했습니다.';

const EMPTY: SmltInfoState = { smltIds: { T1: '', T2: '' }, ymd: '', saveDt: '', error: '' };

export function useSmltInfo(ymd: string, reloadKey = 0): SmltInfoState {
    const [state, setState] = useState<SmltInfoState>(EMPTY);

    useEffect(() => {
        // 기준일자가 없으면 잡을 대상이 없다 — 조회 전용 진입은 볼 시뮬레이션이 이미 정해져 있다.
        if (!ymd) {
            setState(EMPTY);
            return;
        }

        // 기준일자를 바꿔 다시 부르는 동안 이전 응답이 뒤늦게 덮어쓰지 않도록 막는다.
        let isCurrent = true;

        Promise.all(
            TERMINALS.map((tmnlId) =>
                userSmltService.getInfo(ymd, tmnlId).then((dto) => unwrap(dto, FAIL_MESSAGE)),
            ),
        )
            .then((infoList) => {
                if (!isCurrent) return;

                const smltIds = { T1: '', T2: '' } as Record<TerminalKind, string>;
                TERMINALS.forEach((tmnlId, index) => {
                    smltIds[tmnlId] = infoList[index].smltId;
                });

                setState({ smltIds, ymd: infoList[0].ymd, saveDt: infoList[0].saveDt, error: '' });
            })
            .catch((err: ApiError) => {
                if (isCurrent) setState({ ...EMPTY, error: err?.message || FAIL_MESSAGE });
            });

        return () => {
            isCurrent = false;
        };
    }, [ymd, reloadKey]);

    return state;
}

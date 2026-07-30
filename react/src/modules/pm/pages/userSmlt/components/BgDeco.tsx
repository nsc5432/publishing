/** 배경 데코 — 흐릿하게 깔리는 T1/T2 터미널 실루엣 (userSmlt.css 의 background-image) */
export function BgDeco() {
    return (
        <div className="bg-deco" aria-hidden="true">
            <span className="bg-deco__t1" />
            <span className="bg-deco__t2" />
        </div>
    );
}

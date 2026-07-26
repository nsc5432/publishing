import { useSyncExternalStore } from 'react';
import { loadingBar } from '@/lib/loading-bar';
import { AirplaneIcon } from '@/components/icons';
import LoadingImage from '@/assets/gif/loadingimage.gif';
/**
 * 로딩 바 컴포넌트
 * - 수동 사용: loadingBar.show() / loadingBar.hide()
 */
export function LoadingBar() {
    const { visible, fading, progress } = useSyncExternalStore(
        loadingBar.subscribe,
        loadingBar.getSnapshot,
        loadingBar.getServerSnapshot,
    );

    if (!visible) {
        document.body.style.overflow = 'unset';
        return null;
    }


    document.body.style.overflow = 'hidden';


    const isCompleting = progress >= 100;
    const transitionCss = isCompleting
        ? 'width 0.25s ease-out'
        : 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    const planeTransitionCss = isCompleting
        ? 'left 0.25s ease-out'
        : 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)';

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 10000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    pointerEvents: 'none',
                    opacity: fading ? 0 : 1,
                    transition: 'opacity 0.4s ease',
                }}
            >
                {/* 활주로 트랙 배경 */}
                <div
                    style={{
                        height: '3px',
                        background: 'rgba(99, 179, 237, 0.1)',
                        position: 'relative',
                        overflow: 'visible',
                    }}
                >
                    {/* 진행 바 */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, hsl(221,83%,45%) 0%, hsl(210,90%,55%) 60%, hsl(199,89%,65%) 100%)',
                            boxShadow: '0 0 10px rgba(14,165,233,0.55), 0 0 3px rgba(14,165,233,0.8)',
                            transition: transitionCss,
                            overflow: 'hidden',
                        }}
                    >
                        {/* 빛 반사 shimmer */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
                                animation: 'loading-bar-shimmer 1.8s ease-in-out infinite',
                            }}
                        />
                    </div>
                </div>

                {/* 활주로 중심선 (점선) */}
                <div
                    style={{
                        height: '1px',
                        background:
                            'repeating-linear-gradient(90deg, rgba(14,165,233,0.18) 0px, rgba(14,165,233,0.18) 14px, transparent 14px, transparent 28px)',
                    }}
                />

                {/* 비행기 아이콘 (진행 바 선단) */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-3px',
                        left: `${progress}%`,
                        transform: 'translateX(-50%)',
                        transition: planeTransitionCss,
                        color: 'hsl(199,89%,68%)',
                        filter: 'drop-shadow(0 0 5px rgba(14,165,233,0.75))',
                        lineHeight: 0,
                    }}
                >

                    <AirplaneIcon
                        className="w-5 h-5 text-white"
                        style={{ transform: 'rotate(90deg)', display: 'block' }} />
                </div>
            </div>
            <div>
                <img src={LoadingImage} />
            </div>
        </div>
    );
}

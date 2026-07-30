import { useUserInfo } from '@/hooks/useUserInfo';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface AuthorInfoProps {
    userKey: string | null;
}

export const AuthorInfo = ({ userKey }: AuthorInfoProps) => {
    const { data: userInfo, loading } = useUserInfo(userKey);

    // userKey가 없으면 표시하지 않음
    if (!userKey) {
        return null;
    }

    return (
        <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs">
            <User className="w-3 h-3" />
            {loading ? (
                <span className="text-gray-500">로딩중...</span>
            ) : userInfo ? (
                <>
                    <span className="font-medium">{userInfo.userNm}</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-600">{userInfo.deptNm}</span>
                </>
            ) : (
                <span className="text-gray-500">작성자 정보 없음</span>
            )}
        </Badge>
    );
};

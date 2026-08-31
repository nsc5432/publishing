import './noAccess.css';

interface NoAccessProps {
    title: string;
    description: string;
}

export function NoAccess({ title, description }: NoAccessProps) {
    return (
        <div className="no-access">
            <strong className="no-access__title">{title}</strong>
            <p className="no-access__desc">{description}</p>
        </div>
    );
}

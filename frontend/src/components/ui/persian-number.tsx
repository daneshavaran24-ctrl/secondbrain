import React from 'react';
import { toPersianNumbers } from '@/utils/persian-numbers';

interface PersianNumberProps {
    children: React.ReactNode;
    className?: string;
}

export const PersianNumber: React.FC<PersianNumberProps> = ({ children, className }) => {
    const convertToPersian = (node: React.ReactNode): React.ReactNode => {
        if (typeof node === 'string') {
            return toPersianNumbers(node);
        }
        if (typeof node === 'number') {
            return toPersianNumbers(node.toString());
        }
        if (React.isValidElement(node)) {
            return React.cloneElement(node, {
                ...node.props,
                children: React.Children.map(node.props.children, convertToPersian)
            });
        }
        if (Array.isArray(node)) {
            return node.map(convertToPersian);
        }
        return node;
    };

    return (
        <span className={`font-persian-nums ${className || ''}`}>
            {convertToPersian(children)}
        </span>
    );
};

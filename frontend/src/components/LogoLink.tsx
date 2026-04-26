import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '../assets/logo.jpg';

interface Props {
    clickable?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
    sm: 'h-10 w-auto',   // сайдбар и хедер
    md: 'h-16 w-auto',   // TrackPage хедер
    lg: 'h-24 w-auto',   // логин/регистрация
};

function getDashboardPath(role?: string): string {
    if (role === 'SELLER')   return '/dashboard/seller/items';
    if (role === 'ADMIN')    return '/dashboard/admin/items';
    if (role === 'CUSTOMER') return '/dashboard/customer/orders';
    return '/';
}

export function LogoLink({ clickable = true, size = 'md' }: Props) {
    const { user } = useAuth();

    const img = (
        <img
            src={logo}
            alt="TAS Logistic"
            className={`${SIZE_CLASSES[size]} object-contain`}
        />
    );

    if (!clickable) {
        return <div className="cursor-default">{img}</div>;
    }

    return (
        <Link to={getDashboardPath(user?.role)} className="cursor-pointer">
            {img}
        </Link>
    );
}
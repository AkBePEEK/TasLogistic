import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '../assets/logo.jpg';
const SIZE_CLASSES = {
    sm: 'h-10 w-auto', // сайдбар и хедер
    md: 'h-16 w-auto', // TrackPage хедер
    lg: 'h-24 w-auto', // логин/регистрация
};
function getDashboardPath(role) {
    if (role === 'SELLER')
        return '/dashboard/seller/items';
    if (role === 'ADMIN')
        return '/dashboard/admin/items';
    if (role === 'CUSTOMER')
        return '/dashboard/customer/orders';
    return '/';
}
export function LogoLink({ clickable = true, size = 'md' }) {
    const { user } = useAuth();
    const img = (_jsx("img", { src: logo, alt: "TAS Logistic", className: `${SIZE_CLASSES[size]} object-contain` }));
    if (!clickable) {
        return _jsx("div", { className: "cursor-default", children: img });
    }
    return (_jsx(Link, { to: getDashboardPath(user?.role), className: "cursor-pointer", children: img }));
}

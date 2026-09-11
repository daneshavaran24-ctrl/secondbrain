import { useState, useEffect } from 'react';

interface SidebarState {
    isOpen: boolean;
    width: number;
    paddingClass: string;
}

export const useSidebar = () => {
    const [sidebarState, setSidebarState] = useState<SidebarState>({
        isOpen: true,
        width: 320, // Default width
        paddingClass: 'pr-80'
    });

    useEffect(() => {
        const updateSidebarWidth = () => {
            const screenWidth = window.innerWidth;

            let width: number;
            let paddingClass: string;

            if (sidebarState.isOpen) {
                if (screenWidth < 768) {
                    // Mobile
                    width = 256; // w-64
                    paddingClass = 'pr-64';
                } else if (screenWidth < 1024) {
                    // Tablet
                    width = 288; // w-72
                    paddingClass = 'pr-72';
                } else if (screenWidth < 1280) {
                    // Desktop
                    width = 320; // w-80
                    paddingClass = 'pr-80';
                } else {
                    // XL
                    width = 336; // w-84
                    paddingClass = 'pr-84';
                }
            } else {
                if (screenWidth < 768) {
                    width = 48; // w-12
                    paddingClass = 'pr-12';
                } else {
                    width = 64; // w-16
                    paddingClass = 'pr-16';
                }
            }

            setSidebarState(prev => ({
                ...prev,
                width,
                paddingClass
            }));
        };

        updateSidebarWidth();
        window.addEventListener('resize', updateSidebarWidth);

        return () => window.removeEventListener('resize', updateSidebarWidth);
    }, [sidebarState.isOpen]);

    const toggleSidebar = () => {
        setSidebarState(prev => ({
            ...prev,
            isOpen: !prev.isOpen
        }));
    };

    return {
        ...sidebarState,
        toggleSidebar
    };
};

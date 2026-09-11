import { useEffect, useState } from 'react';
import { DomainType } from '@/types/sub-user';
import { 
  checkDomainAccess, 
  getAllowedDomains, 
  isSubUser, 
  getUserType,
  getSubUserInfo 
} from '@/middleware/domainFilter';

/**
 * Hook برای بررسی دسترسی به domain
 */
export const useDomainAccess = (domain: DomainType, permission: 'read' | 'write' | 'delete' = 'read') => {
  const [hasAccess, setHasAccess] = useState<boolean>(true);

  useEffect(() => {
    const access = checkDomainAccess(domain, permission);
    setHasAccess(access);
  }, [domain, permission]);

  return hasAccess;
};

/**
 * Hook برای دریافت لیست domains مجاز
 */
export const useAllowedDomains = () => {
  const [domains, setDomains] = useState<DomainType[]>([]);

  useEffect(() => {
    const allowedDomains = getAllowedDomains();
    setDomains(allowedDomains);
  }, []);

  return domains;
};

/**
 * Hook برای بررسی نوع کاربر
 */
export const useUserType = () => {
  const [userType, setUserType] = useState<'owner' | 'sub_user'>('owner');
  const [isSubUserType, setIsSubUserType] = useState<boolean>(false);

  useEffect(() => {
    const type = getUserType();
    const isSub = isSubUser();
    setUserType(type);
    setIsSubUserType(isSub);
  }, []);

  return { userType, isSubUser: isSubUserType };
};

/**
 * Hook برای دریافت اطلاعات Sub-User
 */
export const useSubUserInfo = () => {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const info = getSubUserInfo();
    setUserInfo(info);
  }, []);

  return userInfo;
};

import { useEffect, useState } from 'react';

const MOBILE_NAV_QUERY = '(max-width: 1023px)';

export default function useMobileNavPortal() {
  const [usePortal, setUsePortal] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_NAV_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_NAV_QUERY);
    const update = () => setUsePortal(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return usePortal;
}

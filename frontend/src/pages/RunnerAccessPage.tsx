import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const APP_SCHEME = 'gshrunner';

function isMobileDevice() {
  return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function RunnerAccessPage() {
  const { token } = useParams();
  const [status, setStatus] = useState<'launching' | 'fallback'>('launching');
  const mobileDevice = useMemo(() => isMobileDevice(), []);

  const browserRunnerUrl = useMemo(() => {
    if (!token) {
      return '/login';
    }
    return `${window.location.origin}/runner-portal/${token}`;
  }, [token]);

  const runnerInboxUrl = useMemo(() => {
    if (!token) {
      return '/runner-app';
    }
    return `/runner-app?token=${token}`;
  }, [token]);

  const appLaunchUrl = useMemo(() => {
    if (!token) {
      return '';
    }
    return `${APP_SCHEME}://pickup/${token}?webUrl=${encodeURIComponent(window.location.origin)}`;
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStatus('fallback');
      return;
    }

    if (!mobileDevice) {
      setStatus('fallback');
      return;
    }

    let hidden = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!hidden) {
        setStatus('fallback');
        window.location.replace(browserRunnerUrl);
      }
    }, 1400);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hidden = true;
        window.clearTimeout(fallbackTimer);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.location.href = appLaunchUrl;

    return () => {
      window.clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [appLaunchUrl, browserRunnerUrl, mobileDevice, token]);

  const launchStatusCopy = mobileDevice
    ? (status === 'launching' ? 'Trying to open the hybrid runner app.' : 'Opening browser fallback.')
    : 'Browser runner options are ready.';

  return (
    <section className="runner-portal-shell">
      <div className="runner-portal-frame">
        <article className="card runner-portal-hero">
          <p className="eyebrow">Runner Access</p>
          <h1>Opening Runner Pickup Flow</h1>
          <p>
            On mobile, this link tries the hybrid runner app first. In the browser, riders can either open the direct pickup portal or sign in to the same runner inbox flow that exists inside the app.
          </p>
          <div className="mini-list">
            <div>
              <strong>App launch</strong>
              <small>{launchStatusCopy}</small>
            </div>
            <div>
              <strong>Browser fallback</strong>
              <small>The same runner web portal and browser inbox stay available at all times.</small>
            </div>
          </div>
          <div className="action-row action-row-wrap">
            <a className="primary-button" href={browserRunnerUrl}>Open Direct Pickup Flow</a>
            <Link className="secondary-button" to={runnerInboxUrl}>Open Runner Inbox</Link>
          </div>
        </article>
      </div>
    </section>
  );
}

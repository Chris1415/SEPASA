import { fetchSiteInfos } from "@/services/GraphQlXmcService";
import { useEffect, useState } from "react";

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    async function CheckConnectivity() {
      const siteInfos = await fetchSiteInfos();
      if (siteInfos) {
        setIsOnline(true);
      }
    }

    CheckConnectivity();
  }, []);

  return (
    <>
      {isOnline ? (
        <div className="text-green-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5 inline-block"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <span className="pl-2 md:inline-block sm:hidden">Online</span>
        </div>
      ) : (
        <div className="text-red-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5 inline-block"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <span className="pl-2 md:inline-block sm:hidden">Offline</span>
        </div>
      )}
    </>
  );
}

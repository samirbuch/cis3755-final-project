import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import "@/styles/globals.css";

import Providers from '@/components/Providers';

import { Button, Flex, Text, Title } from "@mantine/core";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { ClockLoader } from "react-spinners";
// import Providers from "@/components/Providers";
import CenteredOnPage from "@/components/CenteredOnPage";

export default function App({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(true);
  const [isWideEnough, setIsWideEnough] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [showMeAnyway, setShowMeAnyway] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const mq = window.matchMedia("(min-width: 768px)");
    setIsWideEnough(mq.matches);
    setIsLoading(false);

    const handleResize = (e: MediaQueryListEvent) => {
      setIsWideEnough(e.matches);
    };
    mq.addEventListener("change", handleResize);

    return () => {
      mq.removeEventListener("change", handleResize);
    }
  }, []);

  if (isLoading || !isClient) {
    return (
      <Providers>
        <CenteredOnPage>
          <ClockLoader color="#FFF" size={50} />
        </CenteredOnPage>
      </Providers>
    )
  }

  if (!isWideEnough && !showMeAnyway) {
    return (
      <Providers>
        <CenteredOnPage>
          <Flex direction={"column"} gap="sm" align={"center"}>
            <ClockLoader color="#FFF" size={50} />
            <Title>Sorry!</Title>
            <Text>This experience is best viewed on a wider screen.</Text>

            <Button variant="transparent" onClick={() => setShowMeAnyway(true)}>
              I don&apos;t care, show me anyway
            </Button>
          </Flex>
        </CenteredOnPage>
      </Providers>
    )
  }

  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  )
}
import '@mantine/core/styles.css';
import "@/styles/globals.css";

import Providers from '@/components/Providers';

import { Flex, Text, Title } from "@mantine/core";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { ClockLoader } from "react-spinners";
// import Providers from "@/components/Providers";
import CenteredOnPage from "@/components/CenteredOnPage";

export default function App({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(true);
  const [isWideEnough, setIsWideEnough] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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
          <ClockLoader color="#000" size={50} />
        </CenteredOnPage>
      </Providers>
    )
  }

  if (!isWideEnough) {
    return (
      <Providers>
        <CenteredOnPage>
          <Flex direction={"column"} gap="sm" align={"center"}>
            <Title>Sorry!</Title>
            <Text>This experience is best viewed on a larger screen.</Text>
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
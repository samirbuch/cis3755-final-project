import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { Center, Flex, Text, Title } from "@mantine/core";
import CenteredOnPage from "@/components/CenteredOnPage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Your Time Is Limited</title>
        <meta name="description" content="A glimpse into your future" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <main>
          <CenteredOnPage>
            <Flex direction={"column"} gap="sm" align={"center"}>
              <Title size={"9rem"}>Your time is limited.</Title>
              <Text size="xl">A perspective on time, and the way we spend it</Text>
            </Flex>
          </CenteredOnPage>
        </main>
      </div>
    </>
  );
}

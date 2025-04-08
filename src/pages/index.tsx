"use client";

import Head from "next/head";
// import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { Flex, Text, Title } from "@mantine/core";
import CenteredOnPage from "@/components/CenteredOnPage";
import { useEffect, useRef } from "react";

import { createScope, animate, type Scope, createTimeline } from "animejs";

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<Scope>(null);

  useEffect(() => {
    if (!root.current) return;

    scope.current = createScope({ root: root.current }).add(scope => {
      // animate("#title", {
      //   opacity: [0, 1],
      //   translateY: ["10%", "0%"],
      //   duration: 1000,
      //   easing: "ease",
      //   delay: 500,
      // });

      createTimeline()
        .add("#title", {
          opacity: [0, 1],
          translateY: ["10%", "0%"],
          duration: 1000,
          easing: "ease",
          delay: 500,
        })
        .add("#subtitle", {
          opacity: [0, 1],
          translateY: ["10%", "0%"],
          duration: 500,
          easing: "ease",
        })

    })
  }, []);

  return (
    <>
      <Head>
        <title>Your Time Is Limited</title>
        <meta name="description" content="A glimpse into your future" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`${styles.page}`} ref={root}>
        <main>
          <CenteredOnPage>
            <Flex direction={"column"} gap="sm" align={"center"}>
              <Title id="title" size={"8rem"} opacity={0}>
                Your time is limited.
              </Title>
              <Text id="subtitle" size="xl" opacity={0}>
                A perspective on time, and the way we spend it
              </Text>
            </Flex>
          </CenteredOnPage>
        </main>
      </div>
    </>
  );
}

"use client";

import Head from "next/head";
// import Image from "next/image";
import { Button, Divider, Flex, Text, Title } from "@mantine/core";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { createScope, type Scope, createTimeline, stagger } from "animejs";

import styles from "@/styles/Home.module.css";
import CenteredOnPage from "@/components/CenteredOnPage";

export default function Home() {
  const router = useRouter();

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
        }, "+=100")
        .add(".choose", {
          opacity: [0, 1],
          // translateY: ["10%", "0%"],
          duration: 1000,
          easing: "ease"
        }, stagger(200, { start: "+=100" }));

      scope.add("transition", (to: string) => {
        // timeline.reverse();
        createTimeline()
          .add("#title", {
            opacity: [1, 0],
            translateY: ["0%", "10%"],
            duration: 500,
            easing: "ease",
            delay: 500,
          }, "<<")
          .add("#subtitle", {
            opacity: [1, 0],
            translateY: ["0%", "10%"],
            duration: 500,
            easing: "ease",
          }, "<+=100")
          .add(".choose", {
            opacity: [1, 0],
            // translateY: ["10%", "0%"],
            duration: 500,
            easing: "ease"
          }, stagger(200, { start: "+=50" }))
          .call(() => {
            router.push(`/story/timeline-${to}.json`);
          }, "<");

      });

    })
  }, [router]);

  function goToStoryline(storyline: string) {
    scope.current?.methods.transition(storyline);
  }

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
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%"
          }}>
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
          </div>
          <div style={{ paddingTop: "80vh", opacity: 0 }} className="choose">
            <Flex direction={"column"} gap="sm" align={"center"}>
              <Text className="choose">Choose your storyline:</Text>
              <Flex gap="sm">
                <Button
                  className="choose"
                  variant="transparent"
                  onClick={() => goToStoryline("ari")}
                >
                  Ari
                </Button>
                <Divider className="choose" orientation="vertical" />
                <Button
                  className="choose"
                  variant="transparent"
                  onClick={() => goToStoryline("jess")}
                >
                  Jess
                </Button>
                <Divider className="choose" orientation="vertical" />
                <Button
                  className="choose"
                  variant="transparent"
                  onClick={() => goToStoryline("samir")}
                >
                  Samir
                </Button>
              </Flex>
            </Flex>
          </div>
        </main>
      </div>
    </>
  );
}

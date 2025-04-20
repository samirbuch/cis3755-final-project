"use client";

import React from "react";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({});

export default function Providers({ children }: { children?: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      <Notifications />
      {children}
    </MantineProvider>
  )
}
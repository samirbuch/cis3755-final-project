"use client";

import React from "react";
import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({});

export default function Providers({ children }: { children?: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      {children}
    </MantineProvider>
  )
}